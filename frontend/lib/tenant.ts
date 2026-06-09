import { api } from './api';

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
    const response = await api.post('/tenants', data);
    return response.data;
  },

  async getTenant(id: string) {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  },

  async updateTenant(id: string, data: UpdateTenantData) {
    const response = await api.put(`/tenants/${id}`, data);
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
