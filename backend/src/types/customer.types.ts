import { Types } from 'mongoose';
import { CustomerStatus } from './enums.js';

export interface ICustomer {
  tenant_id: Types.ObjectId;
  name: string;
  customer_code: string; // Unique identifier for the customer, could be NFC ID or system-generated
  email?: string;
  phone_number?: string;
  status: CustomerStatus;
  discount_percentage: number; // e.g., 10 for 10% discount
  qr_data?: string; // Stores the raw data to be encoded in a QR for customer identification
  visit_history?: Types.ObjectId[]; // References to parking tickets, if tracking detailed history
  total_savings?: number; // Accumulated savings from discounts
  createdAt: Date;
  updatedAt: Date;
}
