import api from './api.client';
import type {
  LoginPayload,
  LoginResponse,
  CheckInPayload,
  CheckInResponse,
  ScanPayload,
  ScanResponse,
  CheckOutPayload,
  CheckOutResponse,
  ProcessPaymentPayload,
  ProcessPaymentResponse,
  TicketsResponse,
  DailyStats,
  LostTicketPayload,
  LostTicketResponse,
} from '../types/api.types';

// ── AUTH ENDPOINTS ─────────────────────────────────────────────────────────────
export const authEndpoints = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  refresh: async (refreshToken: string): Promise<{ access_token: string }> => {
    const { data } = await api.post<{ access_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return data;
  },
};

// ── STAFF ENDPOINTS ─────────────────────────────────────────────────────────────
export const staffEndpoints = {
  getProfile: async (): Promise<{ success: boolean; data: any }> => {
    const { data } = await api.get<{ success: boolean; data: any }>('/operator/me');
    return data;
  },
};

// ── OPERATOR ENDPOINTS ───────────────────────────────────────────────────────────
export const operatorEndpoints = {
  checkIn: async (payload: CheckInPayload): Promise<CheckInResponse> => {
    const { data } = await api.post<CheckInResponse>('/operator/check-in', payload);
    return data;
  },

  checkOut: async (payload: CheckOutPayload): Promise<CheckOutResponse> => {
    const { data } = await api.post<CheckOutResponse>('/operator/check-out', payload);
    return data;
  },

  processPayment: async (payload: ProcessPaymentPayload): Promise<ProcessPaymentResponse> => {
    const { data } = await api.post<ProcessPaymentResponse>('/operator/process-payment', payload);
    return data;
  },

  scanTicket: async (payload: ScanPayload): Promise<ScanResponse> => {
    const { data } = await api.post<ScanResponse>('/operator/scan', payload);
    return data;
  },

  getDailyStats: async (): Promise<DailyStats> => {
    const { data } = await api.get<DailyStats>('/operator/stats');
    return data;
  },

  lostTicket: async (payload: LostTicketPayload): Promise<LostTicketResponse> => {
    const { data } = await api.post<LostTicketResponse>('/operator/lost-ticket', payload);
    return data;
  },

  syncBatch: async (payload: { operations: any[] }): Promise<any> => {
    const { data } = await api.post<any>('/sync/batch', payload);
    return data;
  },

  getReceipt: async (ticket_id: string): Promise<{ success: boolean; printable_text: string }> => {
    const { data } = await api.get<{ success: boolean; printable_text: string }>(`/parking/${ticket_id}/receipt`);
    return data;
  },

  getTickets: async (params?: { status?: string; page?: number; limit?: number }): Promise<TicketsResponse> => {
    const { data } = await api.get<TicketsResponse>('/parking/tickets', { params });
    return data;
  },
};
