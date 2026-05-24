import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import { validate } from '../middleware/validate.js';
import { authenticate, attachUser } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').isIn(['patient', 'doctor', 'admin']),
    body('preferredLanguage').optional().isIn(['en', 'ta', 'si']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password, name, role, preferredLanguage = 'en' } = req.body;
      const exists = await User.findOne({ email });
      if (exists) return res.status(409).json({ message: 'Email already registered' });

      const user = await User.create({ email, password, name, role, preferredLanguage });
      let profile = null;

      if (role === 'patient') {
        profile = await Patient.create({
          userId: user._id,
          name,
          preferredLanguage,
        });
        user.profileRef = profile._id;
        user.profileModel = 'Patient';
        await user.save();
      } else if (role === 'doctor') {
        profile = await Doctor.create({
          userId: user._id,
          name,
        });
        user.profileRef = profile._id;
        user.profileModel = 'Doctor';
        await user.save();
      }

      const token = signToken(user);
      await logAudit({
        action: 'REGISTER',
        entity: 'User',
        entityId: user._id,
        userId: user._id,
        details: { role },
        ip: req.ip,
      });

      res.status(201).json({
        token,
        user: { ...user.toJSON(), profile },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });

      let profile = null;
      if (user.profileModel === 'Patient') {
        profile = await Patient.findOne({ userId: user._id }).populate('wardId');
      } else if (user.profileModel === 'Doctor') {
        profile = await Doctor.findOne({ userId: user._id }).populate('wardIds');
      }

      const token = signToken(user);
      await logAudit({
        action: 'LOGIN',
        entity: 'User',
        entityId: user._id,
        userId: user._id,
        ip: req.ip,
      });

      res.json({ token, user: { ...user.toJSON(), profile } });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', authenticate, attachUser, async (req, res, next) => {
  try {
    const user = req.currentUser;
    let profile = null;
    if (user.profileModel === 'Patient') {
      profile = await Patient.findOne({ userId: user._id }).populate('wardId');
    } else if (user.profileModel === 'Doctor') {
      profile = await Doctor.findOne({ userId: user._id }).populate('wardIds');
    }
    res.json({ user: { ...user.toJSON(), profile } });
  } catch (err) {
    next(err);
  }
});

export default router;
