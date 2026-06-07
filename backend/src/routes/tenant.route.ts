import { Router } from 'express';
import {
  getAllTenants, createTenant, updateTenant, deleteTenant,
  getMyTenant, updateMyTenant, createStaff, getStaff, updateStaff, deleteStaff,
  regenerateStaffApiKey,
} from '../controllers/tenant.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { auditAction } from '../middleware/auditLogger.js';
import { createTenantSchema, updateTenantSchema, createStaffSchema } from '../utils/validation.schemas.js';
import { UserRole } from '../types/enums.js';

const router: Router = Router();
router.use(authenticate);

router.get('/me',  requireRole(UserRole.TENANT_OWNER), tenantMiddleware, getMyTenant);
router.put('/me',  requireRole(UserRole.TENANT_OWNER), tenantMiddleware, updateMyTenant);

router.get('/staff',     requireRole(UserRole.TENANT_OWNER), tenantMiddleware, getStaff);
router.post('/staff',    requireRole(UserRole.TENANT_OWNER), tenantMiddleware, validate(createStaffSchema), auditAction('Staff:Create'), createStaff);
router.patch('/staff/:id',   requireRole(UserRole.TENANT_OWNER), tenantMiddleware, auditAction('Staff:Update'), updateStaff);
router.delete('/staff/:id',  requireRole(UserRole.TENANT_OWNER), tenantMiddleware, auditAction('Staff:Delete'), deleteStaff);
router.post('/staff/:id/regenerate-api-key', requireRole(UserRole.TENANT_OWNER), tenantMiddleware, auditAction('Staff:RegenerateApiKey'), regenerateStaffApiKey);

router.get('/',       requireRole(UserRole.SUPER_ADMIN), getAllTenants);
router.post('/',      requireRole(UserRole.SUPER_ADMIN), validate(createTenantSchema), createTenant);
router.patch('/:id',  requireRole(UserRole.SUPER_ADMIN), validate(updateTenantSchema), updateTenant);
router.delete('/:id', requireRole(UserRole.SUPER_ADMIN), deleteTenant);

export default router;