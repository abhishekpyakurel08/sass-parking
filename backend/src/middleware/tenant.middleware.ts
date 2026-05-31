import type { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/tenant.model.js';
import { AuthError, ForbiddenError, NotFoundError } from '../errors/ApiError.js';
import { UserRole, TenantStatus } from '../types/enums.js';
import { logSecurity } from '../utils/logger.js';
import { tenantCache, invalidateTenant } from '../utils/cache.js';
import mongoose from 'mongoose';

export const tenantMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) return next(new AuthError('Not authenticated'));

    if (user.role === UserRole.SUPER_ADMIN) return next();

    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    const resolvedId = headerTenantId || user.tenantId;

    if (!resolvedId) {
      return next(new AuthError('X-Tenant-ID header is required'));
    }

    if (!mongoose.isValidObjectId(resolvedId)) {
      logSecurity('Invalid tenant ID format', { resolvedId, ip: req.ip });
      return next(new NotFoundError('Tenant not found'));
    }

    if (user.tenantId && user.tenantId !== resolvedId) {
      logSecurity('Cross-tenant access attempt blocked', {
        userId: user.userId,
        ownTenantId: user.tenantId,
        requestedTenantId: resolvedId,
        ip: req.ip,
      });
      return next(new ForbiddenError('Cross-tenant access is not permitted'));
    }

    interface TenantDoc { name: string; status: string; }
    let tenantDoc = tenantCache.get<TenantDoc>(resolvedId);

    if (!tenantDoc) {
      const tenant = await Tenant.findById(resolvedId).lean();
      if (!tenant) return next(new NotFoundError('Tenant not found'));
      tenantDoc = { name: tenant.name, status: tenant.status };
      tenantCache.set(resolvedId, tenantDoc);
    }

    if (tenantDoc.status === TenantStatus.SUSPENDED) {
      invalidateTenant(resolvedId);
      return next(new ForbiddenError('Tenant account is suspended. Contact support.'));
    }

    req.tenant = {
      tenantId: resolvedId,
      tenantName: tenantDoc.name,
    };

    next();
  } catch (err) {
    next(err);
  }
};
