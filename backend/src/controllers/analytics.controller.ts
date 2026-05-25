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
    const oneMonthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

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
            today:       [{ $match: { check_out_time: { $gte: todayStart } } }, { $group: { _id: null, revenue: { $sum: { $add: ['$fare_amount', '$penalty_amount'] } } } }],
            oneMonth:    [{ $match: { check_out_time: { $gte: oneMonthStart } } }, { $group: { _id: null, revenue: { $sum: { $add: ['$fare_amount', '$penalty_amount'] } } } }],
            threeMonths: [{ $match: { check_out_time: { $gte: threeMonthsStart } } }, { $group: { _id: null, revenue: { $sum: { $add: ['$fare_amount', '$penalty_amount'] } } } }],
            sixMonths:   [{ $match: { check_out_time: { $gte: sixMonthsStart } } }, { $group: { _id: null, revenue: { $sum: { $add: ['$fare_amount', '$penalty_amount'] } } } }],
          },
        },
      ]),
      Ticket.countDocuments({ tenant_id: tenantOid, status: TicketStatus.ACTIVE }),
      Ticket.aggregate([
        { $match: { tenant_id: tenantOid, check_in_time: { $gte: oneMonthStart } } },
        { $group: { _id: '$vehicle_type', count: { $sum: 1 } } },
      ]),
    ]);

    const today = revenueStats[0]?.today?.[0]?.revenue ?? 0;
    const oneMonth = revenueStats[0]?.oneMonth?.[0]?.revenue ?? 0;
    const threeMonths = revenueStats[0]?.threeMonths?.[0]?.revenue ?? 0;
    const sixMonths = revenueStats[0]?.sixMonths?.[0]?.revenue ?? 0;

    res.status(200).json({
      success: true,
      data: {
        today,
        oneMonth,
        threeMonths,
        sixMonths,
        today_revenue: today,
        monthly_revenue: oneMonth,
        active_tickets: activeTickets,
        vehicle_trends: vehicleTrends,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
};
