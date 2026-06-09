import { api } from './api';

export type VehicleType = 'CAR' | 'BIKE' | 'TRUCK' | 'SUV' | 'BUS';

export interface HourlyRate {
  _id: string;
  tenant_id: string;
  vehicle_type: VehicleType;
  rate_per_hour: number;
  lost_ticket_penalty: number;
  grace_period_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRateData {
  vehicle_type: VehicleType;
  rate_per_hour: number;
  lost_ticket_penalty?: number;
  grace_period_minutes?: number;
}

export interface UpdateRateData {
  rate_per_hour?: number;
  lost_ticket_penalty?: number;
  grace_period_minutes?: number;
}

export const ratesService = {
  async getRates() {
    const response = await api.get('/rates');
    return response.data;
  },

  async createRate(data: CreateRateData) {
    const response = await api.post('/rates', data);
    return response.data;
  },

  async getRate(id: string) {
    const response = await api.get(`/rates/${id}`);
    return response.data;
  },

  async updateRate(id: string, data: UpdateRateData) {
    const response = await api.put(`/rates/${id}`, data);
    return response.data;
  },

  async deleteRate(id: string) {
    const response = await api.delete(`/rates/${id}`);
    return response.data;
  },
};
