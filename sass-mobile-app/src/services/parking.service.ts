import api from './api.client';
import type {
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
} from '../types/api.types';

export const parkingService = {
  // POST /api/v1/parking/check-in
  async checkIn(payload: CheckInPayload): Promise<CheckInResponse> {
    const { data } = await api.post<CheckInResponse>('/parking/check-in', payload);
    return data;
  },

  // POST /api/v1/parking/scan  — scan QR/plate to get ticket details
  async scanTicket(payload: ScanPayload): Promise<ScanResponse> {
    const { data } = await api.post<ScanResponse>('/parking/scan', payload);
    return data;
  },

  // POST /api/v1/parking/check-out  — calculate fare, move to PENDING_PAYMENT
  async checkOut(payload: CheckOutPayload): Promise<CheckOutResponse> {
    const { data } = await api.post<CheckOutResponse>('/parking/check-out', payload);
    return data;
  },

  // POST /api/v1/parking/process-payment  — finalise payment, open gate
  async processPayment(payload: ProcessPaymentPayload): Promise<ProcessPaymentResponse> {
    const { data } = await api.post<ProcessPaymentResponse>('/parking/process-payment', payload);
    return data;
  },

  // GET /api/v1/parking/tickets
  async getTickets(params?: { status?: string; page?: number; limit?: number }): Promise<TicketsResponse> {
    const { data } = await api.get<TicketsResponse>('/parking/tickets', { params });
    return data;
  },

  // GET /api/v1/operator/stats  — today's dashboard stats
  async getDailyStats(): Promise<DailyStats> {
    const { data } = await api.get<DailyStats>('/operator/stats');
    return data;
  },

  // POST /api/v1/sync/batch — upload offline operations
  async syncBatch(payload: { operations: any[] }): Promise<any> {
    const { data } = await api.post<any>('/sync/batch', payload);
    return data;
  },

  // GET /api/v1/parking/:ticket_id/receipt
  async getReceipt(ticket_id: string): Promise<{ success: boolean; printable_text: string }> {
    const { data } = await api.get<{ success: boolean; printable_text: string }>(`/parking/${ticket_id}/receipt`);
    return data;
  }
};
