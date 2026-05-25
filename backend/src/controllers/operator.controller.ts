import type { Request, Response } from 'express';
import { Ticket } from '../models/ticket.model.js';
import { TicketStatus } from '../types/enums.js';
import crypto from 'crypto';
import QRCode from 'qrcode';

// 🟩 VEHICLE CHECK-IN (legacy endpoint — kept for backward compat)
export const vehicleCheckIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { license_plate, vehicle_type } = req.body; // Removed floor_level
    const tenantId = req.tenant?.tenantId;

    if (!tenantId) {
      res.status(403).json({ success: false, message: 'Missing tenant context' });
      return;
    }

    // Check if an active ticket already exists for this plate
    const existingActiveTicket = await Ticket.findOne({
      tenant_id: tenantId,
      license_plate: license_plate.toUpperCase(),
      status: TicketStatus.ACTIVE,
    });

    if (existingActiveTicket) {
      res.status(409).json({ success: false, message: 'This vehicle already has an active parking ticket.' });
      return;
    }

    const ticket = await Ticket.create({
      tenant_id: tenantId,
      license_plate: (license_plate as string).toUpperCase(),
      vehicle_type,
      check_in_time: new Date(),
      status: TicketStatus.ACTIVE,
      fare_amount: 0,
      penalty_amount: 0, // Ensure these default to 0
      discount_amount: 0, // Ensure these default to 0
      ticket_number: crypto.randomUUID(), // Assign a UUID as ticket number
    });

    let qrCode = '';
    try {
      qrCode = await QRCode.toDataURL(JSON.stringify({ ticket_id: ticket._id, license_plate }));
    } catch { /* QR code generation failed, proceed without it */ }


    res.status(201).json({
      success: true,
      ticket: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        license_plate: ticket.license_plate,
        vehicle_type: ticket.vehicle_type, // Added vehicle_type for frontend display consistency
        check_in_time: ticket.check_in_time,
        qr_code: qrCode,
      },
      qrCode: qrCode,
      ticketNumber: ticket.ticket_number
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 🟥 VEHICLE CHECK-OUT (legacy endpoint)
export const vehicleCheckOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { license_plate } = req.body;
    const tenantId = req.tenant?.tenantId;

    const ticket = await Ticket.findOne({
      tenant_id: tenantId,
      license_plate: (license_plate as string).toUpperCase(),
      status: TicketStatus.ACTIVE,
    }).populate('customer_id'); // Populate customer info for discount

    if (!ticket) {
      res.status(404).json({ success: false, message: 'No active ticket found for this vehicle' });
      return;
    }

    const checkOutTime    = new Date();
    const durationMins    = (checkOutTime.getTime() - ticket.check_in_time.getTime()) / 60000;
    const hours           = Math.ceil(durationMins / 60) || 1;
    const rateMap: Record<string, number> = { CAR: 50, BIKE: 20, TRUCK: 100, SUV: 70, BUS: 120 };
    let base_fare         = hours * (rateMap[ticket.vehicle_type] ?? 50);
    let discount_amount   = 0;

    // Apply customer discount if available
    if (ticket.customer_id && typeof (ticket.customer_id as any).discount_percentage === 'number') {
      const customerDiscountPct = (ticket.customer_id as any).discount_percentage;
      discount_amount = base_fare * (customerDiscountPct / 100);
      base_fare -= discount_amount;
    }

    ticket.check_out_time = checkOutTime;
    ticket.fare_amount    = base_fare;
    ticket.discount_amount = discount_amount; // Store applied discount
    ticket.status         = TicketStatus.PENDING_PAYMENT;
    await ticket.save();

    res.status(200).json({
      success: true,
      summary: {
        license_plate: ticket.license_plate,
        duration_hours: hours,
        fare_amount: base_fare, // This is the discounted/final fare
        subtotal_before_discount: hours * (rateMap[ticket.vehicle_type] ?? 50), // Send original subtotal
        discount_amount: discount_amount,
        status: ticket.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 📊 DAILY STATS
export const getDailyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant?.tenantId;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const stats = await Ticket.aggregate([
      { $match: { tenant_id: tenantId, createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, totalVehicles: { $sum: 1 }, totalRevenue: { $sum: '$fare_amount' } } },
    ]);

    const result = stats[0] ?? { totalVehicles: 0, totalRevenue: 0 };
    res.status(200).json({ success: true, data: { date: todayStart.toISOString().split('T')[0], ...result } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
