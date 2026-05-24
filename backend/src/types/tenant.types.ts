import { Types } from 'mongoose';
import { TenantStatus } from './enums.js';

export interface ITenant {
  name: string;
  corporate_email: string;
  total_capacity: number;
  status: TenantStatus;
  createdAt?: Date;
  updatedAt?: Date;
}