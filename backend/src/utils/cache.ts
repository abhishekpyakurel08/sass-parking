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
  const raw = await redis.get(`tenant:${tenantId}`);
  return raw ? JSON.parse(raw) : null;
};

export const setTenantCache = async (tenantId: string, data: object) => {
  await redis.setex(`tenant:${tenantId}`, 300, JSON.stringify(data));
};

export const invalidateTenant = async (tenantId: string) => {
  await redis.del(`tenant:${tenantId}`);
};

export const getApiKeyFromCache = async (key: string) => {
  const raw = await redis.get(`apikey:${key}`);
  return raw ? JSON.parse(raw) : null;
};

export const setApiKeyCache = async (key: string, data: CachedApiKey) => {
  await redis.setex(`apikey:${key}`, 600, JSON.stringify(data));
};

export const invalidateApiKeysForUser = async (userId: string) => {
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
};

export const incrementRateCount = async (key: string): Promise<number> => {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 60);
  }
  return current;
};
