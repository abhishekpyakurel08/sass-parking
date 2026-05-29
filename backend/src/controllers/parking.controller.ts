import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Ticket } from '../models/ticket.model.js';
import { HourlyRate } from '../models/hourlyRate.model.js';
import { Customer } from '../models/customer.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
} from '../errors/ApiError.js';
import { TicketStatus, PaymentMethod, UserRole, GateAssignment } from '../types/enums.js';
import { logTransaction } from '../utils/logger.js';
import { generateQrCodeDataUri } from '../utils/qr.js';


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/parking/check-in
// Creates a new parking ticket for a vehicle entering the facility.
// Supports standard entry or regular customer (NFC/QR) entry.
// ─────────────────────────────────────────────────────────────────────────────
export const checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.tenant!.tenantId;
    const { license_plate, vehicle_type, customer_code, notes } = req.body;

    let resolvedLicensePlate = license_plate;
    let customer = null;
    let customerId = undefined;

    // Handle customer entry if customer_code is provided
    if (customer_code) {
      customer = await Customer.findOne({ tenant_id: tenantId, customer_code }).session(session);
      if (!customer) {
        await session.abortTransaction();
        return next(new NotFoundError('Regular customer not found with the provided code.'));
      }
      if (customer.status !== 'ACTIVE') {
        await session.abortTransaction();
        return next(new ValidationError(`Customer account is ${customer.status}.`));
      }
      customerId = customer._id;
      // If no license plate is provided for customer, use a placeholder or require it
      if (!resolvedLicensePlate) {
        resolvedLicensePlate = `CUSTOMER-${customer_code}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      }
    } else if (!license_plate) {
      resolvedLicensePlate = `GUEST-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    }

    // Check no active ticket exists for this plate
    const activeTicket = await Ticket.findOne({
      tenant_id: tenantId,
      license_plate: resolvedLicensePlate.toUpperCase(),
      status: TicketStatus.ACTIVE,
    }).session(session);

    if (activeTicket) {
      await session.abortTransaction();
      return next(new ConflictError('This vehicle already has an active parking ticket.'));
    }

    const staffUser = await User.findById(req.user!.userId).session(session);
    if (staffUser?.role === UserRole.GATE_STAFF && staffUser.gate_assignment === GateAssignment.EXIT) {
      await session.abortTransaction();
      return next(new ForbiddenError('Access denied: You are only authorized to process exits.'));
    }
    let prefix = staffUser?.ticket_prefix ? `${staffUser.ticket_prefix}-` : '';
    if (!prefix) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      prefix = `P-T-R-${code}-`;
    }

    const baseUUID = crypto.randomUUID();
    const ticketUUID = `${prefix}${baseUUID}`;
    const entryTime = new Date();

    const ticket = await Ticket.create(
      [{
        tenant_id: tenantId,
        customer_id: customerId,
        ticket_number: ticketUUID,
        license_plate: resolvedLicensePlate.toUpperCase(),
        vehicle_type,
        check_in_time: entryTime,
        status: TicketStatus.ACTIVE,
        fare_amount: 0,
        penalty_amount: 0, // Default to 0
        discount_amount: customer ? customer.discount_percentage : 0, // Store discount %
        notes: notes || '',
      }],
      { session }
    );

    await session.commitTransaction();

    logTransaction('CHECK_IN', {
      tenantId,
      ticketId: ticket[0]._id,
      ticket_number: ticketUUID,
      license_plate: resolvedLicensePlate,
      vehicle_type,
      customerId: customerId,
    });

    const qrCodeDataUrl = await generateQrCodeDataUri(ticketUUID);

    const businessName = req.tenant?.tenantName || 'Parking System';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedDate = `${entryTime.getFullYear()}-${pad(entryTime.getMonth() + 1)}-${pad(entryTime.getDate())} ${pad(entryTime.getHours())}:${pad(entryTime.getMinutes())}:${pad(entryTime.getSeconds())}`;

    // Generate ASCII printable receipt format (simplified as no space info)
    const printableReceipt = [
      '========================================',
      `          ${businessName.toUpperCase().padEnd(28).substring(0, 28)}`,
      '========================================',
      ` TICKET NO   : ${ticketUUID}`,
      ` PLATE NO    : ${ticket[0].license_plate}`,
      ` VEHICLE TYPE: ${ticket[0].vehicle_type}`,
      ` ENTRY TIME  : ${formattedDate}`,
      customer ? ` CUSTOMER    : ${customer.name} (${customer.discount_percentage}% OFF)` : '',
      '----------------------------------------',
      '      PLEASE SCAN QR CODE TO EXIT',
      '========================================',
    ].filter(Boolean).join('\n'); // Filter out empty strings if no customer

    res.status(201).json({
      success: true,
      ticket: {
        ticket_id: ticket[0]._id,
        ticket_number: ticketUUID,
        license_plate: ticket[0].license_plate,
        vehicle_type: ticket[0].vehicle_type,
        check_in_time: ticket[0].check_in_time,
        qr_code_url: qrCodeDataUrl,
        customer_name: customer?.name, // Pass customer name for frontend display
      },
      receipt: {
        business_name: businessName,
        ticket_number: ticketUUID,
        license_plate: ticket[0].license_plate,
        vehicle_type: ticket[0].vehicle_type,
        entry_time: formattedDate,
        qr_code_url: qrCodeDataUrl,
        printable_text: printableReceipt,
      }
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/parking/checkout
// Calculates fare for an active ticket and marks it PENDING_PAYMENT.
// Applies customer discounts if applicable.
// ─────────────────────────────────────────────────────────────────────────────
export const checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.tenant!.tenantId;
    const { ticket_id } = req.body;

    const staffUser = await User.findById(req.user!.userId).session(session);
    if (staffUser?.role === UserRole.GATE_STAFF && staffUser.gate_assignment === GateAssignment.ENTRY) {
      await session.abortTransaction();
      return next(new ForbiddenError('Access denied: You are only authorized to process entries.'));
    }

    const query = mongoose.isValidObjectId(ticket_id)
      ? { _id: ticket_id, tenant_id: tenantId, status: TicketStatus.ACTIVE }
      : {
          tenant_id: tenantId,
          status: TicketStatus.ACTIVE,
          $or: [
            { ticket_number: ticket_id },
            { ticket_number: ticket_id.toLowerCase() },
            { license_plate: ticket_id.toUpperCase() }
          ]
        };

    const ticket = await Ticket.findOne(query).session(session).populate('customer_id');

    if (!ticket) {
      await session.abortTransaction();
      return next(new NotFoundError('Active ticket not found.'));
    }

    const checkOutTime = new Date();
    const durationMs = checkOutTime.getTime() - ticket.check_in_time.getTime();
    let durationMins = durationMs / (1000 * 60);

    const rateDoc = await HourlyRate.findOne({
      tenant_id: tenantId,
      vehicle_type: ticket.vehicle_type,
    }).session(session);

    const rate_per_hour = rateDoc?.rate_per_hour ?? 50; // Fallback default
    const grace_period_minutes = rateDoc?.grace_period_minutes ?? 0; // Get grace period

    let base_fare = 0;
    let discount_amount = 0;
    let total_charge_before_discount_or_grace = 0; // To calculate the 'Subtotal' in the receipt

    // Apply grace period first
    if (durationMins > grace_period_minutes) {
      durationMins -= grace_period_minutes; // Deduct grace period from chargeable time
      const hours = Math.ceil(durationMins / 60) || 1;
      base_fare = hours * rate_per_hour;
      total_charge_before_discount_or_grace = (hours * rate_per_hour) + (rate_per_hour * (grace_period_minutes / 60)); // Original calculation including grace period minutes if it was charged
    } else {
      // If duration is within grace period, fare is 0
      base_fare = 0;
      total_charge_before_discount_or_grace = 0; // No charge means no subtotal from rate
    }

    // Apply customer discount if available
    if (ticket.customer_id && typeof (ticket.customer_id as any).discount_percentage === 'number' && base_fare > 0) {
      const customerDiscountPct = (ticket.customer_id as any).discount_percentage;
      discount_amount = base_fare * (customerDiscountPct / 100);
      base_fare -= discount_amount;
    }

    ticket.check_out_time = checkOutTime;
    ticket.fare_amount = base_fare;
    ticket.discount_amount = discount_amount; // Record the actual discount applied
    ticket.status = TicketStatus.PENDING_PAYMENT;
    await ticket.save({ session });

    await session.commitTransaction();

    logTransaction('CHECK_OUT', {
      tenantId,
      ticketId: ticket._id,
      ticket_number: ticket.ticket_number,
      license_plate: ticket.license_plate,
      durationMinutes: durationMs / (1000 * 60), // Log actual duration
      chargeableDurationMinutes: durationMins, // Log duration after grace period
      fare_amount: base_fare,
      discount_amount,
      grace_period_minutes,
    });

    res.status(200).json({
      success: true,
      summary: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        license_plate: ticket.license_plate,
        vehicle_type: ticket.vehicle_type,
        check_in_time: ticket.check_in_time,
        check_out_time: checkOutTime,
        duration_minutes: durationMs / (1000 * 60), // Total duration
        chargeable_duration_minutes: durationMins, // Duration after grace period
        rate_per_hour,
        subtotal: total_charge_before_discount_or_grace, // This is the base amount before any discounts or grace period deductions were visually applied.
        discount: discount_amount,
        total_amount: base_fare,
        status: ticket.status,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/parking/lost-ticket
// Handles lost tickets by calculating a penalty and marking for payment.
// ─────────────────────────────────────────────────────────────────────────────
export const handleLostTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.tenant!.tenantId;
    const { vehicle_type, license_plate, assumed_duration_hours } = req.body;

    const staffUser = await User.findById(req.user!.userId).session(session);
    if (staffUser?.role === UserRole.GATE_STAFF && staffUser.gate_assignment === GateAssignment.ENTRY) {
      await session.abortTransaction();
      return next(new ForbiddenError('Access denied: You are only authorized to process entries.'));
    }

    // Find the hourly rate and lost ticket penalty for the vehicle type
    const rateDoc = await HourlyRate.findOne({
      tenant_id: tenantId,
      vehicle_type: vehicle_type,
    }).session(session);

    const rate_per_hour = rateDoc?.rate_per_hour ?? 50; // Fallback default
    const lost_ticket_penalty = rateDoc?.lost_ticket_penalty ?? 100; // Fallback default penalty

    const base_fare = assumed_duration_hours * rate_per_hour;
    const total_charge = base_fare + lost_ticket_penalty;

    // Check if an active ticket already exists for this license plate to prevent duplicates
    const existingActiveTicket = await Ticket.findOne({
      tenant_id: tenantId,
      license_plate: license_plate.toUpperCase(),
      status: TicketStatus.ACTIVE,
    }).session(session);

    if (existingActiveTicket) {
      await session.abortTransaction();
      return next(new ConflictError('An active ticket already exists for this vehicle. Cannot process as lost.'));
    }

    let prefix = staffUser?.ticket_prefix ? `${staffUser.ticket_prefix}-` : '';
    if (!prefix) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      prefix = `P-T-R-${code}-`;
    }

    // Create a new ticket with PENDING_PAYMENT status
    const baseUUID = crypto.randomUUID();
    const ticketUUID = `${prefix}${baseUUID}`;
    const entryTime = new Date(); // Approximate entry time for lost ticket
    const checkOutTime = new Date(); // Now

    const ticket = await Ticket.create(
      [{
        tenant_id: tenantId,
        ticket_number: ticketUUID,
        license_plate: license_plate.toUpperCase(),
        vehicle_type,
        check_in_time: entryTime, // Can be set to a reasonable default or start of day
        check_out_time: checkOutTime,
        fare_amount: base_fare,
        penalty_amount: lost_ticket_penalty,
        discount_amount: 0,
        status: TicketStatus.PENDING_PAYMENT, // Immediately pending payment
        notes: `LOST TICKET - Assumed duration: ${assumed_duration_hours}h`,
      }],
      { session }
    );

    await session.commitTransaction();

    logTransaction('LOST_TICKET_HANDLED', {
      tenantId,
      ticketId: ticket[0]._id,
      ticket_number: ticketUUID,
      license_plate,
      vehicle_type,
      assumed_duration_hours,
      total_charge,
      penalty: lost_ticket_penalty,
    });

    res.status(201).json({
      success: true,
      summary: {
        ticket_id: ticket[0]._id,
        ticket_number: ticketUUID,
        license_plate: ticket[0].license_plate,
        vehicle_type: ticket[0].vehicle_type,
        assumed_duration_hours,
        base_amount: base_fare,
        lost_ticket_penalty,
        total_amount: total_charge,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/parking/process-payment
// Completes the payment for a PENDING_PAYMENT ticket.
// ─────────────────────────────────────────────────────────────────────────────
export const processPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.tenant!.tenantId;
    const { ticket_id, payment_method, amount_received, transaction_reference } = req.body;

    const staffUser = await User.findById(req.user!.userId).session(session);
    if (staffUser?.role === UserRole.GATE_STAFF && staffUser.gate_assignment === GateAssignment.ENTRY) {
      await session.abortTransaction();
      return next(new ForbiddenError('Access denied: You are only authorized to process entries.'));
    }

    const ticket = await Ticket.findOne({
      _id: ticket_id,
      tenant_id: tenantId,
      status: TicketStatus.PENDING_PAYMENT,
    }).session(session);

    if (!ticket) {
      await session.abortTransaction();
      return next(new NotFoundError('Ticket not found or not in PENDING_PAYMENT status.'));
    }

    const total_due = ticket.fare_amount + ticket.penalty_amount - ticket.discount_amount;
    let change_given = 0;

    if (payment_method === PaymentMethod.CASH) {
      if (amount_received === undefined || amount_received < total_due) {
        await session.abortTransaction();
        return next(new ValidationError('Amount received is insufficient for cash payment.'));
      }
      change_given = amount_received - total_due;
    }

    ticket.status = TicketStatus.PAID;
    ticket.payment_method = payment_method;
    ticket.amount_received = amount_received;
    ticket.change_given = change_given;
    ticket.transaction_reference = transaction_reference;
    await ticket.save({ session });

    // Update customer total savings if applicable
    if (ticket.customer_id && ticket.discount_amount > 0) {
      await Customer.findByIdAndUpdate(
        ticket.customer_id,
        { $inc: { total_savings: ticket.discount_amount } },
        { session }
      );
    }

    await session.commitTransaction();

    logTransaction('PAYMENT_PROCESSED', {
      tenantId,
      ticketId: ticket._id,
      ticket_number: ticket.ticket_number,
      payment_method,
      total_due,
      amount_received,
      change_given,
    });

    const businessName = req.tenant?.tenantName || 'Parking System';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const entryTime = ticket.check_in_time;
    const exitTime = ticket.check_out_time || new Date(); // Use actual exit time or now
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const formattedDuration = `${durationHours}h ${durationMinutes}m`;

    const formattedEntryTime = `${pad(entryTime.getHours())}:${pad(entryTime.getMinutes())}`;
    const formattedExitTime = `${pad(exitTime.getHours())}:${pad(exitTime.getMinutes())}`;


    const printableReceipt = [
      '┌─────────────────────┐',
      `│ ${businessName.padEnd(19).substring(0, 19)} │`,
      '│      Center         │',
      '├─────────────────────┤',
      '│   PARKING RECEIPT   │',
      '│                     │',
      `│ Ticket: #${ticket.ticket_number.substring(0,8).toUpperCase()}      │`, // Shorten ticket number for receipt
      `│ Vehicle: ${ticket.vehicle_type.padEnd(10).substring(0,10)}  │`,
      '│                     │',
      `│ Entry: ${formattedEntryTime}        │`,
      `│ Exit:  ${formattedExitTime}        │`,
      `│ Duration: ${formattedDuration.padEnd(10).substring(0,10)} │`,
      '├─────────────────────┤',
      `│ Subtotal:   Rs. ${ticket.fare_amount.toFixed(2).padStart(5)} │`,
      ticket.discount_amount > 0 ? `│ Discount:   - Rs. ${ticket.discount_amount.toFixed(2).padStart(5)} │` : '',
      ticket.penalty_amount > 0 ? `│ Penalty:    + Rs. ${ticket.penalty_amount.toFixed(2).padStart(5)} │` : '',
      `│ TOTAL:      Rs. ${total_due.toFixed(2).padStart(5)} │`,
      '│                     │',
      `│ Paid: ${payment_method.padEnd(15).substring(0,15)} │`,
      payment_method === PaymentMethod.CASH ? `│ Received: Rs. ${amount_received!.toFixed(2).padStart(5)}    │` : '',
      payment_method === PaymentMethod.CASH ? `│ Change:   Rs. ${change_given.toFixed(2).padStart(5)}     │` : '',
      '│                     │',
      '│   Thank You!   │',
      '└─────────────────────┘',
    ].filter(Boolean).join('\n');

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully.',
      receipt: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        total_due: total_due,
        payment_method: payment_method,
        amount_received: amount_received,
        change_given: change_given,
        printable_text: printableReceipt,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/parking/scan
// Scans/Validates a ticket (by barcode barcode/UUID or license plate)
// ─────────────────────────────────────────────────────────────────────────────
export const scanTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { code } = req.body;

    if (!code) {
      return next(new ValidationError('Scan code is required'));
    }

    // Attempt lookup by UUID (ticket_number) first, fallback to license_plate
    const ticket = await Ticket.findOne({
      tenant_id: tenantId,
      $or: [
        { ticket_number: code },
        { ticket_number: code.toLowerCase() },
        { license_plate: code.toUpperCase() }
      ]
    }).populate('customer_id'); // Populate customer info if available

    if (!ticket) {
      return next(new NotFoundError('No ticket matches the scanned QR code/license plate'));
    }

    const qrCodeDataUrl = await generateQrCodeDataUri(ticket.ticket_number);

    res.status(200).json({
      success: true,
      ticket: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        license_plate: ticket.license_plate,
        vehicle_type: ticket.vehicle_type,
        check_in_time: ticket.check_in_time,
        check_out_time: ticket.check_out_time,
        fare_amount: ticket.fare_amount,
        penalty_amount: ticket.penalty_amount,
        discount_amount: ticket.discount_amount,
        status: ticket.status,
        payment_method: ticket.payment_method,
        amount_received: ticket.amount_received,
        change_given: ticket.change_given,
        transaction_reference: ticket.transaction_reference,
        notes: ticket.notes,
        customer_details: ticket.customer_id ? {
          name: (ticket.customer_id as any).name,
          customer_code: (ticket.customer_id as any).customer_code,
          discount_percentage: (ticket.customer_id as any).discount_percentage,
        } : undefined,
        qr_code_url: qrCodeDataUrl,
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/parking/tickets  — paginated active + historical tickets
// ─────────────────────────────────────────────────────────────────────────────
export const getTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const page  = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip  = (page - 1) * limit;

    const filter: Record<string, unknown> = { tenant_id: tenantId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customer_id) filter.customer_id = req.query.customer_id; // Allow filtering by customer

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('customer_id', 'name customer_code discount_percentage') // Populate customer info
        .sort({ check_in_time: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Ticket.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: tickets,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/parking/export  — Export entire ticket history as CSV
// ─────────────────────────────────────────────────────────────────────────────
export const exportReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const tickets = await Ticket.find({ tenant_id: tenantId })
      .populate('customer_id', 'name')
      .sort({ check_in_time: -1 })
      .lean();

    const headers = [
      'Ticket Number',
      'License Plate',
      'Vehicle Type',
      'Status',
      'Check-In Time',
      'Check-Out Time',
      'Fare Amount (Rs.)',
      'Penalty Amount (Rs.)',
      'Discount Amount (Rs.)',
      'Total Payable (Rs.)',
      'Payment Method',
      'Customer Name'
    ];

    const csvRows = [headers.join(',')];

    for (const t of tickets) {
      const checkIn = t.check_in_time ? new Date(t.check_in_time).toISOString() : '';
      const checkOut = t.check_out_time ? new Date(t.check_out_time).toISOString() : '';
      const payable = (t.fare_amount || 0) + (t.penalty_amount || 0) - (t.discount_amount || 0);
      const customerName = t.customer_id ? (t.customer_id as any).name : 'Standard';

      const row = [
        t.ticket_number,
        t.license_plate,
        t.vehicle_type,
        t.status,
        checkIn,
        checkOut,
        t.fare_amount,
        t.penalty_amount,
        t.discount_amount,
        payable,
        t.payment_method || 'N/A',
        customerName
      ].join(',');
      csvRows.push(row);
    }

    res.header('Content-Type', 'text/csv');
    res.attachment(`parking_export_${new Date().getTime()}.csv`);
    res.send(csvRows.join('\n'));
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/parking/ticket/:id/receipt  — Generate printable receipt text for past ticket
// ─────────────────────────────────────────────────────────────────────────────
export const getReceipt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const ticketId = req.params.id;

    const ticket = await Ticket.findOne({ _id: ticketId, tenant_id: tenantId })
      .populate('customer_id', 'name discount_percentage')
      .lean();

    if (!ticket) {
      return next(new NotFoundError('Ticket not found'));
    }

    const businessName = req.tenant?.tenantName || 'Parking System';
    
    let printableText = '';
    
    if (ticket.status === 'ACTIVE' || ticket.status === 'PENDING_PAYMENT') {
      // Check-in receipt style
      const entryTime = new Date(ticket.check_in_time);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedDate = `${entryTime.getFullYear()}-${pad(entryTime.getMonth() + 1)}-${pad(entryTime.getDate())} ${pad(entryTime.getHours())}:${pad(entryTime.getMinutes())}:${pad(entryTime.getSeconds())}`;
      
      const customer = ticket.customer_id as any;
      printableText = [
        '========================================',
        `          ${businessName.toUpperCase().padEnd(28).substring(0, 28)}`,
        '========================================',
        ` TICKET NO   : ${ticket.ticket_number}`,
        ` PLATE NO    : ${ticket.license_plate}`,
        ` VEHICLE TYPE: ${ticket.vehicle_type}`,
        ` ENTRY TIME  : ${formattedDate}`,
        customer ? ` CUSTOMER    : ${customer.name} (${customer.discount_percentage}% OFF)` : '',
        '----------------------------------------',
        '      PLEASE SCAN QR CODE TO EXIT',
        '========================================',
      ].filter(Boolean).join('\n');
    } else {
      // Payment receipt style
      const entryTime = new Date(ticket.check_in_time);
      const exitTime = ticket.check_out_time ? new Date(ticket.check_out_time) : new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      
      const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      
      const formattedEntryTime = fmtDate(entryTime);
      const formattedExitTime = fmtDate(exitTime);
      
      const durationMs = exitTime.getTime() - entryTime.getTime();
      const h = Math.floor(durationMs / 3_600_000);
      const m = Math.floor((durationMs % 3_600_000) / 60_000);
      const formattedDuration = h > 0 ? `${h}h ${m}m` : `${m}m`;

      const total_due = (ticket.fare_amount || 0) + (ticket.penalty_amount || 0) - (ticket.discount_amount || 0);

      printableText = [
        '┌─────────────────────┐',
        '│   PARKING RECEIPT   │',
        '│                     │',
        `│ Ticket: #${ticket.ticket_number.substring(0,8).toUpperCase()}      │`,
        `│ Vehicle: ${ticket.vehicle_type.padEnd(10).substring(0,10)}  │`,
        '│                     │',
        `│ Entry: ${formattedEntryTime}        │`,
        `│ Exit:  ${formattedExitTime}        │`,
        `│ Duration: ${formattedDuration.padEnd(10).substring(0,10)} │`,
        '├─────────────────────┤',
        `│ Subtotal:   Rs. ${(ticket.fare_amount || 0).toFixed(2).padStart(5)} │`,
        ticket.discount_amount > 0 ? `│ Discount:   - Rs. ${ticket.discount_amount.toFixed(2).padStart(5)} │` : '',
        ticket.penalty_amount > 0 ? `│ Penalty:    + Rs. ${ticket.penalty_amount.toFixed(2).padStart(5)} │` : '',
        `│ TOTAL:      Rs. ${total_due.toFixed(2).padStart(5)} │`,
        '│                     │',
        `│ Paid: ${(ticket.payment_method || 'N/A').padEnd(15).substring(0,15)} │`,
        ticket.payment_method === 'CASH' ? `│ Received: Rs. ${(ticket.amount_received || 0).toFixed(2).padStart(5)}    │` : '',
        ticket.payment_method === 'CASH' ? `│ Change:   Rs. ${(ticket.change_given || 0).toFixed(2).padStart(5)}     │` : '',
        '│                     │',
        '│   Thank You!   │',
        '└─────────────────────┘',
      ].filter(Boolean).join('\n');
    }

    res.status(200).json({
      success: true,
      printable_text: printableText,
    });
  } catch (err) { next(err); }
};
