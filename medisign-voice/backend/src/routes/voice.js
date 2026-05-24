import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { generateSpeech } from '../services/elevenLabsService.js';

const router = Router();
router.use(authenticate);

router.post(
  '/generate',
  [body('text').trim().notEmpty(), body('language').optional().isIn(['en', 'ta', 'si'])],
  validate,
  async (req, res, next) => {
    try {
      const { text, language = 'en' } = req.body;
      const result = await generateSpeech(text, language);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
