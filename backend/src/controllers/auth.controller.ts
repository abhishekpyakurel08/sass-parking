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
    const { name, slug, corporate_email, owner_name, owner_email, password } = req.body;

    const [existingTenant, existingUser, existingSlug] = await Promise.all([
      Tenant.findOne({ corporate_email }),
      User.findOne({ email: owner_email }),
      slug ? Tenant.findOne({ slug }) : null,
    ]);

    if (existingTenant) {
      return next(new ConflictError(`Tenant with email ${corporate_email} already exists`));
    }
    if (existingUser) {
      return next(new ConflictError(`User with email ${owner_email} already exists`));
    }
    if (existingSlug) {
      return next(new ConflictError(`Tenant with slug ${slug} already exists`));
    }

    // Generate slug from name if not provided
    const tenantSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const tenant = await Tenant.create({
      name,
      slug: tenantSlug,
      corporate_email,
      status: TenantStatus.ACTIVE,
    });

    const email_verification_token = crypto.randomBytes(32).toString('hex');
    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const owner = await User.create({
      tenant_id: tenant._id,
      name: owner_name,
      email: owner_email,
      password_hash,
      role: UserRole.TENANT_OWNER,
      is_email_verified: false,
      email_verification_token,
    });

    // Send verification email
    try {
      await sendVerificationEmail(owner_email, email_verification_token);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Send onboarding email
    try {
      await sendOnboardingEmail(owner_email, tenant.name, owner_name);
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
    if (user.tenant_id) {
      const tenant = await Tenant.findById(user.tenant_id);
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
          gate_assignment: user.gate_assignment,
          ticket_prefix: user.ticket_prefix,
        },
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

    // Check if token is expired (10 minutes)
    const tokenAge = Date.now() - (user.updatedAt?.getTime() || 0);
    const tenMinutes = 10 * 60 * 1000;
    if (tokenAge > tenMinutes) {
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
