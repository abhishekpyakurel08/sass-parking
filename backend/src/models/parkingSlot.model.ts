import { Schema, model, type Document, Types } from 'mongoose';
import type { IParkingSlot } from '../types/parkingSlot.types.js';

export interface IParkingSlotDocument extends IParkingSlot, Document {
  tenantId: Types.ObjectId;
}

const ParkingSlotSchema = new Schema<IParkingSlot>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  slotNumber: { type: String, required: true },
  floor: { type: String, required: true },
  vehicleType: { type: String, enum: ['BIKE', 'CAR', 'TRUCK'], required: true },
  status: { type: String, enum: ['FREE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'], default: 'FREE' },
}, { timestamps: true });

ParkingSlotSchema.index({ tenantId: 1, slotNumber: 1 }, { unique: true });

export const ParkingSlot = model('ParkingSlot', ParkingSlotSchema);
