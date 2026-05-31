import { Schema, model, Document, Types } from 'mongoose';
import crypto from 'crypto';

export interface IApiKey extends Document {
  tenantId: Types.ObjectId;
  userId?: Types.ObjectId;
  name: string;
  keyHash: string;
  prefix: string;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<IApiKey>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  userId:   { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
  name: { type: String, required: true },
  keyHash: { type: String, required: true },
  prefix: { type: String, required: true },
  lastUsedAt: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const ApiKey = model<IApiKey>('ApiKey', apiKeySchema);

export const generateApiKeyValues = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const prefix = token.substring(0, 8);
  const keyHash = crypto.createHash('sha256').update(token).digest('hex');
  return { rawKey: `pk_${token}`, prefix, keyHash };
};

export const hashApiKeyString = (token: string) => {
  const rawToken = token.startsWith('pk_') ? token.substring(3) : token;
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};
