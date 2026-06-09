import { api } from './api';

export interface DashboardStats {
  activeVehicles: number;
  todayRevenue: number;
  totalCustomers: number;
  staffOnDuty: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  tickets: number;
}

export interface VehicleStats {
  vehicleType: string;
  count: number;
  percentage: number;
}

export const analyticsService = {
  async getDashboardStats() {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  async getRevenueStats(period: 'today' | 'week' | 'month' = 'today') {
    const response = await api.get(`/analytics/revenue?period=${period}`);
    return response.data;
  },

  async getVehicleStats(period: 'today' | 'week' | 'month' = 'today') {
    const response = await api.get(`/analytics/vehicles?period=${period}`);
    return response.data;
  },

  async getStaffStats(period: 'today' | 'week' = 'today') {
    const response = await api.get(`/analytics/staff?period=${period}`);
    return response.data;
  },
};
