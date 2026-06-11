import { api } from './api';

export interface Customer {
  _id: string;
  tenant_id: string;
  name: string;
  customer_code: string;
  email?: string;
  phone_number?: string;
  discount_percentage: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  total_savings: number;
  qr_code_data: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerData {
  name: string;
  phone_number?: string;
  email?: string;
  customer_code: string;
  discount_percentage?: number;
}

export interface UpdateCustomerData {
  name?: string;
  email?: string;
  phone_number?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  discount_percentage?: number;
}

export const customerService = {
  async getCustomers(page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await api.get(`/customers?${params}`);
    return response.data;
  },

  async createCustomer(data: CreateCustomerData) {
    const response = await api.post('/customers', data);
    return response.data;
  },

  async getCustomer(id: string) {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  async updateCustomer(id: string, data: UpdateCustomerData) {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data;
  },

  async deleteCustomer(id: string) {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  async regenerateQrCode(customerId: string) {
    const response = await api.post('/customers/regenerate-qr', { customer_id: customerId });
    return response.data;
  },
};
