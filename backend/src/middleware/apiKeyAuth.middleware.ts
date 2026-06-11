import type { Request, Response, NextFunction } from 'express';
import { ApiKey, hashApiKeyString } from '../models/apiKey.model.js';
import { Tenant } from '../models/tenant.model.js';
import { User } from '../models/user.model.js';
import { AuthError, ForbiddenError } from '../errors/ApiError.js';
import { TenantStatus, UserRole } from '../types/enums.js';
import { getApiKeyFromCache, setApiKeyCache, getTenantFromCache, setTenantCache, invalidateApiKeysForUser, type CachedApiKey, redis } from '../utils/cache.js';
import { logSecurity } from '../utils/logger.js';

export const apiKeyAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer pk_')) {
      return next(new AuthError('API key is missing or malformed (expected: Bearer pk_…)'));
    }

    const rawKey = authHeader.split(' ')[1];
    if (!rawKey) return next(new AuthError('API key value is empty'));

    const keyHash = hashApiKeyString(rawKey);

    let cached = await getApiKeyFromCache(keyHash);

    if (!cached) {
      const keyDoc = await ApiKey.findOne({ keyHash }).lean();
      if (!keyDoc) {
        logSecurity('Invalid API key attempt', { ip: req.ip });
        return next(new AuthError('Invalid API key'));
      }

      let userName = 'API Client';
      let userRole: UserRole = UserRole.GATE_STAFF;
      let userId: string | undefined;

      if (keyDoc.userId) {
        const user = await User.findById(keyDoc.userId).lean();
        if (!user) {
          return next(new AuthError('API key user no longer exists'));
        }
        userName  = user.name;
        userRole  = user.role as UserRole;
        userId    = (user._id as any).toString();
      }

      cached = {
        keyId:    (keyDoc._id as any).toString(),
        tenantId: keyDoc.tenantId.toString(),
        userId,
        name:     keyDoc.name,
        isActive: keyDoc.isActive,
      };

      await setApiKeyCache(keyHash, cached);

      ApiKey.updateOne({ _id: keyDoc._id }, { $set: { lastUsedAt: new Date() } })
        .exec()
        .catch(() => {});
    }

    if (!cached.isActive) {
      try {
        await redis.del(`apikey:${keyHash}`);
      } catch (e) {
        // ignore
      }
      return next(new AuthError('API key is inactive'));
    }

    interface TenantDoc { name: string; status: string; }
    let tenantDoc = await getTenantFromCache(cached.tenantId);
    if (!tenantDoc) {
      const tenant = await Tenant.findById(cached.tenantId).lean();
      if (!tenant) return next(new AuthError('Tenant not found for this API key'));
      tenantDoc = { name: tenant.name, status: tenant.status };
      await setTenantCache(cached.tenantId, tenantDoc);
    }

    if (tenantDoc.status === TenantStatus.SUSPENDED) {
      if (cached.userId) await invalidateApiKeysForUser(cached.userId);
      return next(new ForbiddenError('Tenant account is suspended'));
    }

    req.user = {
      userId:   cached.userId ?? cached.keyId,
      tenantId: cached.tenantId,
      role:     cached.userId ? UserRole.GATE_STAFF : UserRole.GATE_STAFF,
    };

    req.tenant = {
      tenantId:   cached.tenantId,
      tenantName: tenantDoc.name,
    };

    next();
  } catch (err) {
    next(err);
  }
};
