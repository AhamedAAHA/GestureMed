import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import { authenticate, authorize, attachUser } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, attachUser, authorize('admin'), async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

export default router;
