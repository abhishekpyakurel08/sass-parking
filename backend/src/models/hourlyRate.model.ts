import { Schema, model, Types } from 'mongoose';
import { VehicleType } from '../types/enums.js';

export interface IHourlyRate {
  tenant_id: Types.ObjectId;
  vehicle_type: VehicleType;
  rate_per_hour: number;
  lost_ticket_penalty: number;
  grace_period_minutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const HourlyRateSchema = new Schema<IHourlyRate>(
  {
    tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    vehicle_type: { type: String, enum: Object.values(VehicleType), required: true, unique: false },
    rate_per_hour: { type: Number, required: true, min: 0 },
    lost_ticket_penalty: { type: Number, required: true, min: 0, default: 0 },
    grace_period_minutes: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

HourlyRateSchema.index({ tenant_id: 1, vehicle_type: 1 }, { unique: true });

export const HourlyRate = model<IHourlyRate>('HourlyRate', HourlyRateSchema);
