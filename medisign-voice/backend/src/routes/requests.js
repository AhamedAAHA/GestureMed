import { Router } from 'express';
import { body } from 'express-validator';
import CommunicationRequest from '../models/CommunicationRequest.js';
import Patient from '../models/Patient.js';
import { authenticate, authorize, attachUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { improveMessage, detectUrgency, translateMessage } from '../services/openaiService.js';
import { triageScore, validateMessage } from '../services/javaService.js';
import { generateSpeech } from '../services/elevenLabsService.js';
import { logAudit } from '../services/auditService.js';

const router = Router();
router.use(authenticate, attachUser);

async function enrichRequest(data) {
  const validation = await validateMessage(data.rawMessage);
  if (!validation.valid) {
    const err = new Error(validation.issues?.join(', ') || 'Invalid message');
    err.status = 400;
    throw err;
  }

  const improved = await improveMessage(data.rawMessage, data.language);
  const translated = await translateMessage(improved, data.language);
  const aiUrgency = await detectUrgency(improved);
  const triage = await triageScore(improved, aiUrgency.urgency);

  let urgency = aiUrgency.urgency;
  if (triage.score >= 60) urgency = 'Emergency';
  else if (triage.score >= 25 && urgency === 'Normal') urgency = 'Warning';

  return {
    improvedMessage: improved,
    translatedMessage: translated,
    urgency,
    urgencyScore: triage.score,
    isPinned: urgency === 'Emergency',
    triageNotes: triage.reason || aiUrgency.reason,
  };
}

router.get('/', authorize('doctor', 'admin', 'patient'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.urgency) filter.urgency = req.query.urgency;
    if (req.query.status) filter.status = req.query.status;

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient) return res.json([]);
      filter.patientId = patient._id;
    }

    const requests = await CommunicationRequest.find(filter)
      .populate({
        path: 'patientId',
        populate: { path: 'wardId' },
      })
      .populate('handledBy', 'name email')
      .sort({ isPinned: -1, urgency: -1, createdAt: -1 });

    res.json(requests);
  } catch (err) {
    next(err);
  }
});

router.get('/analytics', authorize('admin'), async (req, res, next) => {
  try {
    const [totalPatients, emergencyAlerts, pendingRequests, handledRequests] =
      await Promise.all([
        Patient.countDocuments(),
        CommunicationRequest.countDocuments({ urgency: 'Emergency' }),
        CommunicationRequest.countDocuments({ status: 'pending' }),
        CommunicationRequest.countDocuments({ status: 'handled' }),
      ]);
    res.json({ totalPatients, emergencyAlerts, pendingRequests, handledRequests });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorize('patient'),
  [body('rawMessage').trim().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (!patient) return res.status(404).json({ message: 'Patient profile not found' });

      const language = req.body.language || patient.preferredLanguage || 'en';
      const enriched = await enrichRequest({
        rawMessage: req.body.rawMessage,
        language,
      });

      let voiceBase64 = null;
      try {
        const speech = await generateSpeech(enriched.improvedMessage, language);
        voiceBase64 = speech.audioBase64;
      } catch (voiceErr) {
        console.warn('Voice generation skipped:', voiceErr.message);
      }

      const request = await CommunicationRequest.create({
        patientId: patient._id,
        createdBy: req.user.id,
        rawMessage: req.body.rawMessage,
        improvedMessage: enriched.improvedMessage,
        translatedMessage: enriched.translatedMessage,
        language,
        source: req.body.source || 'text',
        detectedSigns: req.body.detectedSigns || [],
        urgency: req.body.urgency || enriched.urgency,
        urgencyScore: enriched.urgencyScore,
        isPinned: enriched.isPinned,
        triageNotes: enriched.triageNotes,
        voiceBase64,
      });

      await logAudit({
        action: 'CREATE',
        entity: 'CommunicationRequest',
        entityId: request._id,
        userId: req.user.id,
        details: { urgency: request.urgency },
        ip: req.ip,
      });

      const populated = await CommunicationRequest.findById(request._id).populate({
        path: 'patientId',
        populate: { path: 'wardId' },
      });

      res.status(201).json(populated);
    } catch (err) {
      next(err);
    }
  }
);

router.patch('/:id/handled', authorize('doctor', 'admin'), async (req, res, next) => {
  try {
    const request = await CommunicationRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'handled',
        handledBy: req.user.id,
        handledAt: new Date(),
        isPinned: false,
      },
      { new: true }
    ).populate({ path: 'patientId', populate: { path: 'wardId' } });

    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize('admin', 'patient'), async (req, res, next) => {
  try {
    const request = await CommunicationRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (req.user.role === 'patient' && request.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    request.status = 'cancelled';
    await request.save();
    res.json({ message: 'Request cancelled' });
  } catch (err) {
    next(err);
  }
});

export default router;
