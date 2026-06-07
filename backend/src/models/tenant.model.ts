import { Schema, model } from 'mongoose';
import { ITenant } from '../types/tenant.types.js';
import { TenantStatus } from '../types/enums.js';

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true, default: '' },
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
TenantSchema.index({ slug: 1 }, { unique: true });

export const Tenant = model<ITenant>('Tenant', TenantSchema);