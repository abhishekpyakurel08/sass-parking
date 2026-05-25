import { Schema, model } from 'mongoose';
import { ITicket } from '../types/ticket.types.js';
import { VehicleType, TicketStatus, PaymentMethod } from '../types/enums.js';

const TicketSchema = new Schema<ITicket>(
  {
    tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    customer_id: { type: Schema.Types.ObjectId, ref: 'Customer', index: true, sparse: true },
    ticket_number: { type: String, required: true, unique: true, index: true },
    license_plate: { type: String, required: true, uppercase: true, trim: true },
    vehicle_type: { type: String, enum: Object.values(VehicleType), required: true },
    check_in_time: { type: Date, required: true, default: Date.now },
    check_out_time: { type: Date, default: null },
    fare_amount: { type: Number, default: 0 },
    penalty_amount: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(TicketStatus), default: TicketStatus.ACTIVE },
    payment_method: { type: String, enum: Object.values(PaymentMethod), sparse: true },
    amount_received: { type: Number, sparse: true },
    change_given: { type: Number, sparse: true },
    transaction_reference: { type: String, sparse: true },
    notes: { type: String, trim: true, maxlength: 255 },
  },
  { timestamps: true }
);

TicketSchema.index({ tenant_id: 1, license_plate: 1, status: 1 });
TicketSchema.index({ tenant_id: 1, ticket_number: 1 });
TicketSchema.index({ tenant_id: 1, status: 1, check_out_time: 1 });
TicketSchema.index({ tenant_id: 1, customer_id: 1 });

export const Ticket = model<ITicket>('Ticket', TicketSchema);
