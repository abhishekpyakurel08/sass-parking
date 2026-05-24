import type { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/tenant.model.js';
import { AuthError, ForbiddenError, NotFoundError } from '../errors/ApiError.js';
import { UserRole, TenantStatus } from '../types/enums.js';
import { logSecurity } from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Tenant Isolation Middleware
 *
 * Reads X-Tenant-ID header, validates the tenant exists and is ACTIVE,
 * then injects req.tenant = { tenantId, tenantName } for all downstream
 * handlers. All MongoDB queries MUST enforce { tenant_id: req.tenant.tenantId }.
 *
 * SUPER_ADMIN: bypasses tenant filtering entirely (req.tenant stays undefined).
 * All other roles: X-Tenant-ID header is required.
 */
export const tenantMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) return next(new AuthError('Not authenticated'));

    // SUPER_ADMIN can operate globally — no tenant context required
    if (user.role === UserRole.SUPER_ADMIN) return next();

    // For all other roles: resolve tenant from header or JWT payload
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    const resolvedId = headerTenantId || user.tenantId;

    if (!resolvedId) {
      return next(new AuthError('X-Tenant-ID header is required'));
    }

    // Prevent BSON cast errors on bad IDs
    if (!mongoose.isValidObjectId(resolvedId)) {
      logSecurity('Invalid tenant ID format', { resolvedId, ip: req.ip });
      return next(new NotFoundError('Tenant not found'));
    }

    // Cross-tenant access prevention:
    // Non-SUPER_ADMIN users can only access their OWN tenant
    if (user.tenantId && user.tenantId !== resolvedId) {
      logSecurity('Cross-tenant access attempt blocked', {
        userId: user.userId,
        ownTenantId: user.tenantId,
        requestedTenantId: resolvedId,
        ip: req.ip,
      });
      return next(new ForbiddenError('Cross-tenant access is not permitted'));
    }

    const tenant = await Tenant.findById(resolvedId).lean();
    if (!tenant) return next(new NotFoundError('Tenant not found'));

    if (tenant.status === TenantStatus.SUSPENDED) {
      return next(new ForbiddenError('Tenant account is suspended. Contact support.'));
    }

    // Inject tenant context for all downstream controllers
    req.tenant = {
      tenantId: resolvedId,
      tenantName: tenant.name,
    };

    next();
  } catch (err) {
    next(err);
  }
};
