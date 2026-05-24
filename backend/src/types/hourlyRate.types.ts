import { Types } from 'mongoose';
import { VehicleType } from './enums.js';

export interface IHourlyRate {
  tenant_id: Types.ObjectId;
  vehicle_type: VehicleType;
  rate_per_hour: number;
}
