import { Router } from 'express';
import { body } from 'express-validator';
import Ward from '../models/Ward.js';
import { authenticate, authorize, attachUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, attachUser);

router.get('/', async (req, res, next) => {
  try {
    const wards = await Ward.find({ isActive: true }).sort({ name: 1 });
    res.json(wards);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('capacity').optional().isInt({ min: 0 }).withMessage('Capacity cannot be negative.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const ward = await Ward.create(req.body);
      res.status(201).json(ward);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  authorize('admin'),
  [body('capacity').optional().isInt({ min: 0 }).withMessage('Capacity cannot be negative.')],
  validate,
  async (req, res, next) => {
    try {
      const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!ward) return res.status(404).json({ message: 'Ward not found' });
      res.json(ward);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const ward = await Ward.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!ward) return res.status(404).json({ message: 'Ward not found' });
    res.json(ward);
  } catch (err) {
    next(err);
  }
});

export default router;
