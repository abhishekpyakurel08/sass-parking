import { Schema, model, type Document, Types } from 'mongoose';
import type { IParkingTicket } from '../types/parkingTicket.types.js';
import { VehicleType } from '../types/enums.js';

export interface IParkingTicketDocument extends IParkingTicket, Document {
  tenantId: Types.ObjectId;
  gateStaffIn: Types.ObjectId;
  gateStaffOut?: Types.ObjectId;
}

const ParkingTicketSchema = new Schema<IParkingTicket>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  ticketNumber: { type: String, unique: true, sparse: true },
  vehiclePlateNumber: { type: String, required: true, index: true },
  vehicleType: { type: String, enum: Object.values(VehicleType), required: true },
  checkInTime: { type: Date, required: true, default: Date.now },
  checkOutTime: { type: Date },
  totalCost: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
  gateStaffIn: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  gateStaffOut: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

ParkingTicketSchema.index({ tenantId: 1, vehiclePlateNumber: 1, paymentStatus: 1 });

export const ParkingTicket = model('ParkingTicket', ParkingTicketSchema);
