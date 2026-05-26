import { Router } from 'express';
import { body, param } from 'express-validator';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import { authenticate, authorize, attachUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { logAudit } from '../services/auditService.js';

const router = Router();
router.use(authenticate, attachUser);

router.get('/', authorize('admin', 'doctor', 'nurse'), async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ isActive: { $ne: false } })
      .populate('wardIds')
      .populate('userId', 'email name isActive')
      .sort({ createdAt: -1 });
    res.json(doctors);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authorize('doctor', 'nurse'), async (req, res, next) => {
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
    body('email').isEmail().withMessage('Enter a valid email address.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('role').optional().isIn(['doctor', 'nurse']).withMessage('Select a valid staff role.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name, role = 'doctor', ...profileData } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: 'Email already exists' });

      const user = await User.create({
        email,
        password,
        name,
        role,
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

router.put(
  '/:id',
  authorize('admin'),
  [param('id').isMongoId()],
  validate,
  async (req, res, next) => {
    try {
      const allowed = [
        'name',
        'specialization',
        'department',
        'licenseNumber',
        'wardIds',
        'isOnDuty',
      ];
      const updates = {};
      allowed.forEach((key) => {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      });
      const doctor = await Doctor.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      }).populate('wardIds');
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
      if (updates.name !== undefined) {
        await User.findByIdAndUpdate(doctor.userId, { name: updates.name });
      }
      await logAudit({
        action: 'UPDATE',
        entity: 'Doctor',
        entityId: doctor._id,
        userId: req.user.id,
        ip: req.ip,
      });
      res.json(doctor);
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { isActive: false, isOnDuty: false },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    await User.findByIdAndUpdate(doctor.userId, { isActive: false });
    await logAudit({
      action: 'DELETE',
      entity: 'Doctor',
      entityId: doctor._id,
      userId: req.user.id,
      ip: req.ip,
    });
    res.json({ message: 'Doctor deactivated' });
  } catch (err) {
    next(err);
  }
});

export default router;
