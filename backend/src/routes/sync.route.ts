import { Router } from 'express';
import { syncBatch } from '../controllers/sync.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { auditAction } from '../middleware/auditLogger.js';
import { UserRole } from '../types/enums.js';

const router = Router();

// Only gate staff and tenant owners can sync offline data
router.use(authenticate);
router.use(requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER));
router.use(tenantMiddleware);

// Endpoint for offline mobile app to sync cached scans/operations
router.post('/batch', auditAction('MobileApp:OfflineSync'), syncBatch);

export default router;
