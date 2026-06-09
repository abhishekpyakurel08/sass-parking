import { Redis } from 'ioredis';
import { env } from './env.js';

const redisUrl = env.REDIS_URL || 'redis://default:Byvr7jKiaGJreN6SIoCbdj3Jcy98qZ1E@redis-18433.crce179.ap-south-1-1.ec2.cloud.redislabs.com:18433';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 0,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null,
});

redis.on('error', (err: Error) => {
  // Suppress Redis errors - cache is optional
});
