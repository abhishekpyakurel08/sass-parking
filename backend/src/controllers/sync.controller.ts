import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Ticket } from '../models/ticket.model.js';
import { TicketStatus, PaymentMethod } from '../types/enums.js';

interface SyncError {
  ticket_number?: string;
  type: string;
  error: string;
}

export const syncBatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenant!.tenantId;
    const { operations } = req.body;

    if (!Array.isArray(operations)) {
      res.status(400).json({ success: false, message: 'Invalid payload: operations must be an array' });
      return;
    }

    const results = { successful: 0, failed: 0, errors: [] as SyncError[] };

    // Each operation is independent with its own try-catch for idempotent sync
    for (const op of operations) {
      try {
        if (op.type === 'CHECK_IN') {
          const { ticket_number, license_plate, vehicle_type, check_in_time, customer_id, notes } = op.data;

          if (!ticket_number || !vehicle_type || !check_in_time) {
            throw new Error('CHECK_IN operation requires ticket_number, vehicle_type, and check_in_time');
          }

          const parsedDate = new Date(check_in_time);
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid check_in_time format');
          }

          await Ticket.updateOne(
            { ticket_number, tenant_id: tenantId },
            {
              $setOnInsert: {
                tenant_id: tenantId,
                ticket_number,
                license_plate: license_plate ? license_plate.toUpperCase() : `GUEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                vehicle_type,
                check_in_time: parsedDate,
                status: TicketStatus.ACTIVE,
                fare_amount: 0,
                discount_amount: 0,
                penalty_amount: 0,
                customer_id: customer_id || null,
                notes: notes || ''
              }
            },
            { upsert: true }
          );
          results.successful++;

        } else if (op.type === 'CHECK_OUT') {
          const { ticket_number, check_out_time, fare_amount, discount_amount } = op.data;

          if (!ticket_number || !check_out_time) {
            throw new Error('CHECK_OUT operation requires ticket_number and check_out_time');
          }

          const parsedDate = new Date(check_out_time);
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid check_out_time format');
          }

          const result = await Ticket.updateOne(
            { ticket_number, tenant_id: tenantId, status: TicketStatus.ACTIVE },
            {
              $set: {
                check_out_time: parsedDate,
                fare_amount: fare_amount || 0,
                discount_amount: discount_amount || 0,
                status: TicketStatus.PENDING_PAYMENT
              }
            }
          );

          if (result.matchedCount === 0) throw new Error('Ticket not found or already checked out');
          results.successful++;

        } else if (op.type === 'PAYMENT') {
          const { ticket_number, payment_method, amount_received, change_given } = op.data;

          if (!ticket_number) {
            throw new Error('PAYMENT operation requires ticket_number');
          }

          if (payment_method && !Object.values(PaymentMethod).includes(payment_method as PaymentMethod)) {
            throw new Error('Invalid payment_method value');
          }

          const result = await Ticket.updateOne(
            { ticket_number, tenant_id: tenantId, status: TicketStatus.PENDING_PAYMENT },
            {
              $set: {
                status: TicketStatus.PAID,
                payment_method: payment_method || PaymentMethod.CASH,
                amount_received: amount_received || 0,
                change_given: change_given || 0
              }
            }
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

    res.status(200).json({
      success: true,
      message: 'Batch sync completed',
      results
    });
  } catch (err) {
    next(err);
  }
};
