import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Tenant } from '../models/tenant.model.js';
import { Ticket } from '../models/ticket.model.js';
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
    
    const userRole = req.user?.role;
    const isOperator = userRole === UserRole.GATE_STAFF;
    
    const rawFilter = isOperator ? 'today' : (req.query.filter as string || 'today');
    const allowedFilters = ['today', 'weekly', 'monthly'];
    const filter = allowedFilters.includes(rawFilter) ? rawFilter : 'today';

    // Check cache first
    const cacheKey = `analytics:${tenantId}:${filter}`;
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

    const now = new Date();
    let startDate: Date;

    if (filter === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (filter === 'monthly') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const [revenueStats, activeTickets, vehicleTrends] = await Promise.all([
      Ticket.aggregate([
        {
          $match: {
            tenant_id: tenantOid,
            status: { $in: [TicketStatus.PENDING_PAYMENT, TicketStatus.PAID] },
            check_out_time: { $gte: startDate }
          },
        },
        {
          $group: { 
            _id: null, 
            revenue: { $sum: { $add: ['$fare_amount', '$penalty_amount'] } } 
          }
        }
      ]),
      Ticket.countDocuments({ tenant_id: tenantOid, status: TicketStatus.ACTIVE }),
      Ticket.aggregate([
        { 
          $match: { 
            tenant_id: tenantOid, 
            check_in_time: { $gte: startDate } 
          } 
        },
        { $group: { _id: '$vehicle_type', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = revenueStats[0]?.revenue ?? 0;

    const response = {
      success: true,
      data: {
        filter,
        revenue: totalRevenue,
        active_tickets: activeTickets,
        vehicle_trends: vehicleTrends,
        generated_at: new Date().toISOString(),
      },
    };

    // Cache for 5 minutes (analytics don't need to be real-time)
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(response));
    } catch (e) {
      // ignore
    }

    res.status(200).json(response);
  } catch (err) { next(err); }
};
