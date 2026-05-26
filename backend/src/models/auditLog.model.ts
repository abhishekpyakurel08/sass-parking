import { Schema, model, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  details: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String, default: '0.0.0.0' }
}, { timestamps: true });

// Logs automatically expire after 90 days to save database space
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
