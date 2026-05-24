import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { Tenant } from '../models/tenant.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { env } from '../config/env.js';
import { AuthError, ConflictError } from '../errors/ApiError.js';
import { UserRole, TenantStatus } from '../types/enums.js';
import { logSecurity } from '../utils/logger.js';
import type { JwtPayload } from '../types/express.js';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, corporate_email, total_capacity, owner_name, owner_email, password } = req.body;

    const [existingTenant, existingUser] = await Promise.all([
      Tenant.findOne({ corporate_email }),
      User.findOne({ email: owner_email }),
    ]);

    if (existingTenant) return next(new ConflictError(`Tenant with email ${corporate_email} already exists`));
    if (existingUser)   return next(new ConflictError(`User with email ${owner_email} already exists`));

    const tenant = await Tenant.create({
      name,
      corporate_email,
      total_capacity,
      status: TenantStatus.ACTIVE,
    });

    const password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    const owner = await User.create({
      tenant_id: tenant._id,
      name: owner_name,
      email: owner_email,
      password_hash,
      role: UserRole.TENANT_OWNER,
    });

    res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: {
        tenant_id: tenant._id,
        tenant_name: tenant.name,
        owner_id: owner._id,
        owner_email: owner.email,
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

    // Tenant users: check tenant status
    if (user.tenant_id) {
      const tenant = await Tenant.findById(user.tenant_id);
      if (tenant?.status === TenantStatus.SUSPENDED) {
        return next(new AuthError('Tenant account is suspended. Contact support.'));
      }
    }

    const payload: JwtPayload = {
      userId: (user._id as any).toString(),
      tenantId: user.tenant_id ? user.tenant_id.toString() : null,
      role: user.role as UserRole,
    };

    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token for rotation validation
    user.refresh_token = refreshToken;
    await user.save();

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
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
      userId: (user._id as any).toString(),
      tenantId: user.tenant_id ? user.tenant_id.toString() : null,
      role: user.role as UserRole,
    };

    const newAccessToken  = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    // Rotate: store new refresh token
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

    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict' });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};
