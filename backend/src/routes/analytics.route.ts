import { Router } from 'express';
import { getGlobalAnalytics, getTenantAnalytics } from '../controllers/analytics.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { UserRole } from '../types/enums.js';

const router: Router = Router();
router.use(authenticate);

router.get('/global', requireRole(UserRole.SUPER_ADMIN), getGlobalAnalytics);
router.get('/tenant', requireRole(UserRole.TENANT_OWNER, UserRole.GATE_STAFF), tenantMiddleware, getTenantAnalytics);

export default router;
