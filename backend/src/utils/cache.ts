import { redis } from '../config/redis.js';

export { redis };

export interface CachedApiKey {
  keyId: string;
  tenantId: string;
  userId?: string;
  name: string;
  isActive: boolean;
}

export const getTenantFromCache = async (tenantId: string) => {
  try {
    const raw = await redis.get(`tenant:${tenantId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setTenantCache = async (tenantId: string, data: object) => {
  try {
    await redis.setex(`tenant:${tenantId}`, 300, JSON.stringify(data));
  } catch {
    // Silent fail - cache is optional
  }
};

export const invalidateTenant = async (tenantId: string) => {
  try {
    await redis.del(`tenant:${tenantId}`);
  } catch {
    // Silent fail - cache is optional
  }
};

export const getApiKeyFromCache = async (key: string) => {
  try {
    const raw = await redis.get(`apikey:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setApiKeyCache = async (key: string, data: CachedApiKey) => {
  try {
    await redis.setex(`apikey:${key}`, 600, JSON.stringify(data));
  } catch {
    // Silent fail - cache is optional
  }
};

export const invalidateApiKeysForUser = async (userId: string) => {
  try {
    const pattern = 'apikey:*';
    const keys = await redis.keys(pattern);
    for (const k of keys) {
      const raw = await redis.get(k);
      if (raw) {
        const entry = JSON.parse(raw) as CachedApiKey;
        if (entry.userId === userId) {
          await redis.del(k);
        }
      }
    }
  } catch {
    // Silent fail - cache is optional
  }
};

export const incrementRateCount = async (key: string): Promise<number> => {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 60);
    }
    return current;
  } catch {
    return 0;
  }
};
