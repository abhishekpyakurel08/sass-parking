import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Ticket } from '../models/ticket.model.js';
import { TicketStatus } from '../types/enums.js';
import { HourlyRate } from '../models/hourlyRate.model.js';
import { Tenant } from '../models/tenant.model.js';
import { User } from '../models/user.model.js';
import { checkIn, checkOut } from './parking.controller.js';

// Reuse parking controller functions to ensure transactions and gate assignment checks
export const vehicleCheckIn = checkIn;
export const vehicleCheckOut = checkOut;

export const getOperatorConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenant?.tenantId;
    if (!tenantId) {
      res.status(403).json({ success: false, message: 'Missing tenant context' });
      return;
    }

    const [rates, tenant, me] = await Promise.all([
      HourlyRate.find({ tenant_id: tenantId }).lean(),
      Tenant.findById(tenantId).lean(),
      User.findById(req.user!.userId).select('-password_hash -refresh_token').lean(),
    ]);

    res.json({
      success: true,
      config: {
        tenant: { name: tenant?.name },
        rates,
        operator: { gate_assignment: me?.gate_assignment, ticket_prefix: me?.ticket_prefix },
        server_time: new Date().toISOString(),
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
