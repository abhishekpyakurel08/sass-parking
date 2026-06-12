import { api } from './api';

export type VehicleType = 'CAR' | 'BIKE' | 'TRUCK' | 'SUV' | 'BUS';
export type PaymentMethod = 'CASH' | 'CARD' | 'ESEWA' | 'KHALTI' | 'IMEPAY' | 'CONNECTIPS' | 'WALLET';

export interface CheckInData {
  license_plate?: string;
  vehicle_type: VehicleType;
  customer_code?: string;
  notes?: string;
}

export interface CheckOutData {
  ticket_id: string;
}

export interface LostTicketData {
  license_plate: string;
  vehicle_type: VehicleType;
  assumed_duration_hours: number;
}

export interface PaymentData {
  ticket_id: string;
  amount_received: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
}

export interface Ticket {
  _id?: string;
  ticket_number?: string;
  license_plate?: string;
  vehicle_type?: VehicleType;
  check_in_time?: string;
  check_out_time?: string;
  fare_amount?: number;
  penalty_amount?: number;
  discount_amount?: number;
  status?: 'ACTIVE' | 'PENDING_PAYMENT' | 'PAID';
  payment_method?: PaymentMethod;
  amount_received?: number;
  change_given?: number;
  transaction_reference?: string;
  notes?: string;
  // Alternative field names for backend compatibility
  vehicleType?: VehicleType;
  vehiclePlateNumber?: string;
  checkInTime?: string;
  checkOutTime?: string;
  fareAmount?: number;
  penaltyAmount?: number;
  discountAmount?: number;
  paymentStatus?: string;
  paymentMethod?: PaymentMethod;
}

export const parkingService = {
  async checkIn(data: CheckInData) {
    const response = await api.post('/parking/check-in', data);
    return response;
  },

  async checkOut(data: CheckOutData) {
    const response = await api.post('/parking/check-out', data);
    return response;
  },

  async handleLostTicket(data: LostTicketData) {
    const response = await api.post('/parking/lost-ticket', data);
    return response;
  },

  async processPayment(data: PaymentData) {
    const response = await api.post('/parking/process-payment', data);
    return response;
  },

  async scanTicket(qrCode: string) {
    // Trim the code to avoid any accidental whitespace like trailing spaces or commas
    const cleanedCode = qrCode.trim().replace(/,$/, '');
    const response = await api.post('/parking/scan', { code: cleanedCode });
    return response;
  },

  async getTickets(page = 1, limit = 20, status?: string, customerId?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);
    if (customerId) params.append('customer_id', customerId);
    
    const response = await api.get(`/parking/tickets?${params}`);
    return response.data;
  },

  async exportReport(filter = 'all') {
    const response = await api.get(`/parking/export?filter=${filter}`);
    return response;
  },

  async getReceipt(ticketId: string) {
    const response = await api.get(`/parking/${ticketId}/receipt`);
    return response;
  },
};
