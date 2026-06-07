import { Router } from 'express';
import { createApiKey, getApiKeys, updateApiKey, deleteApiKey } from '../controllers/apiKey.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { auditAction } from '../middleware/auditLogger.js';
import { UserRole } from '../types/enums.js';

const router: Router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.TENANT_OWNER, UserRole.GATE_STAFF));
router.use(tenantMiddleware);
router.post('/', auditAction('ApiKey:Create'), createApiKey);
router.get('/', getApiKeys);
router.patch('/:id', auditAction('ApiKey:Update'), updateApiKey);
router.delete('/:id', auditAction('ApiKey:Delete'), deleteApiKey);

export default router;
