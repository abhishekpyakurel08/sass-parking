import { Schema, model } from 'mongoose';
import { IParkingSpace } from '../types/parkingSpace.types.js';
import { VehicleType, SpaceStatus } from '../types/enums.js';

const ParkingSpaceSchema = new Schema<IParkingSpace>(
  {
    tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    floor_level: { type: String, required: true, trim: true },
    space_number: { type: String, required: true, trim: true },
    vehicle_type: { type: String, enum: Object.values(VehicleType), required: true },
    status: { type: String, enum: Object.values(SpaceStatus), default: SpaceStatus.FREE },
  },
  { timestamps: true }
);

ParkingSpaceSchema.index({ tenant_id: 1, space_number: 1 }, { unique: true });
ParkingSpaceSchema.index({ tenant_id: 1, status: 1 });
ParkingSpaceSchema.index({ tenant_id: 1, vehicle_type: 1, status: 1 });

export const ParkingSpace = model<IParkingSpace>('ParkingSpace', ParkingSpaceSchema);
