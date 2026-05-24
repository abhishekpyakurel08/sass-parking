import { Router } from 'express';
import { getGlobalAnalytics, getTenantAnalytics } from '../controllers/analytics.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { UserRole } from '../types/enums.js';

const router = Router();
router.use(authenticate);

// Global — SUPER_ADMIN only (no tenant middleware — intentionally unrestricted)
router.get('/global', requireRole(UserRole.SUPER_ADMIN), getGlobalAnalytics);

// Tenant-scoped
router.get('/tenant', requireRole(UserRole.TENANT_OWNER), tenantMiddleware, getTenantAnalytics);

export default router;
