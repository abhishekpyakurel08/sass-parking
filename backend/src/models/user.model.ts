import { Schema, model } from 'mongoose';
import { IUser } from '../types/user.types.js';
import { UserRole, GateAssignment } from '../types/enums.js';

const UserSchema = new Schema<IUser>(
  {
    tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    gate_assignment: { type: String, enum: Object.values(GateAssignment), default: GateAssignment.BOTH },
    ticket_prefix: { type: String, default: '' },
    refresh_token: { type: String, default: null },
    is_email_verified: { type: Boolean, default: false },
    email_verification_token: { type: String, default: null },
    password_reset_token: { type: String, default: null },
    password_reset_expires: { type: Date, default: null },
    // TODO: Add more fields if needed
  },
  { timestamps: true }
);

UserSchema.index({ tenant_id: 1, role: 1 });

export const User = model<IUser>('User', UserSchema);