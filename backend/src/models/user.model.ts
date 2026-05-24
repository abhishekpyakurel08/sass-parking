import { Schema, model } from 'mongoose';
import { IUser } from '../types/user.types.js';
import { UserRole } from '../types/enums.js';

const UserSchema = new Schema<IUser>(
  {
    tenant_id: { type: Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    refresh_token: { type: String, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });
UserSchema.index({ tenant_id: 1, role: 1 });

export const User = model<IUser>('User', UserSchema);