import { Types } from 'mongoose';
import { TenantStatus } from './enums.js';

export interface ITenant {
  name: string;
  corporate_email: string;
  total_capacity: number;
  status: TenantStatus;
  contactNumber?: string;
  address?: string;
  ownerName?: string;
  subscriptionPlan?: string;
  createdAt?: Date;
  updatedAt?: Date;
}