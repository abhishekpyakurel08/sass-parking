import { Schema, model, Types } from 'mongoose';
import { ICustomer } from '../types/customer.types.js';
import { CustomerStatus } from '../types/enums.js';

const CustomerSchema = new Schema<ICustomer>(
  {
    tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    customer_code: { type: String, required: true, unique: true, trim: true }, 
    email: { type: String, trim: true, sparse: true, lowercase: true },
    phone_number: { type: String, trim: true, sparse: true },
    status: { type: String, enum: Object.values(CustomerStatus), default: CustomerStatus.ACTIVE },
    discount_percentage: { type: Number, default: 0, min: 0, max: 100 },
    qr_data: { type: String, unique: true, sparse: true }, 
  },
  { timestamps: true }
);

CustomerSchema.index({ tenant_id: 1, customer_code: 1 }, { unique: true });
CustomerSchema.index({ tenant_id: 1, email: 1 }, { unique: true, sparse: true });
CustomerSchema.index({ tenant_id: 1, phone_number: 1 }, { unique: true, sparse: true });

export const Customer = model<ICustomer>('Customer', CustomerSchema);
