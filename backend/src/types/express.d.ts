import { UserRole } from './enums.js';

export interface JwtPayload {
  userId: string;
  tenantId: string | null;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface TenantContext {
  tenantId: string;
  tenantName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      tenant?: TenantContext;
    }
  }
}

export {};
