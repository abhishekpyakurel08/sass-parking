import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTickets,
  scanTicket,
  handleLostTicket, 
  processPayment,   
  exportReport,
  getReceipt,
} from '../controllers/parking.controller.js';
import { authenticateAny, requireRole } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  checkInSchema,
  checkOutSchema,
  scanSchema,
  lostTicketSchema,
  processPaymentSchema,
} from '../utils/validation.schemas.js';
import { UserRole } from '../types/enums.js';

import { auditAction } from '../middleware/auditLogger.js';

const router: Router = Router();
router.use(authenticateAny, tenantMiddleware);

router.post('/check-in',  requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(checkInSchema), auditAction('Parking:CheckIn'), checkIn);
router.post('/check-out', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(checkOutSchema), auditAction('Parking:CheckOut'), checkOut);

router.post('/lost-ticket', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(lostTicketSchema), auditAction('Parking:LostTicket'), handleLostTicket);

router.post('/process-payment', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(processPaymentSchema), auditAction('Parking:ProcessPayment'), processPayment);

router.post('/scan', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), validate(scanSchema), auditAction('Parking:Scan'), scanTicket);

router.get('/tickets', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), getTickets);
router.get('/export', requireRole(UserRole.TENANT_OWNER), exportReport);

router.get('/:id/receipt', requireRole(UserRole.GATE_STAFF, UserRole.TENANT_OWNER), getReceipt);

export default router;
