import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Tenant } from '../models/tenant.model.js';
import { Ticket } from '../models/ticket.model.js';
import { TicketStatus, TenantStatus } from '../types/enums.js';


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
        { $group: { _id: null, total: { $sum: { $add: ['$fare_amount', '$penalty_amount'] } } } }, // Sum fare and penalty
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

// GET /api/v1/analytics/tenant  [TENANT_OWNER]
export const getTenantAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId   = req.tenant!.tenantId;
    const tenantOid  = new mongoose.Types.ObjectId(tenantId);
    const now        = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [revenueStats, activeTickets, vehicleTrends] = await Promise.all([
      Ticket.aggregate([
        {
          $match: {
            tenant_id: tenantOid,
            status: { $in: [TicketStatus.PENDING_PAYMENT, TicketStatus.PAID] },
          },
        },
        {
          $facet: {
            today:   [{ $match: { check_out_time: { $gte: todayStart } } }, { $group: { _id: null, revenue: { $sum: { $add: ['$fare_amount', '$penalty_amount'] } } } }],
            monthly: [{ $match: { check_out_time: { $gte: monthStart } } }, { $group: { _id: null, revenue: { $sum: { $add: ['$fare_amount', '$penalty_amount'] } } } }],
          },
        },
      ]),
      Ticket.countDocuments({ tenant_id: tenantOid, status: TicketStatus.ACTIVE }),
      Ticket.aggregate([
        { $match: { tenant_id: tenantOid, check_in_time: { $gte: monthStart } } },
        { $group: { _id: '$vehicle_type', count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        today_revenue:   revenueStats[0]?.today?.[0]?.revenue   ?? 0,
        monthly_revenue: revenueStats[0]?.monthly?.[0]?.revenue ?? 0,
        active_tickets:  activeTickets,
        vehicle_trends:  vehicleTrends,
        generated_at:    new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
};
