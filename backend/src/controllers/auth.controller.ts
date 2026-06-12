import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/user.model.js';
import { Tenant } from '../models/tenant.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { AuthError, ConflictError } from '../errors/ApiError.js';
import { UserRole, TenantStatus } from '../types/enums.js';
import { logSecurity } from '../utils/logger.js';
import type { JwtPayload } from '../types/express.js';
import { sendVerificationEmail, sendOnboardingEmail } from '../utils/email.js';


export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tenantName, name, email, password } = req.body;

    const [existingTenant, existingUser] = await Promise.all([
      Tenant.findOne({ corporate_email: email }),
      User.findOne({ email }),
    ]);

    if (existingTenant) {
      return next(new ConflictError(`Tenant with email ${email} already exists`));
    }
    if (existingUser) {
      return next(new ConflictError(`User with email ${email} already exists`));
    }

    // Generate slug from tenant name
    const tenantSlug = tenantName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const tenant = await Tenant.create({
      name: tenantName,
      slug: tenantSlug,
      corporate_email: email,
      status: TenantStatus.ACTIVE,
    });

    const email_verification_token = crypto.randomBytes(32).toString('hex');
    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const owner = await User.create({
      tenant_id: tenant._id,
      name,
      email,
      password_hash,
      role: UserRole.TENANT_OWNER,
      is_email_verified: false,
      email_verification_token,
    });

    // Send verification email with tenant branding
    try {
      await sendVerificationEmail(email, email_verification_token, tenant._id.toString(), name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Send onboarding email with tenant branding
    try {
      await sendOnboardingEmail(email, tenant.name, name, tenant._id.toString());
    } catch (emailError) {
      console.error('Failed to send onboarding email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully. Please check your email to verify your account.',
      data: {
        tenant_id: tenant._id,
        tenant_name: tenant.name,
        tenant_slug: tenant.slug,
        owner_id: owner._id,
        owner_email: owner.email,
        requires_email_verification: true,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password_hash +refresh_token');
    if (!user) return next(new AuthError('Invalid email or password'));

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logSecurity('Failed login attempt', { email, ip: req.ip });
      return next(new AuthError('Invalid email or password'));
    }

    let tenantSlug = null;
    let tenantBranding = null;
    let tenant = null;
    if (user.tenant_id) {
      tenant = await Tenant.findById(user.tenant_id);
      console.log('Login - Tenant lookup:', {
        tenant_id: user.tenant_id,
        tenant: tenant ? { id: tenant._id, name: tenant.name, slug: tenant.slug } : null,
        slug: tenant?.slug
      });
      if (tenant?.status === TenantStatus.SUSPENDED) {
        return next(new AuthError('Tenant account is suspended. Contact support.'));
      }
      if (tenant) {
        tenantSlug = tenant.slug || null;
        tenantBranding = tenant.branding || null;
        // If slug is empty or null, generate one from tenant name and update the database
        if (!tenantSlug && tenant.name) {
          tenantSlug = tenant.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
          console.log('Generated slug from tenant name:', tenantSlug);
          // Update the tenant in the database with the generated slug
          await Tenant.findByIdAndUpdate(user.tenant_id, { slug: tenantSlug });
          console.log('Updated tenant slug in database');
        }
      }
    }

    const payload: JwtPayload = {
      userId: user._id.toString(),
      tenantId: user.tenant_id ? user.tenant_id.toString() : null,
      role: user.role,
    };

    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refresh_token = refreshToken;
    await user.save();

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        access_token: accessToken,
        expires_in: env.ACCESS_TOKEN_EXPIRES,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id,
          slug: tenantSlug,
          tenant_name: tenant?.name,
          gate_assignment: user.gate_assignment,
          ticket_prefix: user.ticket_prefix,
          tenant_branding: tenantBranding,
        },
        tenant_branding: tenantBranding,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token: string | undefined =
      req.cookies?.refresh_token ?? req.body?.refresh_token;

    if (!token) return next(new AuthError('Refresh token is required'));

    let decoded: JwtPayload;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return next(new AuthError('Invalid or expired refresh token'));
    }

    const user = await User.findById(decoded.userId).select('+refresh_token');
    if (!user || user.refresh_token !== token) {
      logSecurity('Refresh token reuse detected', { userId: decoded.userId, ip: req.ip });
      if (user) { user.refresh_token = null; await user.save(); }
      return next(new AuthError('Refresh token reuse detected — please login again'));
    }

    const payload: JwtPayload = {
      userId: user._id.toString(),
      tenantId: user.tenant_id ? user.tenant_id.toString() : null,
      role: user.role,
    };

    const newAccessToken  = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    user.refresh_token = newRefreshToken;
    await user.save();

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        access_token: newAccessToken,
        expires_in: env.ACCESS_TOKEN_EXPIRES,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (userId) {
      await User.findByIdAndUpdate(userId, { refresh_token: null });
    }

    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict', secure: env.isProd });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return next(new AuthError('Verification token is required'));
    }

    // Check if token was created more than 24 hours ago
    const user = await User.findOne({ email_verification_token: token });
    if (!user) {
      return next(new AuthError('Invalid or expired verification token'));
    }

    // Check if token is expired (24 hours in dev, 1 hour in prod)
    const tokenAge = Date.now() - (user.updatedAt?.getTime() || 0);
    const expiryWindow = env.isProd
      ? 60 * 60 * 1000          // 1 hour in production
      : 24 * 60 * 60 * 1000;   // 24 hours in development
    if (tokenAge > expiryWindow) {
      return next(new AuthError('Verification token has expired. Please request a new verification email.'));
    }

    if (user.is_email_verified) {
      res.status(200).json({
        success: true,
        message: 'Email already verified',
      });
      return;
    }

    user.is_email_verified = true;
    user.email_verification_token = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AuthError('Email is required'));
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      res.status(200).json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.password_reset_token = resetToken;
    user.password_reset_expires = resetTokenExpiry;
    await user.save();

    // Send password reset email with tenant branding
    try {
      // Import sendPasswordResetEmail function
      const { sendPasswordResetEmail } = await import('../utils/email.js');
      await sendPasswordResetEmail(email, resetToken, user.tenant_id?.toString(), user.name);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return next(new AuthError('Token and password are required'));
    }

    const user = await User.findOne({
      password_reset_token: token,
      password_reset_expires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AuthError('Invalid or expired reset token'));
    }

    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    user.password_hash = password_hash;
    user.password_reset_token = null;
    user.password_reset_expires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    });
  } catch (err) {
    next(err);
  }
};

export const getTenantBranding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return next(new AuthError('Tenant slug is required'));
    }

    const tenant = await Tenant.findOne({ slug });
    if (!tenant) {
      return next(new AuthError('Tenant not found'));
    }

    res.status(200).json({
      success: true,
      data: {
        name: tenant.name,
        branding: tenant.branding,
      },
    });
  } catch (err) {
    next(err);
  }
};
