import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableOfflineQueue: false,
});

redis.on('error', (err: Error) => logger.error('Redis error:', err));
redis.on('connect', () => logger.info('✅  Redis connected'));
