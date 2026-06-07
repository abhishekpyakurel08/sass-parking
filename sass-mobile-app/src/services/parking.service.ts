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
  LostTicketPayload,
  LostTicketResponse,
} from '../types/api.types';
import { operatorEndpoints } from './endpoints';

export const operatorService = {
  async lostTicket(payload: LostTicketPayload): Promise<LostTicketResponse> {
    return await operatorEndpoints.lostTicket(payload);
  },

  async checkIn(payload: CheckInPayload): Promise<CheckInResponse> {
    return await operatorEndpoints.checkIn(payload);
  },

  async scanTicket(payload: ScanPayload): Promise<ScanResponse> {
    return await operatorEndpoints.scanTicket(payload);
  },

  async checkOut(payload: CheckOutPayload): Promise<CheckOutResponse> {
    return await operatorEndpoints.checkOut(payload);
  },

  async processPayment(payload: ProcessPaymentPayload): Promise<ProcessPaymentResponse> {
    return await operatorEndpoints.processPayment(payload);
  },

  async getTickets(params?: { status?: string; page?: number; limit?: number }): Promise<TicketsResponse> {
    return await operatorEndpoints.getTickets(params);
  },

  async getDailyStats(): Promise<DailyStats> {
    return await operatorEndpoints.getDailyStats();
  },

  async syncBatch(payload: { operations: any[] }): Promise<any> {
    return await operatorEndpoints.syncBatch(payload);
  },

  async getReceipt(ticket_id: string): Promise<{ success: boolean; printable_text: string }> {
    return await operatorEndpoints.getReceipt(ticket_id);
  }
};
