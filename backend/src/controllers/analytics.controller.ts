import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Tenant } from '../models/tenant.model.js';
import { Ticket } from '../models/ticket.model.js';
import { Customer } from '../models/customer.model.js';
import { User } from '../models/user.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import { TicketStatus, TenantStatus, UserRole } from '../types/enums.js';
import { redis } from '../config/redis.js';

export const getGlobalAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalTenants,
      activeTenants,
      activeTickets,
      revenueResult,
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: TenantStatus.ACTIVE }),
      Ticket.countDocuments({ status: TicketStatus.ACTIVE }),
      Ticket.aggregate([
        { $match: { status: { $in: [TicketStatus.PENDING_PAYMENT, TicketStatus.PAID] } } },
        { $group: { _id: null, total: { $sum: { $add: ['$fare_amount', '$penalty_amount'] } } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total ?? 0;

    res.status(200).json({
      success: true,
      data: {
        total_tenants: totalTenants,
        active_tenants: activeTenants,
        total_revenue: totalRevenue,
        active_tickets: activeTickets,
        system_health: 'OK',
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
};

export const getTenantAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId   = req.tenant!.tenantId;
    const tenantOid  = new mongoose.Types.ObjectId(tenantId);
    
    const type = req.query.type as string || 'dashboard';
    const period = req.query.period as string || req.query.filter as string || 'today';

    // Check cache first
    const cacheKey = `analytics:${tenantId}:${type}:${period}`;
    let cached: string | null = null;
    try {
      cached = await redis.get(cacheKey);
    } catch (e) {
      // ignore
    }
    
    if (cached) {
      res.status(200).json(JSON.parse(cached));
      return;
    }

    let responseData: any = null;

    if (type === 'dashboard') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [activeVehicles, todayRevenueStats, totalCustomers, staffOnDuty] = await Promise.all([
        Ticket.countDocuments({ tenant_id: tenantOid, status: TicketStatus.ACTIVE }),
        Ticket.aggregate([
          {
            $match: {
              tenant_id: tenantOid,
              status: { $in: [TicketStatus.PENDING_PAYMENT, TicketStatus.PAID] },
              check_out_time: { $gte: startOfToday }
            },
          },
          {
            $group: { 
              _id: null, 
              revenue: { $sum: { $add: ['$fare_amount', '$penalty_amount'] } } 
            }
          }
        ]),
        Customer.countDocuments({ tenant_id: tenantOid }),
        User.countDocuments({ tenant_id: tenantOid, role: UserRole.GATE_STAFF })
      ]);

      const todayRevenue = todayRevenueStats[0]?.revenue ?? 0;

      responseData = {
        activeVehicles,
        todayRevenue,
        totalCustomers,
        staffOnDuty
      };
    } else if (type === 'revenue') {
      const now = new Date();
      let startDate = new Date();
      let groupFormat = "%Y-%m-%d";

      if (period === 'today') {
        startDate.setHours(0, 0, 0, 0);
        groupFormat = "%Y-%m-%dT%H:00:00.000Z";
      } else if (period === 'month' || period === 'monthly') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else { // default to week
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const revenueByGroup = await Ticket.aggregate([
        {
          $match: {
            tenant_id: tenantOid,
            status: { $in: [TicketStatus.PENDING_PAYMENT, TicketStatus.PAID] },
            check_out_time: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: groupFormat, date: "$check_out_time" }
            },
            revenue: { $sum: { $add: ['$fare_amount', '$penalty_amount'] } },
            tickets: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      responseData = revenueByGroup.map(item => ({
        date: item._id,
        revenue: item.revenue,
        tickets: item.tickets
      }));
    } else if (type === 'vehicles') {
      const now = new Date();
      let startDate = new Date();

      if (period === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'month' || period === 'monthly') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else { // default to week
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const vehicleStats = await Ticket.aggregate([
        {
          $match: {
            tenant_id: tenantOid,
            check_in_time: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$vehicle_type',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalCount = vehicleStats.reduce((sum, item) => sum + item.count, 0) || 1;
      responseData = vehicleStats.map(item => ({
        vehicleType: item._id,
        count: item.count,
        percentage: (item.count / totalCount) * 100
      }));
    } else if (type === 'staff') {
      const staffPerformance = await AuditLog.aggregate([
        {
          $match: {
            tenantId: tenantOid,
            action: { $in: ['Parking:CheckIn', 'Parking:CheckOut', 'Parking:ProcessPayment', 'OperatorApp:CheckIn', 'OperatorApp:CheckOut', 'OperatorApp:ProcessPayment'] }
          }
        },
        {
          $group: {
            _id: '$userId',
            ticketsProcessed: { $sum: 1 }
          }
        }
      ]);

      const userIds = staffPerformance.map(item => item._id);
      const users = await User.find({ _id: { $in: userIds } }).select('name').lean();
      const userMap = new Map(users.map(u => [u._id.toString(), u.name]));

      responseData = staffPerformance.map(item => ({
        staffName: userMap.get(item._id?.toString() || '') || 'Staff Operator',
        ticketsProcessed: item.ticketsProcessed,
        revenueGenerated: item.ticketsProcessed * 50 // estimate Rs. 50 per ticket activity
      }));

      if (responseData.length === 0) {
        const allStaff = await User.find({ tenant_id: tenantOid, role: UserRole.GATE_STAFF }).select('name').lean();
        responseData = allStaff.map(s => ({
          staffName: s.name,
          ticketsProcessed: 0,
          revenueGenerated: 0
        }));
      }
    }

    const response = {
      success: true,
      data: responseData,
      generated_at: new Date().toISOString(),
    };

    // Cache for 5 minutes
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(response));
    } catch (e) {
      // ignore
    }

    res.status(200).json(response);
  } catch (err) { next(err); }
};
