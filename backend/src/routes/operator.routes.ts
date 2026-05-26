import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { getDailyStats } from '../controllers/operator.controller.js';
import { checkIn, checkOut, processPayment, scanTicket } from '../controllers/parking.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { checkInSchema, checkOutSchema, processPaymentSchema, scanSchema } from '../utils/validation.schemas.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { UserRole } from '../types/enums.js';
import { auditAction } from '../middleware/auditLogger.js';

const router = Router();
router.use(authenticate, tenantMiddleware);

router.post(
  '/operator/check-in',
  requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER),
  validate(checkInSchema),
  auditAction('OperatorApp:CheckIn'),
  checkIn
);

// EXIT GATE — Calculate fare, release slot
router.post(
  '/operator/check-out',
  requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER),
  validate(checkOutSchema),
  auditAction('OperatorApp:CheckOut'),
  checkOut
);

router.post(
  '/operator/process-payment',
  requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER),
  validate(processPaymentSchema),
  auditAction('OperatorApp:ProcessPayment'),
  processPayment
);

router.post(
  '/operator/scan',
  requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER),
  validate(scanSchema),
  auditAction('OperatorApp:Scan'),
  scanTicket
);

router.get(
  '/operator/stats',
  requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER),
  getDailyStats
);

export default router;
