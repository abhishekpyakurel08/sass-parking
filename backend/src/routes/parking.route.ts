import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTickets,
  scanTicket,
  handleLostTicket, // New
  processPayment,   // New
} from '../controllers/parking.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  checkInSchema,
  checkOutSchema,
  scanSchema,
  lostTicketSchema,   // New
  processPaymentSchema, // New
} from '../utils/validation.schemas.js';
import { UserRole } from '../types/enums.js';

const router = Router();
router.use(authenticate, tenantMiddleware);

// Operations — all gate-capable roles
router.post('/check-in',  requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(checkInSchema), checkIn);
router.post('/check-out', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(checkOutSchema), checkOut);

// New: Lost Ticket Handling
router.post('/lost-ticket', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(lostTicketSchema), handleLostTicket);

// New: Payment Processing
router.post('/process-payment', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(processPaymentSchema), processPayment);

// Scan / Verify barcode or license plate
router.post('/scan', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(scanSchema), scanTicket);

// Ticket history
router.get('/tickets', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), getTickets);

export default router;
