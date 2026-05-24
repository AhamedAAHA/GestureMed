import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, attachUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { improveMessage, detectUrgency, translateMessage } from '../services/openaiService.js';
import { triageScore, validateMessage } from '../services/javaService.js';

const router = Router();
router.use(authenticate, attachUser);

router.post(
  '/improve-message',
  [body('message').trim().notEmpty(), body('language').optional().isIn(['en', 'ta', 'si'])],
  validate,
  async (req, res, next) => {
    try {
      const { message, language = 'en' } = req.body;
      const validation = await validateMessage(message);
      if (!validation.valid) {
        return res.status(400).json({ message: 'Invalid message', issues: validation.issues });
      }
      const improved = await improveMessage(message, language);
      const translated = await translateMessage(improved, language);
      res.json({ improved, translated });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/detect-urgency',
  [body('message').trim().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { message } = req.body;
      const aiResult = await detectUrgency(message);
      const triage = await triageScore(message, aiResult.urgency);
      let urgency = aiResult.urgency;
      if (triage.score >= 60) urgency = 'Emergency';
      else if (triage.score >= 25 && urgency === 'Normal') urgency = 'Warning';

      res.json({
        urgency,
        reason: aiResult.reason,
        score: triage.score,
        triageSource: triage.source,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
