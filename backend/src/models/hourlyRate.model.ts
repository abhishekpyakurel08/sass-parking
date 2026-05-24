import { Schema, model } from 'mongoose';
import { IHourlyRate } from '../types/hourlyRate.types.js';
import { VehicleType } from '../types/enums.js';

const HourlyRateSchema = new Schema<IHourlyRate>(
  {
    tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    vehicle_type: { type: String, enum: Object.values(VehicleType), required: true },
    rate_per_hour: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

HourlyRateSchema.index({ tenant_id: 1, vehicle_type: 1 }, { unique: true });

export const HourlyRate = model<IHourlyRate>('HourlyRate', HourlyRateSchema);
