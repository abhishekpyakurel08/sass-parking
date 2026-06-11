import { api } from './api';
import { setTenantSlug } from './tenant';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  tenantName: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  // For /api/v1/auth/* endpoints (nested data)
  data?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: {
      userId?: string;
      id?: string;
      tenantId?: string;
      tenant_id?: string;
      role: 'SUPER_ADMIN' | 'TENANT_OWNER' | 'GATE_STAFF';
      name: string;
      email: string;
      slug?: string;
      gate_assignment?: string;
      ticket_prefix?: string;
    };
    tenant_id?: string;
    tenant_name?: string;
    tenant_slug?: string;
    owner_id?: string;
    owner_email?: string;
    requires_email_verification?: boolean;
    tenant_branding?: {
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      customDomain?: string;
      senderEmail?: string;
      senderName?: string;
    };
  };
  // For /api/v1/user/* endpoints (top-level properties)
  token?: string;
  user?: {
    id?: string;
    name: string;
    email?: string;
    role: 'SUPER_ADMIN' | 'TENANT_OWNER' | 'GATE_STAFF';
    tenant_id?: string;
    slug?: string;
  };
  tenant_id?: string;
  slug?: string;
  owner_id?: string;
  requires_email_verification?: boolean;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<any>('/auth/login', credentials);
    if (response.success && response.data?.access_token) {
      api.setToken(response.data.access_token);
      // Store tenant slug for multi-tenant support
      if (response.data.user?.slug) {
        setTenantSlug(response.data.user.slug);
      }
      // Add tenant_name to user object if available
      if (response.data.user && response.data.tenant_name) {
        response.data.user.tenant_name = response.data.tenant_name;
      }
      return response;
    }
    throw new Error(response.message || 'Login failed');
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const payload = {
      tenantName: data.tenantName,
      name: data.name,
      email: data.email,
      password: data.password,
    };
    const response = await api.post<any>('/auth/register', payload);
    if (response.success) {
      // Store tenant slug from registration response for multi-tenant support
      if (response.data?.tenant_slug) {
        setTenantSlug(response.data.tenant_slug);
      }
      return response;
    }
    throw new Error(response.message || 'Registration failed');
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post<{ access_token: string; expires_in?: number }>('/auth/refresh', {});

    if (response.success && response.data?.access_token) {
      api.setToken(response.data.access_token);
      return {
        success: true,
        data: response.data,
      };
    }
    throw new Error(response.message || 'Token refresh failed');
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      api.clearToken();
    }
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await api.post('/auth/reset-password', { token, password });
  },

  async verifyEmail(token: string): Promise<void> {
    await api.get(`/auth/verify-email?token=${token}`);
  },

  async getTenantBranding(slug: string): Promise<{ name: string; branding: any }> {
    const response = await api.get<{ name: string; branding: any }>(`/auth/branding/${slug}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch tenant branding');
  },

  async getMe(): Promise<any> {
    const response = await api.get<any>('/user/me');
    if (response.success && response.data) {
      if (response.data.slug) {
        setTenantSlug(response.data.slug);
      }
      // Add tenant_name to user object if available
      if (response.data.tenant_name) {
        response.data.tenant_name = response.data.tenant_name;
      }
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch user');
  },
};
