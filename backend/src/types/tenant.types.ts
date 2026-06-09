import { Types } from 'mongoose';
import { TenantStatus } from './enums.js';

export interface ITenant {
  name: string;
  slug: string;
  corporate_email: string;
  status: TenantStatus;
  contactNumber?: string;
  address?: string;
  ownerName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}