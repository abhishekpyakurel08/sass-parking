import { Types } from 'mongoose';
import { TicketStatus, VehicleType, PaymentMethod } from './enums.js';

export interface ITicket {
  tenant_id: Types.ObjectId;
  customer_id?: Types.ObjectId; // Optional: Link to a regular customer
  ticket_number: string; // UUID generated at check-in or lost ticket
  license_plate: string;
  vehicle_type: VehicleType;
  check_in_time: Date;
  check_out_time?: Date; // Only set after checkout
  fare_amount: number; // Calculated at checkout
  penalty_amount: number; // For lost tickets, default 0
  discount_amount: number; // Applied for regular customers, default 0
  status: TicketStatus;
  payment_method?: PaymentMethod;
  amount_received?: number; // For cash payments
  change_given?: number; // For cash payments
  transaction_reference?: string; // For digital payments
  notes?: string; // Optional notes from operator at entry
  createdAt: Date;
  updatedAt: Date;
}
