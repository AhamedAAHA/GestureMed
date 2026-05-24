import { Router } from 'express';
import { body } from 'express-validator';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { authenticate, authorize, attachUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { logAudit } from '../services/auditService.js';

const router = Router();
router.use(authenticate, attachUser);

router.get('/', authorize('admin', 'doctor'), async (req, res, next) => {
  try {
    const doctors = await Doctor.find()
      .populate('wardIds')
      .populate('userId', 'email name isActive')
      .sort({ createdAt: -1 });
    res.json(doctors);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authorize('doctor'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id }).populate('wardIds');
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authorize('admin'),
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name, ...profileData } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: 'Email already exists' });

      const user = await User.create({
        email,
        password,
        name,
        role: 'doctor',
      });
      const doctor = await Doctor.create({
        userId: user._id,
        name,
        ...profileData,
      });
      user.profileRef = doctor._id;
      user.profileModel = 'Doctor';
      await user.save();

      await logAudit({
        action: 'CREATE',
        entity: 'Doctor',
        entityId: doctor._id,
        userId: req.user.id,
        ip: req.ip,
      });

      res.status(201).json({ user: user.toJSON(), doctor });
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('wardIds');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    await User.findByIdAndUpdate(doctor.userId, { isActive: false });
    res.json({ message: 'Doctor deactivated' });
  } catch (err) {
    next(err);
  }
});

export default router;
