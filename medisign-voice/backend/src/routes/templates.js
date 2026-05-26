import { Router } from 'express';
import { body } from 'express-validator';
import EmergencyTemplate from '../models/EmergencyTemplate.js';
import { authenticate, authorize, attachUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, attachUser);

router.get('/', async (req, res, next) => {
  try {
    const templates = await EmergencyTemplate.find({ isActive: true }).sort({ key: 1 });
    res.json(templates);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorize('admin'),
  [
    body('key').trim().notEmpty().withMessage('Key is required.'),
    body('label.en').trim().notEmpty().withMessage('Label is required.'),
    body('message.en').trim().notEmpty().withMessage('Message is required.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const existing = await EmergencyTemplate.findOne({ key: req.body.key });
      if (existing) {
        if (existing.isActive) {
          return res.status(409).json({ message: 'A template with this key already exists.' });
        }
        const reactivated = await EmergencyTemplate.findByIdAndUpdate(
          existing._id,
          { ...req.body, isActive: true },
          { new: true, runValidators: true }
        );
        return res.status(201).json(reactivated);
      }
      const template = await EmergencyTemplate.create(req.body);
      res.status(201).json(template);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  authorize('admin'),
  [
    body('key').optional().trim().notEmpty().withMessage('Key is required.'),
    body('label.en').optional().trim().notEmpty().withMessage('Label is required.'),
    body('message.en').optional().trim().notEmpty().withMessage('Message is required.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (req.body.key) {
        const duplicate = await EmergencyTemplate.findOne({
          key: req.body.key,
          _id: { $ne: req.params.id },
        });
        if (duplicate) {
          return res.status(409).json({ message: 'A template with this key already exists.' });
        }
      }
      const template = await EmergencyTemplate.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!template) return res.status(404).json({ message: 'Template not found' });
      res.json(template);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const template = await EmergencyTemplate.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (err) {
    next(err);
  }
});

export default router;
