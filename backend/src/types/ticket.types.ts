import { Types } from 'mongoose';
import { TicketStatus, VehicleType, PaymentMethod } from './enums.js';

export interface ITicket {
  tenant_id: Types.ObjectId;
  customer_id?: Types.ObjectId;
  ticket_number: string;
  license_plate: string;
  vehicle_type: VehicleType;
  check_in_time: Date;
  check_out_time?: Date;
  fare_amount: number;
  penalty_amount: number;
  discount_amount: number;
  status: TicketStatus;
  payment_method?: PaymentMethod;
  amount_received?: number;
  change_given?: number;
  transaction_reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
