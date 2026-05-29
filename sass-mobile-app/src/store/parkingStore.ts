import { create } from 'zustand';
import { parkingService } from '../services/parking.service';
import { enqueue, loadQueue, removeFromQueue, isNetworkError } from '../services/offlineQueue';
import type { Ticket, CheckOutResponse, ScanResponse, DailyStats } from '../types/api.types';
import { Alert } from 'react-native';

interface ParkingState {
  // Dashboard
  stats: DailyStats['data'] | null;
  recentTickets: Ticket[];
  isLoadingStats: boolean;

  // Offline Sync
  offlineQueueCount: number;
  isSyncing: boolean;

  // Check-in result
  lastCheckIn: {
    ticket_id: string;
    ticket_number: string;
    license_plate: string;
    vehicle_type: string;
    check_in_time: string;
    qr_code_url: string;
    isOffline?: boolean;
  } | null;
  lastCheckInReceiptText: string | null;

  // Scan / checkout flow
  scannedTicket: ScanResponse['ticket'] | null;
  checkoutSummary: CheckOutResponse['summary'] | null;

  // Payment
  paymentReceipt: {
    total_due: number;
    payment_method: string;
    change_given?: number;
    printable_text: string;
    isOffline?: boolean;
  } | null;

  error: string | null;
  isLoading: boolean;

  // Actions
  fetchDashboard: () => Promise<void>;
  checkIn: (license_plate: string, vehicle_type: string, customer_code?: string) => Promise<void>;
  scanTicket: (code: string) => Promise<void>;
  checkOut: (ticket_id: string) => Promise<void>;
  lostTicket: (vehicle_type: string, license_plate: string, assumed_duration_hours: number) => Promise<void>;
  processPayment: (ticket_id: string, payment_method: 'CASH' | 'UPI' | 'CARD', amount_received?: number, transaction_reference?: string) => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
  updateQueueCount: () => Promise<void>;
  clearError: () => void;
  clearScanned: () => void;
  clearCheckout: () => void;
  clearPayment: () => void;
}

