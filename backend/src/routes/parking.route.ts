import { Router } from 'express';
import { checkIn, checkOut, getSpaces, getTickets, createSpace, scanTicket } from '../controllers/parking.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { checkInSchema, checkOutSchema, createSpaceSchema, scanSchema } from '../utils/validation.schemas.js';
import { UserRole } from '../types/enums.js';

const router = Router();
router.use(authenticate, tenantMiddleware);

// Spaces — TENANT_OWNER manages, GATE_STAFF reads
router.get('/spaces', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), getSpaces);
router.post('/spaces', requireRole(UserRole.TENANT_OWNER), validate(createSpaceSchema), createSpace);

// Operations — all gate-capable roles
router.post('/check-in',  requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(checkInSchema), checkIn);
router.post('/check-out', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(checkOutSchema), checkOut);

// Scan / Verify barcode or license plate
router.post('/scan', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(scanSchema), scanTicket);

// Ticket history
router.get('/tickets', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), getTickets);

export default router;
