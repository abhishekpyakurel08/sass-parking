import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Tenant } from '../models/tenant.model.js';
import { User } from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { TenantStatus, UserRole } from '../types/enums.js';
import { sendVerificationEmail, sendOnboardingEmail } from '../utils/email.js';

const COOKIE_NAME = 'park_session';

export const registerTenantOwner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, slug, owner_name, owner_email, password, corporate_email } = req.body;
    const ownerEmail = owner_email;
    const tenantEmail = corporate_email || owner_email;
    
    // Generate slug from name if not provided
    let tenantSlug = slug;
    if (!tenantSlug && name) {
      tenantSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    
    // Ensure slug is not empty
    if (!tenantSlug) {
      tenantSlug = `tenant-${Date.now()}`;
    }

    const existingTenant = await Tenant.findOne({ slug: tenantSlug });
    console.log("tenantSlug check:", tenantSlug, "existing:", existingTenant !== null);
    if (existingTenant) {
      res.status(400).json({ success: false, message: 'A tenant with this slug already exists.' });
      return;
    }

    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const tenant = await Tenant.create({
      name: name || owner_name,
      slug: tenantSlug,
      corporate_email: tenantEmail,
      status: TenantStatus.ACTIVE,
    });

    const email_verification_token = crypto.randomBytes(32).toString('hex');
    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const owner = await User.create({
      tenant_id: tenant._id,
      name: owner_name,
      email: ownerEmail,
      password_hash,
      role: UserRole.TENANT_OWNER,
      is_email_verified: process.env.NODE_ENV === 'development',
      email_verification_token: process.env.NODE_ENV === 'development' ? null : email_verification_token,
    });

    // Send verification email with tenant branding
    try {
      await sendVerificationEmail(ownerEmail, email_verification_token, tenant._id.toString(), owner_name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Send onboarding email with tenant branding
    try {
      await sendOnboardingEmail(ownerEmail, tenant.name, owner_name, tenant._id.toString());
    } catch (emailError) {
      console.error('Failed to send onboarding email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Tenant onboarded successfully. Please check your email to verify your account.',
      tenant_id: tenant._id,
      slug: tenant.slug,
      owner_id: owner._id,
      requires_email_verification: process.env.NODE_ENV !== 'development',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: message });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (user.tenant_id) {
      const company = await Tenant.findById(user.tenant_id);
      if (company?.status === TenantStatus.SUSPENDED) {
        res.status(403).json({ success: false, message: 'Tenant account is suspended.' });
        return;
      }
    }

    const expiresIn    = rememberMe ? '30d' : '8h';
    const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role, tenantId: user.tenant_id?.toString() ?? null },
      env.JWT_ACCESS_SECRET,
      { expiresIn }
    );

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'strict',
      maxAge: cookieMaxAge,
    });

    // Get tenant slug if user has a tenant
    let tenantSlug = null;
    if (user.tenant_id) {
      const tenant = await Tenant.findById(user.tenant_id);
      tenantSlug = tenant?.slug || null;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, role: user.role, tenant_id: user.tenant_id ?? null, slug: tenantSlug },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, error: message });
  }
};

export const logoutUser = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'strict', secure: env.isProd });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

export const posLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      res.status(400).json({ success: false, message: 'API Key is required.' });
      return;
    }
    res.status(401).json({ success: false, message: 'POS API Key login is deprecated. Use /api/v1/auth/login.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, error: message });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId)
      .select('-password_hash -refresh_token')
      .lean();
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    let slug = null;
    let tenant_name = null;
    let tenant_branding = null;
    if (user.tenant_id) {
      const tenant = await Tenant.findById(user.tenant_id);
      slug = tenant?.slug || null;
      tenant_name = tenant?.name || null;
      tenant_branding = tenant?.branding || null;
    }
    res.status(200).json({ success: true, data: { ...user, slug, tenant_name, tenant_branding } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, error: message });
  }
};

export const resendEmailVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.is_email_verified) {
      res.status(400).json({ success: false, message: 'Email already verified' });
      return;
    }

    const verificationToken = jwt.sign(
      { userId: user._id.toString() },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '24h' }
    );

    user.email_verification_token = verificationToken;
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, error: message });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = (req.query.token as string) || req.body.token;
    if (!token) {
      res.status(400).json({ success: false, message: 'Verification token is required' });
      return;
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(400).json({ success: false, message: 'Verification token has expired' });
        return;
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(400).json({ success: false, message: 'Invalid verification token' });
        return;
      }
      res.status(500).json({ success: false, message: 'Token verification failed' });
      return;
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.email_verification_token !== token) {
      res.status(400).json({ success: false, message: 'Invalid verification token' });
      return;
    }

    user.is_email_verified = true;
    user.email_verification_token = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, error: message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      res.status(200).json({ success: true, message: 'If an account exists, a password reset email has been sent' });
      return;
    }

    const resetToken = jwt.sign(
      { userId: user._id.toString() },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    user.password_reset_token = resetToken;
    user.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send password reset email
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    try {
      await sendVerificationEmail(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    res.status(200).json({ success: true, message: 'If an account exists, a password reset email has been sent' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, error: message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Token and new password are required' });
      return;
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string };
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(400).json({ success: false, message: 'Reset token has expired' });
        return;
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(400).json({ success: false, message: 'Invalid reset token' });
        return;
      }
      res.status(500).json({ success: false, message: 'Token verification failed' });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (user.password_reset_token !== token) {
      res.status(400).json({ success: false, message: 'Invalid reset token' });
      return;
    }

    if (!user.password_reset_expires || user.password_reset_expires < new Date()) {
      res.status(400).json({ success: false, message: 'Reset token has expired' });
      return;
    }

    const password_hash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
    user.password_hash = password_hash;
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, error: message });
  }
};