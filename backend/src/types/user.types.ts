import { Types } from 'mongoose';
import { UserRole, GateAssignment } from './enums.js';

export interface IUser {
  tenant_id: Types.ObjectId | null;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  gate_assignment?: GateAssignment;
  ticket_prefix?: string;
  refresh_token?: string | null;
  is_email_verified?: boolean;
  email_verification_token?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}