import { Router } from 'express';
import {
  createRate,
  getRates,
  updateRate,
  deleteRate,
  getRateByVehicleType
} from '../controllers/rates.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createRateSchema, updateRateSchema } from '../utils/validation.schemas.js';
import { UserRole } from '../types/enums.js';

const router: Router = Router();
router.use(authenticate, tenantMiddleware);

router.route('/')
  .post(requireRole(UserRole.TENANT_OWNER), validate(createRateSchema), createRate)
  .get(requireRole(UserRole.TENANT_OWNER, UserRole.GATE_STAFF), getRates); 

router.route('/:vehicle_type')
  .get(requireRole(UserRole.TENANT_OWNER, UserRole.GATE_STAFF), getRateByVehicleType)
  .patch(requireRole(UserRole.TENANT_OWNER), validate(updateRateSchema), updateRate)
  .delete(requireRole(UserRole.TENANT_OWNER), deleteRate);

export default router;
