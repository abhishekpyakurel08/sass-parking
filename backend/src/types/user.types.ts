import { Types } from 'mongoose';
import { UserRole } from './enums.js';

export interface IUser {
  tenant_id: Types.ObjectId | null;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  refresh_token?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}