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
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    customDomain?: string;
    senderEmail?: string;
    senderName?: string;
  };
  emailTemplates?: {
    welcome?: {
      subject?: string;
      title?: string;
      message?: string;
      buttonText?: string;
    };
    verification?: {
      subject?: string;
      title?: string;
      message?: string;
      buttonText?: string;
    };
    passwordReset?: {
      subject?: string;
      title?: string;
      message?: string;
      buttonText?: string;
    };
  };
  createdAt?: Date;
  updatedAt?: Date;
}