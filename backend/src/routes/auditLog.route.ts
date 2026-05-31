import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLog.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { UserRole } from '../types/enums.js';

const router: Router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.TENANT_OWNER, UserRole.SUPER_ADMIN));
router.use(tenantMiddleware);

router.get('/', getAuditLogs);

export default router;
