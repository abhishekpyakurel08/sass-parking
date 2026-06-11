import cron from 'node-cron';
import { Ticket } from '../models/ticket.model.js';
import { logger } from '../utils/logger.js';
import { TicketStatus } from '../types/enums.js';
import { redis } from '../config/redis.js';

const acquireLock = async (key: string, ttlSeconds: number): Promise<boolean> => {
  try {
    const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch (e) {
    return false; // Fail safe
  }
};

export const startCronJobs = (): void => {
  cron.schedule('5 0 * * *', async () => {
    const lockAcquired = await acquireLock('cron:stale-tickets', 3600);
    if (!lockAcquired) {
      logger.info('[CRON] Another instance is running stale ticket cleanup, skipping...');
      return;
    }

    logger.info('[CRON] Running stale ticket cleanup job...');
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const staleTickets = await Ticket.find({
        status: TicketStatus.ACTIVE,
        check_in_time: { $lt: cutoff },
      });

      for (const ticket of staleTickets) {
        ticket.status = TicketStatus.PENDING_PAYMENT;
        ticket.check_out_time = new Date();
        await ticket.save();
      }

      logger.info(`[CRON] Cleaned up ${staleTickets.length} stale tickets`);
    } catch (err) {
      logger.error('[CRON] Stale ticket cleanup failed:', err);
    } finally {
      try {
        await redis.del('cron:stale-tickets');
      } catch (e) {
        // ignore
      }
    }
  });

  logger.info('⏰  Cron jobs scheduled');
};
