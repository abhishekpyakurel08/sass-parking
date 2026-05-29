import { Router } from 'express';
import {
  getAllTenants, createTenant, updateTenant, deleteTenant,
  getMyTenant, updateMyTenant, createStaff, getStaff, updateStaff, deleteStaff,
} from '../controllers/tenant.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createTenantSchema, updateTenantSchema, createStaffSchema } from '../utils/validation.schemas.js';
import { UserRole } from '../types/enums.js';

const router: Router = Router();
router.use(authenticate);

// SUPER_ADMIN routes
router.get('/',     requireRole(UserRole.SUPER_ADMIN), getAllTenants);
router.post('/',    requireRole(UserRole.SUPER_ADMIN), validate(createTenantSchema), createTenant);
router.patch('/:id', requireRole(UserRole.SUPER_ADMIN), validate(updateTenantSchema), updateTenant);
router.delete('/:id', requireRole(UserRole.SUPER_ADMIN), deleteTenant);

// TENANT_OWNER routes — require tenant context
router.get('/me', requireRole(UserRole.TENANT_OWNER), tenantMiddleware, getMyTenant);
router.put('/me', requireRole(UserRole.TENANT_OWNER), tenantMiddleware, updateMyTenant);
router.get('/staff', requireRole(UserRole.TENANT_OWNER), tenantMiddleware, getStaff);
router.post('/staff', requireRole(UserRole.TENANT_OWNER), tenantMiddleware, validate(createStaffSchema), createStaff);
router.patch('/staff/:id', requireRole(UserRole.TENANT_OWNER), tenantMiddleware, updateStaff);
router.delete('/staff/:id', requireRole(UserRole.TENANT_OWNER), tenantMiddleware, deleteStaff);

export default router;