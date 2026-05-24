import type { Request, Response } from 'express';
import { Tenant } from '../models/tenant.model.js';
import { User } from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { TenantStatus, UserRole } from '../types/enums.js';

const COOKIE_NAME = 'park_session';

// 1. TENANT + OWNER INITIAL ONBOARDING (legacy endpoint)
export const registerTenantOwner = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, owner_name, owner_email, password, corporate_email, total_capacity } = req.body;
    const ownerEmail = owner_email;
    const tenantEmail = corporate_email || owner_email;

    const existingTenant = await Tenant.findOne({ corporate_email: tenantEmail });
    if (existingTenant) {
      res.status(400).json({ success: false, message: 'A tenant with this email already exists.' });
      return;
    }

    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const tenant = await Tenant.create({
      name: name || owner_name,
      corporate_email: tenantEmail,
      total_capacity: total_capacity || 100,
      status: TenantStatus.ACTIVE,
    });

    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const owner = await User.create({
      tenant_id: tenant._id,
      name: owner_name,
      email: ownerEmail,
      password_hash,
      role: UserRole.TENANT_OWNER,
    });

    res.status(201).json({
      success: true,
      message: 'Tenant onboarded successfully.',
      tenant_id: tenant._id,
      owner_id: owner._id,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. LOGIN
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

    const expiresIn   = rememberMe ? '30d' : '8h';
    const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;

    const token = jwt.sign(
      { userId: (user._id as any).toString(), role: user.role, tenantId: user.tenant_id?.toString() ?? null },
      env.JWT_ACCESS_SECRET,
      { expiresIn: expiresIn as any }
    );

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'lax',
      maxAge: cookieMaxAge,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, role: user.role, tenant_id: user.tenant_id ?? null },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. LOGOUT
export const logoutUser = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'lax' });
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// 4. POS DEVICE LOGIN (API KEY — kept for backward compat)
export const posLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      res.status(400).json({ success: false, message: 'API Key is required.' });
      return;
    }
    // apiKey field no longer in schema — return not found
    res.status(401).json({ success: false, message: 'POS API Key login is deprecated. Use /api/v1/auth/login.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};