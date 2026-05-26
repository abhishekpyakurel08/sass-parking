import type { Request, Response } from 'express';
import { AuditLog } from '../models/auditLog.model.js';
import { logger } from '../utils/logger.js';

/**
 * Get audit logs for the current tenant
 */
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.user?.tenantId;
    const { limit = '50', page = '1', resource } = req.query;

    const query: any = { tenantId };
    if (resource) {
      query.resource = resource;
    }

    const parsedLimit = parseInt(limit as string, 10) || 50;
    const parsedPage = parseInt(page as string, 10) || 1;
    const skip = (parsedPage - 1) * parsedLimit;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('userId', 'name email role');

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error: any) {
    logger.error(`Error fetching audit logs: ${error.message}`);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};
