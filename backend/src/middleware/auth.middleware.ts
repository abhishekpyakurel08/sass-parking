import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AuthError, ForbiddenError } from '../errors/ApiError.js';
import { UserRole } from '../types/enums.js';
import { apiKeyAuth } from './apiKeyAuth.middleware.js';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthError('Bearer token is missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    if (!token) throw new AuthError('Token signature is missing');

    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new AuthError('Access token has expired — please refresh'));
    } else if (err.name === 'JsonWebTokenError') {
      next(new AuthError('Invalid token signature'));
    } else {
      next(err);
    }
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) return next(new AuthError('Not authenticated'));

    if (user.role === UserRole.SUPER_ADMIN) return next();

    if (!roles.includes(user.role as UserRole)) {
      return next(
        new ForbiddenError(
          `Access denied. Required: [${roles.join(', ')}]. Your role: ${user.role}`
        )
      );
    }
    next();
  };
};

export const authenticateAny = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization ?? '';

  if (authHeader.startsWith('Bearer pk_')) {
    apiKeyAuth(req, res, next);
  } else {
    authenticate(req, res, next);
  }
};