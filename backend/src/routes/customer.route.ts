import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  regenerateCustomerQr,
} from '../controllers/customer.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCustomerSchema, updateCustomerSchema, regenerateCustomerQrSchema } from '../utils/validation.schemas.js';
import { UserRole } from '../types/enums.js';

const router = Router();
router.use(authenticate, tenantMiddleware, requireRole(UserRole.TENANT_OWNER)); // Only TENANT_OWNER can manage customers

router.route('/')
  .post(validate(createCustomerSchema), createCustomer)
  .get(getCustomers);

router.route('/:id')
  .get(getCustomerById)
  .patch(validate(updateCustomerSchema), updateCustomer)
  .delete(deleteCustomer);

router.post('/:id/regenerate-qr', validate(regenerateCustomerQrSchema), regenerateCustomerQr); // Specific endpoint for QR

export default router;
