import NodeCache from 'node-cache';

export const tenantCache = new NodeCache({
  stdTTL: 5 * 60,
  checkperiod: 60,
  useClones: false,
  deleteOnExpire: true,
});

export interface CachedApiKey {
  keyId: string;
  tenantId: string;
  userId?: string;
  name: string;
  isActive: boolean;
}

export const apiKeyCache = new NodeCache({
  stdTTL: 10 * 60,
  checkperiod: 120,
  useClones: false,
  deleteOnExpire: true,
});

export const rateLimitCache = new NodeCache({
  stdTTL: 60,
  checkperiod: 30,
  useClones: false,
  deleteOnExpire: true,
});

export const invalidateTenant = (tenantId: string): void => {
  tenantCache.del(tenantId);
};

export const invalidateApiKeysForUser = (userId: string): void => {
  const allKeys = apiKeyCache.keys();
  for (const k of allKeys) {
    const entry = apiKeyCache.get<CachedApiKey>(k);
    if (entry?.userId === userId) {
      apiKeyCache.del(k);
    }
  }
};

export const incrementRateCount = (key: string): number => {
  const current = rateLimitCache.get<number>(key) ?? 0;
  const next = current + 1;
  const ttl = rateLimitCache.getTtl(key);
  if (ttl) {
    const remaining = Math.max(Math.ceil((ttl - Date.now()) / 1000), 1);
    rateLimitCache.set(key, next, remaining);
  } else {
    rateLimitCache.set(key, next);
  }
  return next;
};
