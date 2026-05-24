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
  [body('key').trim().notEmpty(), body('label.en').notEmpty(), body('message.en').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const template = await EmergencyTemplate.create(req.body);
      res.status(201).json(template);
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const template = await EmergencyTemplate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  } catch (err) {
    next(err);
  }
});

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
