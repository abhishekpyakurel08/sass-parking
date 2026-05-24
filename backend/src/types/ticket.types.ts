import { Types } from 'mongoose';
import { VehicleType, TicketStatus } from './enums.js';

export interface ITicket {
  tenant_id: Types.ObjectId;
  space_id: Types.ObjectId;
  ticket_number: string;
  license_plate: string;
  vehicle_type: VehicleType;
  check_in_time: Date;
  check_out_time?: Date;
  fare_amount: number;
  status: TicketStatus;
}
