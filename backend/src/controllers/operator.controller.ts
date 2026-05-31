import type { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { Ticket } from '../models/ticket.model.js';
import { TicketStatus } from '../types/enums.js';
import { HourlyRate } from '../models/hourlyRate.model.js';
import { Customer } from '../models/customer.model.js';
import { generateTicketNumber } from '../utils/ticketNumber.js';
import QRCode from 'qrcode';

export const vehicleCheckIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { license_plate, vehicle_type, customer_code } = req.body;
    const tenantId = req.tenant?.tenantId;

    if (!tenantId) {
      res.status(403).json({ success: false, message: 'Missing tenant context' });
      return;
    }

    let resolvedLicensePlate = license_plate;
    let customerId = undefined;

    if (customer_code) {
      const customer = await Customer.findOne({ tenant_id: tenantId, customer_code });
      if (!customer) {
        res.status(404).json({ success: false, message: 'Regular customer not found with the provided code.' });
        return;
      }
      if (customer.status !== 'ACTIVE') {
        res.status(400).json({ success: false, message: `Customer account is ${customer.status}.` });
        return;
      }
      customerId = customer._id;
      if (!resolvedLicensePlate) {
        resolvedLicensePlate = `CUSTOMER-${customer_code}-${randomBytes(4).toString('hex').toUpperCase()}`;
      }
    } else if (!license_plate) {
      res.status(400).json({ success: false, message: 'Either license plate or customer code must be provided for check-in' });
      return;
    }

    const existingActiveTicket = await Ticket.findOne({
      tenant_id: tenantId,
      license_plate: resolvedLicensePlate.toUpperCase(),
      status: TicketStatus.ACTIVE,
    });

    if (existingActiveTicket) {
      res.status(409).json({ success: false, message: 'This vehicle already has an active parking ticket.' });
      return;
    }

    const ticket = await Ticket.create({
      tenant_id: tenantId,
      customer_id: customerId,
      license_plate: resolvedLicensePlate.toUpperCase(),
      vehicle_type,
      check_in_time: new Date(),
      status: TicketStatus.ACTIVE,
      fare_amount: 0,
      penalty_amount: 0,
      discount_amount: 0,
      ticket_number: generateTicketNumber(vehicle_type),
    });

    let qrCode = '';
    try {
      qrCode = await QRCode.toDataURL(JSON.stringify({ ticket_id: ticket._id, license_plate: ticket.license_plate }));
    } catch {}

    res.status(201).json({
      success: true,
      ticket: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        license_plate: ticket.license_plate,
        vehicle_type: ticket.vehicle_type,
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

export const vehicleCheckOut = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticket_id, license_plate } = req.body;
    const identifier = ticket_id || license_plate;
    const tenantId = req.tenant?.tenantId;

    if (!tenantId) {
      res.status(403).json({ success: false, message: 'Missing tenant context' });
      return;
    }

    if (!identifier) {
      res.status(400).json({ success: false, message: 'License plate or ticket ID is required' });
      return;
    }

    let query: any = { tenant_id: tenantId, status: TicketStatus.ACTIVE };

    const cleanIdentifier = (identifier as string).trim();
    if (mongoose.isValidObjectId(cleanIdentifier)) {
      query._id = cleanIdentifier;
    } else if (/^PKT-[A-Z]{2}-\d{4}$/i.test(cleanIdentifier)) {
      query.ticket_number = cleanIdentifier.toUpperCase();
    } else {
      query.license_plate = cleanIdentifier.toUpperCase();
    }

    const ticket = await Ticket.findOne(query).populate('customer_id');

    if (!ticket) {
      res.status(404).json({ success: false, message: 'No active ticket found matching the identifier' });
      return;
    }

    const checkOutTime = new Date();
    const durationMs = checkOutTime.getTime() - ticket.check_in_time.getTime();
    let durationMins = durationMs / (1000 * 60);

    const rateDoc = await HourlyRate.findOne({
      tenant_id: tenantId,
      vehicle_type: ticket.vehicle_type,
    });

    const rate_per_hour = rateDoc?.rate_per_hour ?? 50;
    const grace_period_minutes = rateDoc?.grace_period_minutes ?? 0;

    let base_fare = 0;
    let discount_amount = 0;
    let total_charge_before_discount_or_grace = 0;

    if (durationMins > grace_period_minutes) {
      durationMins -= grace_period_minutes;
      const hours = Math.ceil(durationMins / 60) || 1;
      base_fare = hours * rate_per_hour;
      total_charge_before_discount_or_grace = (hours * rate_per_hour) + (rate_per_hour * (grace_period_minutes / 60));
    } else {
      base_fare = 0;
      total_charge_before_discount_or_grace = 0;
    }

    if (ticket.customer_id && typeof (ticket.customer_id as any).discount_percentage === 'number' && base_fare > 0) {
      const customerDiscountPct = (ticket.customer_id as any).discount_percentage;
      discount_amount = base_fare * (customerDiscountPct / 100);
      base_fare -= discount_amount;
    }

    ticket.check_out_time = checkOutTime;
    ticket.fare_amount = base_fare;
    ticket.discount_amount = discount_amount;
    ticket.status = TicketStatus.PENDING_PAYMENT;
    await ticket.save();

    res.status(200).json({
      success: true,
      summary: {
        ticket_id: ticket._id,
        ticket_number: ticket.ticket_number,
        license_plate: ticket.license_plate,
        vehicle_type: ticket.vehicle_type,
        check_in_time: ticket.check_in_time,
        check_out_time: checkOutTime,
        duration_hours: (durationMs / (1000 * 60 * 60)),
        duration_minutes: durationMs / (1000 * 60),
        rate_per_hour,
        subtotal: total_charge_before_discount_or_grace,
        discount: discount_amount,
        total_amount: base_fare,
        status: ticket.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDailyStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant?.tenantId;
    if (!tenantId) {
      res.status(403).json({ success: false, message: 'Missing tenant context' });
      return;
    }
    const tenantOid = new mongoose.Types.ObjectId(tenantId);
    
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const stats = await Ticket.aggregate([
      { $match: { tenant_id: tenantOid, createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { 
        $group: { 
          _id: null, 
          totalVehicles: { $sum: 1 }, 
          completedSessions: { 
            $sum: { 
              $cond: [{ $ne: ['$status', TicketStatus.ACTIVE] }, 1, 0] 
            } 
          },
          totalRevenue: { $sum: '$fare_amount' } 
        } 
      },
    ]);

    const result = stats[0] ?? { totalVehicles: 0, completedSessions: 0, totalRevenue: 0 };
    res.status(200).json({ success: true, data: { date: todayStart.toISOString().split('T')[0], ...result } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
