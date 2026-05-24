import type { Request, Response } from 'express';
import { ParkingSpace } from '../models/parkingSpace.model.js';
import { Ticket } from '../models/ticket.model.js';
import { SpaceStatus, TicketStatus } from '../types/enums.js';
import crypto from 'crypto';
import QRCode from 'qrcode';

// 🟩 VEHICLE CHECK-IN (legacy endpoint — kept for backward compat)
export const vehicleCheckIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { license_plate, vehicle_type, floor_level } = req.body;
    const tenantId = req.tenant?.tenantId;
    const userId   = req.user?.userId;

    if (!tenantId) {
      res.status(403).json({ success: false, message: 'Missing tenant context' });
      return;
    }

    const openSlot = await ParkingSpace.findOne({
      tenant_id: tenantId,
      vehicle_type,
      status: SpaceStatus.FREE,
      ...(floor_level && { floor_level }),
    });

    if (!openSlot) {
      res.status(404).json({ success: false, message: `No free space for vehicle type: ${vehicle_type}` });
      return;
    }

    const ticket = await Ticket.create({
      tenant_id: tenantId,
      space_id: openSlot._id,
      license_plate: (license_plate as string).toUpperCase(),
      vehicle_type,
      check_in_time: new Date(),
      status: TicketStatus.ACTIVE,
      fare_amount: 0,
    });

    openSlot.status = SpaceStatus.OCCUPIED;
    await openSlot.save();

    let qrCode = '';
    try {
      qrCode = await QRCode.toDataURL(JSON.stringify({ ticket_id: ticket._id, license_plate }));
    } catch {}

    res.status(201).json({
      success: true,
      ticket: {
        ticket_id: ticket._id,
        space_number: openSlot.space_number,
        floor_level: openSlot.floor_level,
        license_plate: ticket.license_plate,
        check_in_time: ticket.check_in_time,
        qr_code: qrCode,
      },
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
    });

    if (!ticket) {
      res.status(404).json({ success: false, message: 'No active ticket found for this vehicle' });
      return;
    }

    const checkOutTime    = new Date();
    const durationMins    = (checkOutTime.getTime() - ticket.check_in_time.getTime()) / 60000;
    const hours           = Math.ceil(durationMins / 60) || 1;
    const rateMap: Record<string, number> = { CAR: 50, BIKE: 20, TRUCK: 100 };
    const fare            = hours * (rateMap[ticket.vehicle_type] ?? 50);

    ticket.check_out_time = checkOutTime;
    ticket.fare_amount    = fare;
    ticket.status         = TicketStatus.PENDING_PAYMENT;
    await ticket.save();

    await ParkingSpace.findByIdAndUpdate(ticket.space_id, { $set: { status: SpaceStatus.FREE } });

    res.status(200).json({
      success: true,
      summary: {
        license_plate: ticket.license_plate,
        duration_hours: hours,
        fare_amount: fare,
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
