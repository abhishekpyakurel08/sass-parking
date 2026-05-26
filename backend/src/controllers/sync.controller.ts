import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Ticket } from '../models/ticket.model.js';
import { TicketStatus, PaymentMethod } from '../types/enums.js';
import { logger } from '../utils/logger.js';

/**
 * POST /api/v1/sync/batch
 * Handles batch sync of offline operations from the mobile app.
 * Resolves timestamp conflicts by relying on the client-provided timestamps.
 */
export const syncBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const tenantId = req.tenant!.tenantId;
    const { operations } = req.body; 

    if (!Array.isArray(operations)) {
      res.status(400).json({ success: false, message: 'Invalid payload: operations must be an array' });
      return;
    }

    const results = { successful: 0, failed: 0, errors: [] as any[] };

    for (const op of operations) {
      try {
        if (op.type === 'CHECK_IN') {
          const { ticket_number, license_plate, vehicle_type, check_in_time, customer_id, notes } = op.data;
          
          // Use upsert to gracefully handle duplicates if the mobile app accidentally sends it twice
          await Ticket.updateOne(
            { ticket_number, tenant_id: tenantId },
            {
              $setOnInsert: {
                tenant_id: tenantId,
                ticket_number,
                license_plate: license_plate?.toUpperCase(),
                vehicle_type,
                check_in_time: new Date(check_in_time),
                status: TicketStatus.ACTIVE,
                fare_amount: 0,
                discount_amount: 0,
                penalty_amount: 0,
                customer_id: customer_id || null,
                notes: notes || ''
              }
            },
            { upsert: true, session }
          );
          results.successful++;

        } else if (op.type === 'CHECK_OUT') {
          const { ticket_number, check_out_time, fare_amount, discount_amount } = op.data;
          
          const result = await Ticket.updateOne(
            { ticket_number, tenant_id: tenantId, status: TicketStatus.ACTIVE },
            {
              $set: {
                check_out_time: new Date(check_out_time),
                fare_amount: fare_amount || 0,
                discount_amount: discount_amount || 0,
                status: TicketStatus.PENDING_PAYMENT
              }
            },
            { session }
          );
          
          if (result.matchedCount === 0) throw new Error('Ticket not found or already checked out');
          results.successful++;

        } else if (op.type === 'PAYMENT') {
          const { ticket_number, payment_method, amount_received, change_given } = op.data;
          
          const result = await Ticket.updateOne(
            { ticket_number, tenant_id: tenantId, status: TicketStatus.PENDING_PAYMENT },
            {
              $set: {
                status: TicketStatus.PAID,
                payment_method: payment_method || PaymentMethod.CASH,
                amount_received: amount_received || 0,
                change_given: change_given || 0
              }
            },
            { session }
          );
          
          if (result.matchedCount === 0) throw new Error('Ticket not found or not pending payment');
          results.successful++;

        } else {
          throw new Error(`Unknown operation type: ${op.type}`);
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push({ ticket_number: op.data?.ticket_number, type: op.type, error: err.message });
      }
    }

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Batch sync completed',
      results
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
