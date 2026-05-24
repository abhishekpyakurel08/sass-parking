import { Router } from 'express';
import { createRate, getRates, updateRate } from '../controllers/rates.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createRateSchema, updateRateSchema } from '../utils/validation.schemas.js';
import { UserRole } from '../types/enums.js';

const router = Router();
router.use(authenticate, tenantMiddleware, requireRole(UserRole.TENANT_OWNER));

router.post('/',     validate(createRateSchema), createRate);
router.get('/',      getRates);
router.patch('/:id', validate(updateRateSchema), updateRate);

export default router;
