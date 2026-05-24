import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ParkingSpace } from '../models/parkingSpace.model.js';
import { Ticket } from '../models/ticket.model.js';
import { HourlyRate } from '../models/hourlyRate.model.js';
import mongoose from 'mongoose';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../errors/ApiError.js';
import { SpaceStatus, TicketStatus } from '../types/enums.js';
import { logTransaction } from '../utils/logger.js';
import { generateQrCodeDataUri } from '../utils/qr.js';

export const getSpaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;

    const filter: Record<string, unknown> = { tenant_id: tenantId };
    if (req.query.status)       filter.status       = req.query.status;
    if (req.query.vehicle_type) filter.vehicle_type = req.query.vehicle_type;
    if (req.query.floor_level)  filter.floor_level  = req.query.floor_level;

    const spaces = await ParkingSpace.find(filter).sort({ floor_level: 1, space_number: 1 }).lean();

    res.status(200).json({ success: true, data: spaces });
  } catch (err) { next(err); }
};


export const createSpace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { floor_level, space_number, vehicle_type } = req.body;

    const existing = await ParkingSpace.findOne({ tenant_id: tenantId, space_number });
    if (existing) return next(new ConflictError(`Space ${space_number} already exists for this tenant`));

    const space = await ParkingSpace.create({ tenant_id: tenantId, floor_level, space_number, vehicle_type });
    res.status(201).json({ success: true, data: space });
  } catch (err) { next(err); }
};


