import { Schema, model } from 'mongoose';
import { ITenant } from '../types/tenant.types.js';
import { TenantStatus } from '../types/enums.js';

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    corporate_email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    total_capacity: { type: Number, required: true, min: 1, default: 100 },
    status: {
      type: String,
      enum: Object.values(TenantStatus),
      default: TenantStatus.ACTIVE,
    },
    contactNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    ownerName: { type: String, trim: true },
  },
  { timestamps: true }
);

TenantSchema.index({ status: 1 });

export const Tenant = model<ITenant>('Tenant', TenantSchema);