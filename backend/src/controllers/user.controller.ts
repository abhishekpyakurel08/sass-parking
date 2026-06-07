import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Tenant } from '../models/tenant.model.js';
import { User } from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { TenantStatus, UserRole } from '../types/enums.js';
import { sendVerificationEmail } from '../utils/email.js';

const COOKIE_NAME = 'park_session';

export const registerTenantOwner = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, owner_name, owner_email, password, corporate_email, total_capacity } = req.body;
    const ownerEmail = owner_email;
    const tenantEmail = corporate_email || owner_email;

    const existingTenant = await Tenant.findOne({ corporate_email: tenantEmail });
    if (existingTenant) {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: 'A tenant with this email already exists.' });
      return;
    }

    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      await session.abortTransaction();
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const tenant = await Tenant.create([{
      name: name || owner_name,
      corporate_email: tenantEmail,
      total_capacity: total_capacity || 100,
      status: TenantStatus.ACTIVE,
    }], { session });

    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const owner = await User.create([{
      tenant_id: tenant[0]._id,
      name: owner_name,
      email: ownerEmail,
      password_hash,
      role: UserRole.TENANT_OWNER,
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Tenant onboarded successfully.',
      tenant_id: tenant[0]._id,
      owner_id: owner[0]._id,
    });
  } catch (error: unknown) {
    await session.abortTransaction();
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, error: message });
  } finally {
    session.endSession();
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

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, role: user.role, tenant_id: user.tenant_id ?? null },
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
    res.status(200).json({ success: true, data: user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ success: false, error: message });
  }
};

export const resendEmailVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
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