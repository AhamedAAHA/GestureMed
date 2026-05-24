import { Router } from 'express';
import { body } from 'express-validator';
import MedicalNote from '../models/MedicalNote.js';
import Doctor from '../models/Doctor.js';
import { authenticate, authorize, attachUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, attachUser);

router.get('/', authorize('doctor', 'admin'), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.requestId) filter.requestId = req.query.requestId;
    if (req.query.patientId) filter.patientId = req.query.patientId;

    const notes = await MedicalNote.find(filter)
      .populate('authorId', 'name email')
      .populate('patientId', 'name roomNumber')
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorize('doctor', 'admin'),
  [
    body('requestId').notEmpty(),
    body('patientId').notEmpty(),
    body('content').trim().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      let doctorId = null;
      if (req.user.role === 'doctor') {
        const doctor = await Doctor.findOne({ userId: req.user.id });
        doctorId = doctor?._id;
      }

      const note = await MedicalNote.create({
        ...req.body,
        authorId: req.user.id,
        doctorId,
      });

      const populated = await MedicalNote.findById(note._id)
        .populate('authorId', 'name email')
        .populate('patientId', 'name');

      res.status(201).json(populated);
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', authorize('doctor', 'admin'), async (req, res, next) => {
  try {
    const note = await MedicalNote.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (req.body.content) note.content = req.body.content;
    await note.save();
    res.json(note);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize('doctor', 'admin'), async (req, res, next) => {
  try {
    await MedicalNote.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
