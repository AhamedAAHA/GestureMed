import { Router } from 'express';
import { body, param } from 'express-validator';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import { authenticate, authorize, attachUser } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { logAudit } from '../services/auditService.js';

const router = Router();
router.use(authenticate, attachUser);

router.get('/', authorize('admin', 'doctor'), async (req, res, next) => {
  try {
    const patients = await Patient.find({ isActive: { $ne: false } })
      .populate('wardId')
      .populate('userId', 'email name preferredLanguage isActive')
      .sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authorize('patient'), async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user.id }).populate('wardId');
    if (!patient) return res.status(404).json({ message: 'Patient profile not found' });
    res.json(patient);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authorize('admin', 'doctor', 'patient'), async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('wardId');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    if (req.user.role === 'patient' && patient.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(patient);
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
    body('preferredLanguage')
      .optional()
      .isIn(['en', 'ta', 'si'])
      .withMessage('Select a valid preferred language.'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name, preferredLanguage = 'en', ...profileData } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: 'Email already exists' });

      const user = await User.create({
        email,
        password,
        name,
        role: 'patient',
        preferredLanguage,
      });
      const patient = await Patient.create({
        userId: user._id,
        name,
        preferredLanguage,
        ...profileData,
      });
      user.profileRef = patient._id;
      user.profileModel = 'Patient';
      await user.save();

      await logAudit({
        action: 'CREATE',
        entity: 'Patient',
        entityId: patient._id,
        userId: req.user.id,
        ip: req.ip,
      });

      res.status(201).json({ user: user.toJSON(), patient });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  authorize('admin', 'patient'),
  [param('id').isMongoId()],
  validate,
  async (req, res, next) => {
    try {
      const patient = await Patient.findById(req.params.id);
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      if (req.user.role === 'patient' && patient.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const allowed = [
        'name',
        'age',
        'gender',
        'bloodGroup',
        'allergies',
        'medicalCondition',
        'emergencyContact',
        'wardId',
        'roomNumber',
        'preferredLanguage',
      ];
      allowed.forEach((key) => {
        if (req.body[key] !== undefined) {
          patient[key] = key === 'wardId' && req.body[key] === '' ? null : req.body[key];
        }
      });
      await patient.save();

      const userUpdates = {};
      if (req.body.name !== undefined) userUpdates.name = req.body.name;
      if (req.body.preferredLanguage !== undefined) {
        userUpdates.preferredLanguage = req.body.preferredLanguage;
      }
      if (Object.keys(userUpdates).length) {
        await User.findByIdAndUpdate(patient.userId, userUpdates);
      }

      await logAudit({
        action: 'UPDATE',
        entity: 'Patient',
        entityId: patient._id,
        userId: req.user.id,
        ip: req.ip,
      });

      res.json(await patient.populate('wardId'));
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    await User.findByIdAndUpdate(patient.userId, { isActive: false });
    await logAudit({
      action: 'DELETE',
      entity: 'Patient',
      entityId: patient._id,
      userId: req.user.id,
      ip: req.ip,
    });
    res.json({ message: 'Patient deactivated' });
  } catch (err) {
    next(err);
  }
});

export default router;
