import { z } from 'zod';
import { PaymentMethod } from '../types/enums.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  slug: z.string().optional(),
  corporate_email: z.string().email('Invalid corporate email'),
  total_capacity: z.number().int().positive('Capacity must be a positive integer').default(100),
  owner_name: z.string().min(2, 'Owner name is required'),
  owner_email: z.string().email('Invalid owner email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export const createTenantSchema = z.object({
  name: z.string().min(2),
  corporate_email: z.string().email(),
  total_capacity: z.number().int().positive().default(100),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  total_capacity: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});

export const checkInSchema = z.object({
  license_plate: z.string().min(2).max(20, 'License plate too long').optional(),
  vehicle_type: z.enum(['CAR', 'BIKE', 'TRUCK', 'SUV', 'BUS']),
  customer_code: z.string().min(1, 'Customer code is required').max(50, 'Customer code too long').optional(),
  notes: z.string().max(255).optional(),
});

export const checkOutSchema = z.object({
  ticket_id: z.string().min(1, 'ticket_id is required'),
});

export const lostTicketSchema = z.object({
  vehicle_type: z.enum(['CAR', 'BIKE', 'TRUCK', 'SUV', 'BUS']),
  license_plate: z.string().min(2).max(20, 'License plate too long'),
  assumed_duration_hours: z.number().int().positive('Assumed duration must be a positive integer'),
});

export const processPaymentSchema = z.object({
  ticket_id: z.string().min(1, 'Ticket ID is required'),
  payment_method: z.nativeEnum(PaymentMethod),
  amount_received: z.number().nonnegative('Amount received must be non-negative').optional(),
  transaction_reference: z.string().min(1, 'Transaction reference is required').optional(),
}).superRefine((data, ctx) => {
  if (data.payment_method === PaymentMethod.CASH && data.amount_received === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Amount received is required for cash payments',
      path: ['amount_received'],
    });
  }
  if (data.payment_method !== PaymentMethod.CASH && data.transaction_reference === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Transaction reference is required for digital payments',
      path: ['transaction_reference'],
    });
  }
});

export const createRateSchema = z.object({
  vehicle_type: z.enum(['CAR', 'BIKE', 'TRUCK', 'SUV', 'BUS']),
  rate_per_hour: z.number().positive('Rate must be a positive number'),
  lost_ticket_penalty: z.number().min(0).default(0).optional(),
  grace_period_minutes: z.number().int().min(0).default(0).optional(),
});

export const updateRateSchema = z.object({
  rate_per_hour: z.number().positive('Rate must be a positive number').optional(),
  lost_ticket_penalty: z.number().min(0).optional(),
  grace_period_minutes: z.number().int().min(0).optional(),
});

export const createStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  gate_assignment: z.enum(['ENTRY', 'EXIT', 'BOTH']).optional(),
  ticket_prefix: z.string().optional(),
});

export const scanSchema = z.object({
  code: z.string().min(1, 'Scan code (barcode UUID or license plate) is required'),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  customer_code: z.string().min(1, 'Customer code is required').max(50, 'Customer code too long'),
  email: z.string().email('Invalid email address').optional(),
  phone_number: z.string().min(7).max(20).optional(),
  discount_percentage: z.number().min(0).max(100).default(0).optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone_number: z.string().min(7).max(20).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED']).optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
});

export const regenerateCustomerQrSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
});
