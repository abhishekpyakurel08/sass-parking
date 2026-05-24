import { Schema, model } from 'mongoose';
import { ITicket } from '../types/ticket.types.js';
import { VehicleType, TicketStatus } from '../types/enums.js';

const TicketSchema = new Schema<ITicket>(
  {
    tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    space_id: { type: Schema.Types.ObjectId, ref: 'ParkingSpace', required: true },
    ticket_number: { type: String, required: true, unique: true, index: true },
    license_plate: { type: String, required: true, uppercase: true, trim: true },
    vehicle_type: { type: String, enum: Object.values(VehicleType), required: true },
    check_in_time: { type: Date, required: true, default: Date.now },
    check_out_time: { type: Date, default: null },
    fare_amount: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(TicketStatus), default: TicketStatus.ACTIVE },
  },
  { timestamps: true }
);

TicketSchema.index({ tenant_id: 1, license_plate: 1, status: 1 });
TicketSchema.index({ tenant_id: 1, ticket_number: 1 });
TicketSchema.index({ tenant_id: 1, status: 1, check_out_time: 1 });

export const Ticket = model<ITicket>('Ticket', TicketSchema);
