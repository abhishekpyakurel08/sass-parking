import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Tenant } from '../models/tenant.model.js';
import { Ticket } from '../models/ticket.model.js';
import { ParkingSpace } from '../models/parkingSpace.model.js';
import { TicketStatus, SpaceStatus, TenantStatus } from '../types/enums.js';


export const getGlobalAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalTenants,
      activeTenants,
      activeTickets,
      revenueResult,
      totalSpaces,
      occupiedSpaces,
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: TenantStatus.ACTIVE }),
      Ticket.countDocuments({ status: TicketStatus.ACTIVE }),
      Ticket.aggregate([
        { $match: { status: { $in: [TicketStatus.PENDING_PAYMENT, TicketStatus.PAID] } } },
        { $group: { _id: null, total: { $sum: '$fare_amount' } } },
      ]),
      ParkingSpace.countDocuments(),
      ParkingSpace.countDocuments({ status: SpaceStatus.OCCUPIED }),
    ]);

    const totalRevenue = revenueResult[0]?.total ?? 0;
    const occupancyPct = totalSpaces > 0 ? ((occupiedSpaces / totalSpaces) * 100).toFixed(2) : '0.00';

    res.status(200).json({
      success: true,
      data: {
        total_tenants: totalTenants,
        active_tenants: activeTenants,
        total_revenue: totalRevenue,
        active_tickets: activeTickets,
        occupancy_percent: parseFloat(occupancyPct),
        total_spaces: totalSpaces,
        occupied_spaces: occupiedSpaces,
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

    const [spaces, revenueStats, activeTickets, vehicleTrends] = await Promise.all([
      ParkingSpace.aggregate([
        { $match: { tenant_id: tenantOid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        {
          $match: {
            tenant_id: tenantOid,
            status: { $in: [TicketStatus.PENDING_PAYMENT, TicketStatus.PAID] },
          },
        },
        {
          $facet: {
            today:   [{ $match: { check_out_time: { $gte: todayStart } } }, { $group: { _id: null, revenue: { $sum: '$fare_amount' } } }],
            monthly: [{ $match: { check_out_time: { $gte: monthStart } } }, { $group: { _id: null, revenue: { $sum: '$fare_amount' } } }],
          },
        },
      ]),
      Ticket.countDocuments({ tenant_id: tenantOid, status: TicketStatus.ACTIVE }),
      Ticket.aggregate([
        { $match: { tenant_id: tenantOid, check_in_time: { $gte: monthStart } } },
        { $group: { _id: '$vehicle_type', count: { $sum: 1 } } },
      ]),
    ]);

    const spaceMap: Record<string, number> = {};
    for (const s of spaces) spaceMap[s._id as string] = s.count as number;

    res.status(200).json({
      success: true,
      data: {
        today_revenue:   revenueStats[0]?.today?.[0]?.revenue   ?? 0,
        monthly_revenue: revenueStats[0]?.monthly?.[0]?.revenue ?? 0,
        active_tickets:  activeTickets,
        free_spaces:     spaceMap['FREE']     ?? 0,
        occupied_spaces: spaceMap['OCCUPIED'] ?? 0,
        reserved_spaces: spaceMap['RESERVED'] ?? 0,
        vehicle_trends:  vehicleTrends,
        generated_at:    new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
};
