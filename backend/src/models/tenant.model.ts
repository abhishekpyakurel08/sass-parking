import { Schema, model } from 'mongoose';
import { ITenant } from '../types/tenant.types.js';
import { TenantStatus } from '../types/enums.js';

const TenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true, default: '' },
    corporate_email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: Object.values(TenantStatus),
      default: TenantStatus.ACTIVE,
    },
    contactNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    ownerName: { type: String, trim: true },
    // Branding fields for tenant-specific emails and UI
    branding: {
      logoUrl: { type: String, trim: true },
      primaryColor: { type: String, default: '#2563eb' },
      secondaryColor: { type: String, default: '#1e40af' },
      accentColor: { type: String, default: '#3b82f6' },
      customDomain: { type: String, trim: true },
      senderEmail: { type: String, trim: true },
      senderName: { type: String, trim: true },
    },
    // Email templates (tenant-specific overrides)
    emailTemplates: {
      welcome: {
        subject: { type: String, default: 'Welcome to {companyName}' },
        title: { type: String, default: 'Welcome to {companyName}' },
        message: { type: String, default: 'Thank you for joining our platform.' },
        buttonText: { type: String, default: 'Get Started' },
      },
      verification: {
        subject: { type: String, default: 'Verify your email' },
        title: { type: String, default: 'Verify your email address' },
        message: { type: String, default: 'Please verify your email address to continue.' },
        buttonText: { type: String, default: 'Verify Email' },
      },
      passwordReset: {
        subject: { type: String, default: 'Reset your password' },
        title: { type: String, default: 'Reset your password' },
        message: { type: String, default: 'Click the button below to reset your password.' },
        buttonText: { type: String, default: 'Reset Password' },
      },
    },
  },
  { timestamps: true }
);

TenantSchema.index({ status: 1 });

export const Tenant = model<ITenant>('Tenant', TenantSchema);