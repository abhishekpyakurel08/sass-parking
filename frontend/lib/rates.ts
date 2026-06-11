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

  async getRate(vehicleType: VehicleType) {
    const response = await api.get(`/rates/${vehicleType}`);
    return response.data;
  },

  async updateRate(vehicleType: VehicleType, data: UpdateRateData) {
    const response = await api.patch(`/rates/${vehicleType}`, data);
    return response.data;
  },

  async deleteRate(vehicleType: VehicleType) {
    const response = await api.delete(`/rates/${vehicleType}`);
    return response.data;
  },
};
