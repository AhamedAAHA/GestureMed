import AuditLog from '../models/AuditLog.js';

export async function logAudit({ action, entity, entityId, userId, details, ip }) {
  try {
    await AuditLog.create({ action, entity, entityId, userId, details, ip });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}
