import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: 'ParkSaaS <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Verify your email address</h2>
          <p style="color: #666;">Thank you for signing up for ParkSaaS. Please click the button below to verify your email address:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Verify Email</a>
          <p style="color: #666;">Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #999; font-size: 12px;">This link will expire in 24 hours.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};

export const sendOnboardingEmail = async (email: string, tenantName: string, ownerName: string): Promise<void> => {
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

  try {
    await resend.emails.send({
      from: 'ParkSaaS <onboarding@resend.dev>',
      to: email,
      subject: `Welcome to ParkSaaS - ${tenantName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to ParkSaaS!</h2>
          <p style="color: #666;">Hi ${ownerName},</p>
          <p style="color: #666;">Your parking management system <strong>${tenantName}</strong> has been successfully set up.</p>
          <p style="color: #666;">You can now start managing your parking operations efficiently.</p>
          <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Go to Dashboard</a>
          <p style="color: #666;">If you have any questions, feel free to reach out to our support team.</p>
          <p style="color: #999; font-size: 12px;">Best regards,<br>The ParkSaaS Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send onboarding email:', error);
    throw error;
  }
};
