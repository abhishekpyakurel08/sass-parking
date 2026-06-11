import { api } from './api';

const STORAGE_KEY = "tenant_slug";

// Tenant Helper Functions for Multi-Tenant Support
export function getTenantFromSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname;

  // dipika.localhost - support localhost subdomains
  if (host.endsWith(".localhost")) {
    return host.split(".")[0];
  }

  const parts = host.split(".");

  // localhost
  if (host.includes("localhost")) {
    return null;
  }

  // dipika.yourdomain.com
  if (parts.length >= 3 && parts[0] !== "www") {
    return parts[0];
  }

  return null;
}

export function getTenantSlug(): string | null {
  if (typeof window === "undefined") return null;

  return (
    getTenantFromSubdomain() ||
    localStorage.getItem(STORAGE_KEY) ||
    process.env.NEXT_PUBLIC_TENANT_SLUG ||
    null
  );
}

export function setTenantSlug(slug: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, slug);
}

export function clearTenantSlug() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
}

// Tenant Service Functions
export interface Tenant {
  _id: string;
  name: string;
  slug: string;
  corporate_email: string;
  status: 'ACTIVE' | 'SUSPENDED';
  contactNumber: string;
  address: string;
  ownerName: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTenantData {
  name: string;
  slug?: string;
  corporate_email: string;
  owner_name: string;
  owner_email: string;
  password: string;
  contactNumber?: string;
  address?: string;
}

export interface UpdateTenantData {
  name?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  contactNumber?: string;
  address?: string;
}

export const tenantService = {
  async getTenants(page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get(`/tenants?${params}`);
    return response.data;
  },

  async createTenant(data: CreateTenantData) {
    const payload = {
      name: data.name,
      slug: data.slug || undefined,
      corporate_email: data.corporate_email,
      owner_name: data.owner_name,
      owner_email: data.owner_email,
      password: data.password,
      contactNumber: data.contactNumber || undefined,
      address: data.address || undefined,
    };
    const response = await api.post('/tenants', payload);
    return response.data;
  },

  async getTenant(id: string) {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  },

  async updateTenant(id: string, data: UpdateTenantData) {
    const payload = {
      name: data.name,
      status: data.status,
    };
    const response = await api.patch(`/tenants/${id}`, payload);
    return response.data;
  },

  async deleteTenant(id: string) {
    const response = await api.delete(`/tenants/${id}`);
    return response.data;
  },

  async suspendTenant(id: string) {
    const response = await api.post(`/tenants/${id}/suspend`);
    return response.data;
  },

  async activateTenant(id: string) {
    const response = await api.post(`/tenants/${id}/activate`);
    return response.data;
  },
};
