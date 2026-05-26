import { create } from 'zustand';
import { parkingService } from '../services/parking.service';
import type { Ticket, CheckOutResponse, ScanResponse, DailyStats } from '../types/api.types';

interface ParkingState {
  // Dashboard
  stats: DailyStats['data'] | null;
  recentTickets: Ticket[];
  isLoadingStats: boolean;

  // Check-in result
  lastCheckIn: {
    ticket_id: string;
    ticket_number: string;
    license_plate: string;
    vehicle_type: string;
    check_in_time: string;
    qr_code_url: string;
  } | null;

  // Scan / checkout flow
  scannedTicket: ScanResponse['ticket'] | null;
  checkoutSummary: CheckOutResponse['summary'] | null;

  // Payment
  paymentReceipt: {
    total_due: number;
    payment_method: string;
    change_given?: number;
    printable_text: string;
  } | null;

  error: string | null;
  isLoading: boolean;

  // Actions
  fetchDashboard: () => Promise<void>;
  checkIn: (license_plate: string, vehicle_type: string, customer_code?: string) => Promise<void>;
  scanTicket: (code: string) => Promise<void>;
  checkOut: (ticket_id: string) => Promise<void>;
  processPayment: (ticket_id: string, payment_method: 'CASH' | 'UPI' | 'CARD', amount_received?: number) => Promise<void>;
  clearError: () => void;
  clearScanned: () => void;
  clearCheckout: () => void;
  clearPayment: () => void;
}

export const useParkingStore = create<ParkingState>((set) => ({
  stats: null,
  recentTickets: [],
  isLoadingStats: false,
  lastCheckIn: null,
  scannedTicket: null,
  checkoutSummary: null,
  paymentReceipt: null,
  error: null,
  isLoading: false,

  fetchDashboard: async () => {
    set({ isLoadingStats: true, error: null });
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        parkingService.getDailyStats(),
        parkingService.getTickets({ limit: 10 }),
      ]);
      set({
        stats: statsRes.data,
        recentTickets: ticketsRes.data,
        isLoadingStats: false,
      });
    } catch (err: any) {
      set({ error: err?.response?.data?.message ?? 'Failed to load dashboard', isLoadingStats: false });
    }
  },

  checkIn: async (license_plate, vehicle_type, customer_code) => {
    set({ isLoading: true, error: null, lastCheckIn: null });
    try {
      const res = await parkingService.checkIn({
        license_plate,
        vehicle_type: vehicle_type as any,
        customer_code,
      });
      set({ lastCheckIn: res.ticket, isLoading: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Check-in failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  scanTicket: async (code) => {
    set({ isLoading: true, error: null, scannedTicket: null });
    try {
      const res = await parkingService.scanTicket({ code });
      set({ scannedTicket: res.ticket, isLoading: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Scan failed — ticket not found';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  checkOut: async (ticket_id) => {
    set({ isLoading: true, error: null, checkoutSummary: null });
    try {
      const res = await parkingService.checkOut({ ticket_id });
      set({ checkoutSummary: res.summary, isLoading: false });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Checkout failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  processPayment: async (ticket_id, payment_method, amount_received) => {
    set({ isLoading: true, error: null, paymentReceipt: null });
    try {
      const res = await parkingService.processPayment({ ticket_id, payment_method, amount_received });
      set({
        paymentReceipt: {
          total_due: res.receipt.total_due,
          payment_method: res.receipt.payment_method,
          change_given: res.receipt.change_given,
          printable_text: res.receipt.printable_text,
        },
        isLoading: false,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Payment failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  clearError: () => set({ error: null }),
  clearScanned: () => set({ scannedTicket: null }),
  clearCheckout: () => set({ checkoutSummary: null }),
  clearPayment: () => set({ paymentReceipt: null }),
}));
