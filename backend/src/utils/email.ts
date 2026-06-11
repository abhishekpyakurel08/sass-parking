import { Resend } from 'resend';
import { env } from '../config/env.js';
import { Tenant } from '../models/tenant.model.js';
import {
  getVerificationEmailTemplate,
  getWelcomeEmailTemplate,
  getPasswordResetEmailTemplate,
  getOnboardingEmailTemplate,
  type EmailBranding,
} from './emailTemplates.js';

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Get tenant branding for email customization
 */
async function getTenantBranding(tenantId: string): Promise<EmailBranding> {
  try {
    const tenant = await Tenant.findById(tenantId);
    if (!tenant || !tenant.branding) {
      return {
        companyName: 'ParkSaaS',
        senderName: 'ParkSaaS Team',
      };
    }

    return {
      logoUrl: tenant.branding.logoUrl,
      primaryColor: tenant.branding.primaryColor,
      secondaryColor: tenant.branding.secondaryColor,
      accentColor: tenant.branding.accentColor,
      companyName: tenant.name,
      senderName: tenant.branding.senderName || `${tenant.name} Team`,
    };
  } catch (error) {
    console.error('Failed to get tenant branding:', error);
    return {
      companyName: 'ParkSaaS',
      senderName: 'ParkSaaS Team',
    };
  }
}

/**
 * Send verification email with tenant branding
 */
export const sendVerificationEmail = async (
  email: string,
  token: string,
  tenantId?: string,
  userName?: string
): Promise<void> => {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  // In development, skip Resend (free tier blocks unverified recipients)
  // and print the link to the console so it can be used directly.
  if (!env.isProd) {
    console.log('\n' + '='.repeat(70));
    console.log('📧  DEV EMAIL — Email Verification');
    console.log('='.repeat(70));
    console.log(`  To      : ${email}`);
    console.log(`  User    : ${userName || 'User'}`);
    console.log(`  Link    : ${verificationUrl}`);
    console.log('='.repeat(70) + '\n');
    return;
  }

  const branding = tenantId ? await getTenantBranding(tenantId) : {};

  try {
    const template = getVerificationEmailTemplate(
      userName || 'User',
      branding.companyName || 'ParkSaaS',
      verificationUrl,
      branding
    );

    const fromEmail = branding.senderEmail 
      ? `${branding.senderName || branding.companyName} <${branding.senderEmail}>`
      : 'ParkSaaS <onboarding@resend.dev>';

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};

/**
 * Send onboarding email with tenant branding
 */
export const sendOnboardingEmail = async (
  email: string,
  tenantName: string,
  ownerName: string,
  tenantId?: string
): Promise<void> => {
  let dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

  if (tenantId) {
    try {
      const tenant = await Tenant.findById(tenantId).lean();
      if (tenant && tenant.slug) {
        const url = new URL(env.FRONTEND_URL);
        if (url.hostname === 'localhost') {
          url.hostname = `${tenant.slug}.localhost`;
        } else {
          url.hostname = `${tenant.slug}.${url.hostname}`;
        }
        dashboardUrl = `${url.origin}/dashboard`;
      }
    } catch (err) {
      console.error('Failed to construct custom subdomain URL for onboarding email:', err);
    }
  }

  // In development, skip Resend and log to console instead.
  if (!env.isProd) {
    console.log('\n' + '='.repeat(70));
    console.log('📧  DEV EMAIL — Onboarding Welcome');
    console.log('='.repeat(70));
    console.log(`  To          : ${email}`);
    console.log(`  Owner       : ${ownerName}`);
    console.log(`  Tenant      : ${tenantName}`);
    console.log(`  Dashboard   : ${dashboardUrl}`);
    console.log('='.repeat(70) + '\n');
    return;
  }

  const branding = tenantId ? await getTenantBranding(tenantId) : {};

  try {
    const template = getOnboardingEmailTemplate(
      ownerName,
      tenantName,
      dashboardUrl,
      branding
    );

    const fromEmail = branding.senderEmail 
      ? `${branding.senderName || branding.companyName} <${branding.senderEmail}>`
      : 'ParkSaaS <onboarding@resend.dev>';

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error('Failed to send onboarding email:', error);
    throw error;
  }
};

/**
 * Send password reset email with tenant branding
 */
export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  tenantId?: string,
  userName?: string
): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  // In development, skip Resend and log to console instead.
  if (!env.isProd) {
    console.log('\n' + '='.repeat(70));
    console.log('📧  DEV EMAIL — Password Reset');
    console.log('='.repeat(70));
    console.log(`  To      : ${email}`);
    console.log(`  User    : ${userName || 'User'}`);
    console.log(`  Link    : ${resetUrl}`);
    console.log('='.repeat(70) + '\n');
    return;
  }

  const branding = tenantId ? await getTenantBranding(tenantId) : {};

  try {
    const template = getPasswordResetEmailTemplate(
      userName || 'User',
      branding.companyName || 'ParkSaaS',
      resetUrl,
      branding
    );

    const fromEmail = branding.senderEmail 
      ? `${branding.senderName || branding.companyName} <${branding.senderEmail}>`
      : 'ParkSaaS <onboarding@resend.dev>';

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

/**
 * Send welcome email with tenant branding
 */
export const sendWelcomeEmail = async (
  email: string,
  userName: string,
  tenantId: string,
  verifyUrl: string
): Promise<void> => {
  const branding = await getTenantBranding(tenantId);

  try {
    const template = getWelcomeEmailTemplate(
      userName,
      branding.companyName || 'ParkSaaS',
      verifyUrl,
      branding
    );

    const fromEmail = branding.senderEmail 
      ? `${branding.senderName || branding.companyName} <${branding.senderEmail}>`
      : 'ParkSaaS <onboarding@resend.dev>';

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};
