import type { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/tenant.model.js';
import { AuthError, ForbiddenError, NotFoundError } from '../errors/ApiError.js';
import { UserRole, TenantStatus } from '../types/enums.js';
import { logSecurity } from '../utils/logger.js';
import { getTenantFromCache, setTenantCache, invalidateTenant } from '../utils/cache.js';
import { extractSubdomain, normalizeSlug } from '../utils/subdomain.js';
import mongoose from 'mongoose';

export const tenantMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) return next(new AuthError('Not authenticated'));

    // Priority: 1. Extract from Host header (subdomain), 2. X-Tenant-Slug header, 3. X-Tenant-ID header, 4. user.tenantId
    const host = req.headers.host;
    const subdomain = extractSubdomain(host || '');
    const headerTenantSlug = req.headers['x-tenant-slug'] as string | undefined;
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    
    let resolvedId: string | undefined;
    let tenantSlug: string | undefined;
    
    // Priority 0 — dev only, before all other checks
    if (process.env.NODE_ENV === 'development') {
      const devSlug = process.env.DEV_TENANT_SLUG;
      if (devSlug && !subdomain && !headerTenantSlug) {
        const tenant = await Tenant.findOne({ slug: devSlug }).lean();
        if (tenant) {
          resolvedId = tenant._id.toString();
          tenantSlug = devSlug;
        }
      }
    }
    
    // Try to resolve tenant by subdomain from Host header first
    if (!resolvedId && subdomain) {
      const normalizedSlug = normalizeSlug(subdomain);
      if (!normalizedSlug) {
        logSecurity('Invalid subdomain format', { subdomain, host, ip: req.ip });
        return next(new NotFoundError('Invalid subdomain format'));
      }
      const tenant = await Tenant.findOne({ slug: normalizedSlug }).lean();
      if (!tenant) {
        logSecurity('Tenant not found by subdomain', { subdomain: normalizedSlug, host, ip: req.ip });
        return next(new NotFoundError('Tenant not found for this subdomain'));
      }
      resolvedId = tenant._id.toString();
      tenantSlug = normalizedSlug;
    } 
    // Fallback to X-Tenant-Slug header
    else if (!resolvedId && headerTenantSlug) {
      const normalizedSlug = normalizeSlug(headerTenantSlug);
      if (!normalizedSlug) {
        logSecurity('Invalid slug header format', { slug: headerTenantSlug, ip: req.ip });
        return next(new NotFoundError('Invalid tenant slug format'));
      }
      const tenant = await Tenant.findOne({ slug: normalizedSlug }).lean();
      if (!tenant) {
        logSecurity('Tenant not found by slug header', { slug: normalizedSlug, ip: req.ip });
        return next(new NotFoundError('Tenant not found'));
      }
      resolvedId = tenant._id.toString();
      tenantSlug = normalizedSlug;
    } 
    // Fallback to X-Tenant-ID header or user.tenantId
    else if (!resolvedId) {
      resolvedId = headerTenantId || user.tenantId || undefined;
    }

    if (!resolvedId) {
      if (user.role === UserRole.SUPER_ADMIN) return next();
      return next(new AuthError('Unable to determine tenant. Provide subdomain, X-Tenant-Slug, or X-Tenant-ID header'));
    }

    if (!mongoose.isValidObjectId(resolvedId)) {
      logSecurity('Invalid tenant ID format', { resolvedId, ip: req.ip });
      return next(new NotFoundError('Tenant not found'));
    }

    if (user.role !== UserRole.SUPER_ADMIN && user.tenantId && user.tenantId !== resolvedId) {
      logSecurity('Cross-tenant access attempt blocked', {
        userId: user.userId,
        ownTenantId: user.tenantId,
        requestedTenantId: resolvedId,
        tenantSlug,
        ip: req.ip,
      });
      return next(new ForbiddenError('Cross-tenant access is not permitted'));
    }

    let tenantDoc = await getTenantFromCache(resolvedId);

    if (!tenantDoc) {
      const tenant = await Tenant.findById(resolvedId).lean();
      if (!tenant) return next(new NotFoundError('Tenant not found'));
      tenantDoc = { name: tenant.name, status: tenant.status, slug: tenant.slug };
      await setTenantCache(resolvedId, tenantDoc);
    }

    if (tenantDoc.status === TenantStatus.SUSPENDED) {
      await invalidateTenant(resolvedId);
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
