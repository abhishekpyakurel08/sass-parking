import { z } from 'zod'

// Vehicle types enum
export const VehicleType = z.enum(['CAR', 'BIKE', 'TRUCK', 'SUV', 'BUS'])
export type VehicleType = z.infer<typeof VehicleType>

// Payment methods enum
export const PaymentMethod = z.enum(['CASH', 'CARD', 'ESEWA', 'KHALTI', 'IMEPAY', 'CONNECTIPS'])
export type PaymentMethod = z.infer<typeof PaymentMethod>

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  slug: z.string().optional(),
  corporate_email: z.string().email('Invalid corporate email').optional(),
  owner_name: z.string().min(2, 'Owner name is required'),
  owner_email: z.string().email('Invalid owner email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Tenant schemas
export const createTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  corporate_email: z.string().email('Invalid email address'),
})

export const updateTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
})

// Parking/Check-in schemas
export const checkInSchema = z.object({
  license_plate: z.string().min(2, 'License plate must be at least 2 characters').max(20, 'License plate too long').optional(),
  vehicle_type: VehicleType,
  customer_code: z.string().min(1, 'Customer code is required').max(50, 'Customer code too long').optional(),
  notes: z.string().max(255, 'Notes too long').optional(),
})

export const checkOutSchema = z.object({
  ticket_id: z.string().min(1, 'Ticket ID is required'),
})

export const lostTicketSchema = z.object({
  vehicle_type: VehicleType,
  license_plate: z.string().min(2, 'License plate must be at least 2 characters').max(20, 'License plate too long'),
  assumed_duration_hours: z.number().int().positive('Assumed duration must be a positive integer'),
})

export const processPaymentSchema = z.object({
  ticket_id: z.string().min(1, 'Ticket ID is required'),
  payment_method: PaymentMethod,
  amount_received: z.number().nonnegative('Amount received must be non-negative').optional(),
  transaction_reference: z.string().min(1, 'Transaction reference is required').optional(),
}).superRefine((data, ctx) => {
  if (data.payment_method === 'CASH' && data.amount_received === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Amount received is required for cash payments',
      path: ['amount_received'],
    })
  }
  if (data.payment_method !== 'CASH' && data.transaction_reference === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Transaction reference is required for digital payments',
      path: ['transaction_reference'],
    })
  }
})

export const scanSchema = z.object({
  code: z.string().min(1, 'Scan code (barcode UUID or license plate) is required'),
})

// Rate schemas
export const createRateSchema = z.object({
  vehicle_type: VehicleType,
  rate_per_hour: z.number().positive('Rate must be a positive number'),
  lost_ticket_penalty: z.number().min(0).default(0).optional(),
  grace_period_minutes: z.number().int().min(0).default(0).optional(),
})

export const updateRateSchema = z.object({
  rate_per_hour: z.number().positive('Rate must be a positive number').optional(),
  lost_ticket_penalty: z.number().min(0).optional(),
  grace_period_minutes: z.number().int().min(0).optional(),
})

// Staff schemas
export const createStaffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  gate_assignment: z.enum(['ENTRY', 'EXIT', 'BOTH']).optional(),
  ticket_prefix: z.string().optional(),
})

// Customer schemas
export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  customer_code: z.string().min(1, 'Customer code is required').max(50, 'Customer code too long'),
  email: z.string().email('Invalid email address').optional(),
  phone_number: z.string().min(7, 'Phone number too short').max(20, 'Phone number too long').optional(),
  discount_percentage: z.number().min(0, 'Discount must be at least 0').max(100, 'Discount must be at most 100').default(0).optional(),
})

export const updateCustomerSchema = z.object({
  name: z.string().min(2, 'Customer name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone_number: z.string().min(7, 'Phone number too short').max(20, 'Phone number too long').optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'EXPIRED']).optional(),
  discount_percentage: z.number().min(0, 'Discount must be at least 0').max(100, 'Discount must be at most 100').optional(),
})

export const regenerateCustomerQrSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID is required'),
})

// Branding schemas
export const brandingSchema = z.object({
  logoUrl: z.string().url('Invalid URL').optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  customDomain: z.string().url('Invalid URL').optional(),
  senderEmail: z.string().email('Invalid email address').optional(),
  senderName: z.string().min(2, 'Sender name must be at least 2 characters').optional(),
  tagline: z.string().max(100, 'Tagline too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  contactPhone: z.string().optional(),
  contactAddress: z.string().max(200, 'Address too long').optional(),
})
