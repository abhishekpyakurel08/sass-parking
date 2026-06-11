import { getTenantSlug, setTenantSlug as setSlug, clearTenantSlug } from './tenant';

/** API base URL — always use the env var, works for localhost AND production */
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const API_BASE_URL = getBaseUrl();

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string | null) => void)[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  setTenantSlug(slug: string) {
    if (typeof window !== 'undefined') {
      setSlug(slug);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      clearTenantSlug();
    }
  }

  private subscribeTokenRefresh(cb: (token: string | null) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed(token: string | null) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private async executeRefresh(): Promise<string> {
    const url = `${this.baseUrl}/auth/refresh`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Refresh failed');
    }

    const data = await response.json();
    if (data.success && data.data?.access_token) {
      const newToken = data.data.access_token;
      this.setToken(newToken);
      return newToken;
    }
    throw new Error('No token returned from refresh');
  }

  private async handleTokenRefresh(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.subscribeTokenRefresh((token) => {
          if (token) {
            resolve(token);
          } else {
            reject(new Error('Refresh failed'));
          }
        });
      });
    }

    this.isRefreshing = true;

    try {
      const newToken = await this.executeRefresh();
      this.onRefreshed(newToken);
      return newToken;
    } catch (error) {
      this.onRefreshed(null);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Always include credentials to support cookies cross-origin
    options.credentials = 'include';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    let tenantSlug = getTenantSlug();

    if (tenantSlug) {
      headers['X-Tenant-Slug'] = tenantSlug;
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized (expired token) by attempting refresh
      if (response.status === 401 && !endpoint.includes('/auth/')) {
        try {
          const newToken = await this.handleTokenRefresh();
          headers['Authorization'] = `Bearer ${newToken}`;
          
          // Retry the request with the new token
          response = await fetch(url, {
            ...options,
            headers,
          });
        } catch (refreshError) {
          console.error('Session refresh failed. Clearing session.', refreshError);
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw refreshError;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);
