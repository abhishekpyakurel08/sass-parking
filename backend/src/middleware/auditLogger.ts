import type { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../models/auditLog.model.js';
import { logger } from '../utils/logger.js';

export const auditAction = (resource: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
        if (req.user && req.user.tenantId && req.user.userId) {
          const safeBody = { ...req.body };
          if (safeBody.password) delete safeBody.password;
          if (safeBody.password_hash) delete safeBody.password_hash;

          const logEntry = new AuditLog({
            tenantId: req.user.tenantId,
            userId: req.user.userId,
            action: req.method,
            resource,
            details: {
               url: req.originalUrl,
               body: safeBody,
               statusCode: res.statusCode
            },
            ipAddress: req.ip || req.socket.remoteAddress || '0.0.0.0'
          });
          
          logEntry.save().catch(err => logger.error(`AuditLog save error: ${err.message}`));
        }
      }
    });
    next();
  };
};
