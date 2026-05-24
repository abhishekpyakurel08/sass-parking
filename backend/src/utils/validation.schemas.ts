import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
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

// ── Tenants ───────────────────────────────────────────────────────────────────
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

// ── Parking Spaces ────────────────────────────────────────────────────────────
export const createSpaceSchema = z.object({
  floor_level: z.string().min(1, 'Floor level is required'),
  space_number: z.string().min(1, 'Space number is required'),
  vehicle_type: z.enum(['CAR', 'BIKE', 'TRUCK']),
});

export const updateSpaceSchema = z.object({
  status: z.enum(['FREE', 'OCCUPIED', 'RESERVED']).optional(),
  vehicle_type: z.enum(['CAR', 'BIKE', 'TRUCK']).optional(),
});

// ── Check-in / Check-out ──────────────────────────────────────────────────────
export const checkInSchema = z.object({
  space_id: z.string().min(1, 'space_id is required'),
  license_plate: z.string().min(2).max(20, 'License plate too long'),
  vehicle_type: z.enum(['CAR', 'BIKE', 'TRUCK']),
});

export const checkOutSchema = z.object({
  ticket_id: z.string().min(1, 'ticket_id is required'),
});

// ── Rates ─────────────────────────────────────────────────────────────────────
export const createRateSchema = z.object({
  vehicle_type: z.enum(['CAR', 'BIKE', 'TRUCK']),
  rate_per_hour: z.number().positive('Rate must be a positive number'),
});

export const updateRateSchema = z.object({
  rate_per_hour: z.number().positive('Rate must be a positive number'),
});

// ── Staff creation ────────────────────────────────────────────────────────────
export const createStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

// ── Scan ──────────────────────────────────────────────────────────────────────
export const scanSchema = z.object({
  code: z.string().min(1, 'Scan code (barcode UUID or license plate) is required'),
});

