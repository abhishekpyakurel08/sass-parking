import { api } from './api';

export interface Staff {
  _id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: 'GATE_STAFF';
  gate_assignment: 'ENTRY' | 'EXIT' | 'BOTH';
  ticket_prefix: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffData {
  name: string;
  email: string;
  password?: string; // Optional if only generating API keys? No, required for login.
  gate_assignment?: 'ENTRY' | 'EXIT' | 'BOTH';
  ticket_prefix?: string;
}

export interface UpdateStaffData {
  name?: string;
  gate_assignment?: 'ENTRY' | 'EXIT' | 'BOTH';
  ticket_prefix?: string;
}

export const staffService = {
  async getStaff() {
    const response = await api.get('/tenants/staff');
    return response.data;
  },

  async createStaff(data: CreateStaffData) {
    const response = await api.post('/tenants/staff', data);
    return response.data;
  },

  async updateStaff(id: string, data: UpdateStaffData) {
    const response = await api.patch(`/tenants/staff/${id}`, data);
    return response.data;
  },

  async deleteStaff(id: string) {
    const response = await api.delete(`/tenants/staff/${id}`);
    return response.data;
  },

  async regenerateApiKey(id: string) {
    const response = await api.post(`/tenants/staff/${id}/regenerate-api-key`);
    return response.data;
  },
};
