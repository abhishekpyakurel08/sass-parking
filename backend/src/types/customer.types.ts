import { Types } from 'mongoose';
import { CustomerStatus } from './enums.js';

export interface ICustomer {
  tenant_id: Types.ObjectId;
  name: string;
  customer_code: string;
  email?: string;
  phone_number?: string;
  status: CustomerStatus;
  discount_percentage: number;
  qr_data?: string;
  visit_history?: Types.ObjectId[];
  total_savings?: number;
  createdAt: Date;
  updatedAt: Date;
}