export const checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.tenant!.tenantId;
    const { space_id, license_plate, vehicle_type } = req.body;

    // 1. Validate space belongs to tenant
    const space = await ParkingSpace.findOne({ _id: space_id, tenant_id: tenantId }).session(session);
    if (!space) return next(new NotFoundError('Parking space not found or does not belong to this tenant'));

    // 2. Ensure space is FREE
    if (space.status !== SpaceStatus.FREE) {
      await session.abortTransaction();
      return next(new ValidationError(`Space ${space.space_number} is currently ${space.status}`));
    }

    // 3. Check no active ticket exists for this plate in this tenant
    const activeTicket = await Ticket.findOne({
      tenant_id: tenantId,
      license_plate: license_plate.toUpperCase(),
      status: TicketStatus.ACTIVE,
    }).session(session);

    if (activeTicket) {
      await session.abortTransaction();
      return next(new ConflictError('This vehicle already has an active parking ticket'));
    }

    // 4. Mark space OCCUPIED
    space.status = SpaceStatus.OCCUPIED;
    await space.save({ session });

    // Generate UUID for ticket number
    const ticketUUID = crypto.randomUUID();

    const entryTime = new Date();
    // 5. Create ticket with UUID
    const ticket = await Ticket.create(
      [{
        tenant_id: tenantId,
        space_id: space._id,
        ticket_number: ticketUUID,
        license_plate: license_plate.toUpperCase(),
        vehicle_type,
        check_in_time: entryTime,
        status: TicketStatus.ACTIVE,
        fare_amount: 0,
      }],
      { session }
    );

    await session.commitTransaction();

    logTransaction('CHECK_IN', {
      tenantId,
      ticketId: ticket[0]._id,
      ticket_number: ticketUUID,
      license_plate,
      space_number: space.space_number,
    });

    // Generate QR Code Data URL from UUID
    const qrCodeDataUrl = await generateQrCodeDataUri(ticketUUID);

    // Format entry date properly
    const businessName = req.tenant?.tenantName || 'Parking System';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formattedDate = `${entryTime.getFullYear()}-${pad(entryTime.getMonth() + 1)}-${pad(entryTime.getDate())} ${pad(entryTime.getHours())}:${pad(entryTime.getMinutes())}:${pad(entryTime.getSeconds())}`;

    // Generate ASCII printable receipt format
    const printableReceipt = [
      '========================================',
      `          ${businessName.toUpperCase().padEnd(28).substring(0, 28)}`,
      '========================================',
      ` TICKET NO   : ${ticketUUID}`,
      ` PLATE NO    : ${ticket[0].license_plate}`,
      ` VEHICLE TYPE: ${ticket[0].vehicle_type}`,
      ` SPACE NO    : ${space.space_number} (FLOOR: ${space.floor_level})`,
      ` ENTRY TIME  : ${formattedDate}`,
      '----------------------------------------',
      '      PLEASE SCAN QR CODE TO EXIT',
      '========================================',
    ].join('\n');

    res.status(201).json({
      success: true,
      ticket: {
        ticket_id: ticket[0]._id,
        ticket_number: ticketUUID,
        space_number: space.space_number,
        floor_level: space.floor_level,
        license_plate: ticket[0].license_plate,
        vehicle_type: ticket[0].vehicle_type,
        check_in_time: ticket[0].check_in_time,
        qr_code_url: qrCodeDataUrl,
      },
      receipt: {
        business_name: businessName,
        ticket_number: ticketUUID,
        license_plate: ticket[0].license_plate,
        vehicle_type: ticket[0].vehicle_type,
        entry_time: formattedDate,
        space_number: space.space_number,
        floor_level: space.floor_level,
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
// POST /api/v1/parking/check-out
// Transactional: find ticket → calculate fare → PENDING_PAYMENT → free space
// ─────────────────────────────────────────────────────────────────────────────
export const checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tenantId = req.tenant!.tenantId;
    const { ticket_id } = req.body;

    // 1. Find active ticket scoped to tenant (supports either UUID ticket_number OR Object ID)
    const query = mongoose.isValidObjectId(ticket_id)
      ? { _id: ticket_id, tenant_id: tenantId, status: TicketStatus.ACTIVE }
      : { ticket_number: ticket_id, tenant_id: tenantId, status: TicketStatus.ACTIVE };

    const ticket = await Ticket.findOne(query).session(session);

    if (!ticket) {
      await session.abortTransaction();
      return next(new NotFoundError('Active ticket not found'));
    }

    // 2. Calculate elapsed time
    const checkOutTime  = new Date();
    const durationMs    = checkOutTime.getTime() - ticket.check_in_time.getTime();
    const durationMins  = durationMs / (1000 * 60);

    // 3. Round up to nearest hour
    const hours = Math.ceil(durationMins / 60) || 1; // minimum 1 hour

    // 4. Fetch tenant's hourly rate for this vehicle type
    const rateDoc = await HourlyRate.findOne({
      tenant_id: tenantId,
      vehicle_type: ticket.vehicle_type,
    }).session(session);

    const rate_per_hour = rateDoc?.rate_per_hour ?? 50; // fallback default
    const fare_amount   = hours * rate_per_hour;

    // 5 & 6. Update ticket
    ticket.check_out_time = checkOutTime;
    ticket.fare_amount    = fare_amount;
    ticket.status         = TicketStatus.PENDING_PAYMENT;
    await ticket.save({ session });

    // 7. Free the parking space
    await ParkingSpace.findByIdAndUpdate(
      ticket.space_id,
      { $set: { status: SpaceStatus.FREE } },
      { session }
    );

    // 8. Commit transaction
    await session.commitTransaction();

    logTransaction('CHECK_OUT', {
      tenantId,
      ticketId: ticket._id,
      ticket_number: ticket.ticket_number,
      license_plate: ticket.license_plate,
      durationHours: hours,
      fare_amount,
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
        duration_hours: hours,
        rate_per_hour,
        fare_amount,
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
// POST /api/v1/parking/scan
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
        { license_plate: code.toUpperCase() }
      ]
    }).populate('space_id', 'space_number floor_level');

    if (!ticket) {
      return next(new NotFoundError('No ticket matches the scanned QR code/license plate'));
    }

    const qrCodeDataUrl = await generateQrCodeDataUri(ticket.ticket_number);

    res.status(200).json({
      success: true,
      ticket: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        space_number: (ticket.space_id as any)?.space_number ?? 'N/A',
        floor_level: (ticket.space_id as any)?.floor_level ?? 'N/A',
        license_plate: ticket.license_plate,
        vehicle_type: ticket.vehicle_type,
        check_in_time: ticket.check_in_time,
        check_out_time: ticket.check_out_time,
        fare_amount: ticket.fare_amount,
        status: ticket.status,
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

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate('space_id', 'space_number floor_level')
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