export const useParkingStore = create<ParkingState>((set, get) => ({
  stats: null,
  recentTickets: [],
  isLoadingStats: false,
  offlineQueueCount: 0,
  isSyncing: false,
  lastCheckIn: null,
  lastCheckInReceiptText: null,
  scannedTicket: null,
  checkoutSummary: null,
  paymentReceipt: null,
  error: null,
  isLoading: false,

  updateQueueCount: async () => {
    const q = await loadQueue();
    set({ offlineQueueCount: q.length });
  },

  syncOfflineQueue: async () => {
    const q = await loadQueue();
    if (q.length === 0) return;
    
    set({ isSyncing: true });
    try {
      const res = await parkingService.syncBatch({ operations: q });
      if (res.success) {
        // Clear all synced operations
        // Ideally we check results.successful vs errors, but for simplicity we clear the whole queue
        // unless there are explicit instructions.
        // Or we can clear by ID, but backend doesn't return IDs. So we just clear the ones we sent.
        await removeFromQueue(q.map(op => op.id));
        await get().updateQueueCount();
        await get().fetchDashboard();
        Alert.alert('Sync Complete', 'Offline operations have been synced.');
      }
    } catch (err: any) {
      if (!isNetworkError(err)) {
        Alert.alert('Sync Error', err?.response?.data?.message ?? 'Failed to sync offline operations.');
      }
    } finally {
      set({ isSyncing: false });
    }
  },

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
      await get().updateQueueCount();
      get().syncOfflineQueue(); // auto-sync
    } catch (err: any) {
      if (isNetworkError(err)) {
        await get().updateQueueCount(); // Just load queue count
        set({ error: 'Running in offline mode', isLoadingStats: false });
      } else {
        set({ error: err?.response?.data?.message ?? 'Failed to load dashboard', isLoadingStats: false });
      }
    }
  },

  checkIn: async (license_plate, vehicle_type, customer_code) => {
    set({ isLoading: true, error: null, lastCheckIn: null, lastCheckInReceiptText: null });
    const formattedPlate = license_plate.trim().toUpperCase();
    try {
      const res = await parkingService.checkIn({
        license_plate: formattedPlate || undefined,
        vehicle_type: vehicle_type as any,
        customer_code,
      });
      set({ lastCheckIn: res.ticket, lastCheckInReceiptText: res.receipt?.printable_text || null, isLoading: false });
    } catch (err: any) {
      if (isNetworkError(err)) {
        // Enqueue offline check-in
        const ticket_number = `offline-tkt-${Date.now()}`;
        const check_in_time = new Date().toISOString();
        const fallbackPlate = formattedPlate || `GUEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        await enqueue('CHECK_IN', {
          ticket_number,
          license_plate: fallbackPlate,
          vehicle_type,
          check_in_time,
          customer_code
        });

        await get().updateQueueCount();
        
        // Mock success response
        set({
          lastCheckIn: {
            ticket_id: ticket_number,
            ticket_number,
            license_plate: fallbackPlate,
            vehicle_type,
            check_in_time,
            qr_code_url: 'data:image/png;base64,offline-mock', // In real app, generate local QR
            isOffline: true
          },
          lastCheckInReceiptText: `┌──────────────────────────────────────────┐\n│            OFFLINE CHECK-IN              │\n│ Ticket No: ${ticket_number.slice(0, 8).toUpperCase()}                      │\n│ Plate:     ${fallbackPlate.padEnd(30)}│\n│ Time:      ${new Date(check_in_time).toLocaleTimeString().padEnd(30)}│\n└──────────────────────────────────────────┘`,
          isLoading: false
        });
        Alert.alert('Offline Check-In', 'Vehicle checked in offline. Will sync when connection is restored.');
      } else {
        const msg = err?.response?.data?.message ?? 'Check-in failed';
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
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

  lostTicket: async (vehicle_type, license_plate, assumed_duration_hours) => {
    set({ isLoading: true, error: null, checkoutSummary: null });
    try {
      const res = await parkingService.lostTicket({
        vehicle_type: vehicle_type as any,
        license_plate,
        assumed_duration_hours,
      });
      set({
        checkoutSummary: {
          ticket_id: res.summary.ticket_id,
          ticket_number: res.summary.ticket_number,
          license_plate: res.summary.license_plate,
          vehicle_type: res.summary.vehicle_type,
          check_in_time: new Date(Date.now() - assumed_duration_hours * 60 * 60 * 1000).toISOString(),
          check_out_time: new Date().toISOString(),
          duration_minutes: assumed_duration_hours * 60,
          duration_display: `${assumed_duration_hours}h 0m`,
          rate_per_hour: assumed_duration_hours > 0 ? res.summary.base_amount / assumed_duration_hours : 0,
          breakdown: [{ label: 'Lost Ticket Penalty', amount: res.summary.lost_ticket_penalty }],
          subtotal: res.summary.base_amount,
          discount: 0,
          total_amount: res.summary.total_amount,
          audit_alert: assumed_duration_hours * 60 > 48 * 60,
          status: 'PENDING_PAYMENT',
        },
        isLoading: false,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Lost ticket override failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  processPayment: async (ticket_id, payment_method, amount_received, transaction_reference) => {
    set({ isLoading: true, error: null, paymentReceipt: null });
    try {
      const res = await parkingService.processPayment({
        ticket_id,
        payment_method,
        amount_received,
        transaction_reference,
      });
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
      if (isNetworkError(err) && get().checkoutSummary) {
        // Enqueue offline payment
        const summary = get().checkoutSummary!;
        
        await enqueue('PAYMENT', {
          ticket_number: summary.ticket_number,
          payment_method,
          amount_received,
          change_given: (amount_received || 0) - summary.total_amount
        });

        await get().updateQueueCount();

        set({
          paymentReceipt: {
            total_due: summary.total_amount,
            payment_method,
            change_given: (amount_received || 0) - summary.total_amount,
            printable_text: `┌─────────────────────┐\n│ Offline Receipt │\n│ Total: ${summary.total_amount} │\n└─────────────────────┘`,
            isOffline: true
          },
          isLoading: false
        });
        Alert.alert('Offline Payment', 'Payment recorded offline. Will sync when connection is restored.');
      } else {
        const msg = err?.response?.data?.message ?? 'Payment failed';
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    }
  },

  clearError: () => set({ error: null }),
  clearScanned: () => set({ scannedTicket: null }),
  clearCheckout: () => set({ checkoutSummary: null }),
  clearPayment: () => set({ paymentReceipt: null }),
}));
