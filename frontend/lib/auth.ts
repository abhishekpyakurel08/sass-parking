import { api } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  slug?: string;
  corporate_email: string;
  owner_name: string;
  owner_email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    userId: string;
    tenantId: string;
    role: 'SUPER_ADMIN' | 'TENANT_OWNER' | 'GATE_STAFF';
    name: string;
    email: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.success && response.data) {
      api.setToken(response.data.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      return response.data;
    }
    throw new Error(response.message || 'Login failed');
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.success && response.data) {
      api.setToken(response.data.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      return response.data;
    }
    throw new Error(response.message || 'Registration failed');
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token') 
      : null;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    if (response.success && response.data) {
      api.setToken(response.data.access_token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      return response.data;
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
};
