import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { vehicleCheckIn, vehicleCheckOut, getDailyStats } from '../controllers/operator.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { checkInSchema, checkOutSchema } from '../utils/validation.schemas.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { UserRole } from '../types/enums.js';

const router = Router();
router.use(authenticate, tenantMiddleware);

// ENTRY GATE — Process vehicle arrival
router.post(
  '/operator/check-in',
  requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER),
  validate(checkInSchema),
  vehicleCheckIn
);

// EXIT GATE — Calculate fare, release slot
router.post(
  '/operator/check-out',
  requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER),
  validate(checkOutSchema),
  vehicleCheckOut
);

// GATE ACCESS LOG — View today's stats
router.get(
  '/operator/stats',
  requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER),
  getDailyStats
);

export default router;
