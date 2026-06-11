import { api } from './api';

export interface BrandingSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  customDomain?: string;
  senderEmail?: string;
  senderName?: string;
}

export interface EmailTemplate {
  subject?: string;
  title?: string;
  message?: string;
  buttonText?: string;
}

export interface EmailTemplates {
  welcome?: EmailTemplate;
  verification?: EmailTemplate;
  passwordReset?: EmailTemplate;
}

export interface BrandingData {
  branding?: BrandingSettings;
  emailTemplates?: EmailTemplates;
}

export const brandingService = {
  async getBranding(tenantSlug?: string): Promise<BrandingData> {
    const savedSlug = typeof window !== 'undefined' ? window._prevTenantSlug : undefined;
    if (tenantSlug) api.setTenantSlug(tenantSlug);
    try {
      const response = await api.get('/branding');
      return response.data as BrandingData;
    } finally {
      // restore previous slug if we overrode it
      if (tenantSlug && savedSlug) api.setTenantSlug(savedSlug);
    }
  },

  async updateBranding(data: BrandingSettings, tenantSlug?: string): Promise<BrandingSettings> {
    if (tenantSlug) api.setTenantSlug(tenantSlug);
    const response = await api.put('/branding', data);
    return response.data as BrandingSettings;
  },

  async updateEmailTemplate(templateType: string, data: EmailTemplate, tenantSlug?: string): Promise<EmailTemplates> {
    if (tenantSlug) api.setTenantSlug(tenantSlug);
    const response = await api.put(`/branding/templates/${templateType}`, data);
    return response.data as EmailTemplates;
  },

  async previewEmailTemplate(templateType: string, data: { userName: string; url: string }, tenantSlug?: string): Promise<{ subject: string; html: string }> {
    if (tenantSlug) api.setTenantSlug(tenantSlug);
    const response = await api.post(`/branding/templates/${templateType}/preview`, data);
    return response.data as { subject: string; html: string };
  },

  async resetEmailTemplate(templateType: string, tenantSlug?: string): Promise<EmailTemplates> {
    if (tenantSlug) api.setTenantSlug(tenantSlug);
    const response = await api.delete(`/branding/templates/${templateType}`);
    return response.data as EmailTemplates;
  },
};

// extend window type
declare global {
  interface Window {
    _prevTenantSlug?: string;
  }
}

