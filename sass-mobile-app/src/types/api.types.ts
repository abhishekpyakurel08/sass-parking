// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    access_token: string;
    expires_in: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      tenant_id: string;
      gate_assignment?: 'ENTRY' | 'EXIT' | 'BOTH';
      ticket_prefix?: string;
    };
  };
}

// ── Parking ───────────────────────────────────────────────────────────────────
export type VehicleType = 'CAR' | 'BIKE' | 'TRUCK' | 'SUV' | 'BUS' | 'VAN';
export type TicketStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'PAID' | 'EXPIRED' | 'LOST';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';

/** One line item from the billing engine breakdown */
export interface BillingLineItem {
  label: string;   // e.g. "Hour 1", "Hour 2 (≤30 min — half)"
  amount: number;  // NPR
}

export interface CheckInPayload {
  license_plate?: string;
  vehicle_type: VehicleType;
  customer_code?: string;
}

export interface CheckInResponse {
  success: boolean;
  ticket: {
    ticket_id: string;
    ticket_number: string;
    license_plate: string;
    vehicle_type: VehicleType;
    check_in_time: string;
    qr_code_url: string;
    customer_name?: string;
  };
  receipt: {
    business_name: string;
    ticket_number: string;
    license_plate: string;
    vehicle_type: string;
    entry_time: string;
    qr_code_url: string;
    printable_text: string;
  };
}

export interface ScanPayload {
  code: string; // ticket_number UUID or license_plate
}

export interface ScanResponse {
  success: boolean;
  ticket: {
    ticket_id: string;
    ticket_number: string;
    license_plate: string;
    vehicle_type: VehicleType;
    check_in_time: string;
    check_out_time?: string;
    fare_amount: number;
    penalty_amount: number;
    discount_amount: number;
    status: TicketStatus;
    payment_method?: string;
    amount_received?: number;
    change_given?: number;
    qr_code_url?: string;
    customer_details?: {
      name: string;
      customer_code: string;
      discount_percentage: number;
    };
  };
}

export interface CheckOutPayload {
  ticket_id: string; // ticket ObjectId or ticket_number UUID
}

export interface CheckOutResponse {
  success: boolean;
  summary: {
    ticket_id: string;
    ticket_number: string;
    license_plate: string;
    vehicle_type: VehicleType;
    check_in_time: string;
    check_out_time: string;
    duration_minutes: number;
    duration_display: string;          // e.g. "2h 10m"
    rate_per_hour: number;
    breakdown: BillingLineItem[];      // itemised fare lines
    subtotal: number;                  // gross before discount
    discount: number;
    total_amount: number;              // net payable
    audit_alert: boolean;             // true if overstay > 48h
    status: TicketStatus;
  };
}

export interface LostTicketPayload {
  vehicle_type: VehicleType;
  license_plate: string;
  assumed_duration_hours: number;
}

export interface LostTicketResponse {
  success: boolean;
  summary: {
    ticket_id: string;
    ticket_number: string;
    license_plate: string;
    vehicle_type: VehicleType;
    assumed_duration_hours: number;
    base_amount: number;
    lost_ticket_penalty: number;
    total_amount: number;
  };
}

export interface ProcessPaymentPayload {
  ticket_id: string;
  payment_method: PaymentMethod;
  amount_received?: number;
  transaction_reference?: string;
}

export interface ProcessPaymentResponse {
  success: boolean;
  message: string;
  receipt: {
    ticket_id: string;
    ticket_number: string;
    total_due: number;
    payment_method: string;
    amount_received?: number;
    change_given?: number;
    printable_text: string;
  };
}

export interface Ticket {
  _id: string;
  ticket_number: string;
  license_plate: string;
  vehicle_type: VehicleType;
  check_in_time: string;
  check_out_time?: string;
  fare_amount: number;
  penalty_amount: number;
  discount_amount: number;
  status: TicketStatus;
  payment_method?: string;
  amount_received?: number;
  change_given?: number;
  createdAt: string;
  customer_id?: {
    name: string;
    customer_code: string;
    discount_percentage: number;
  };
}

export interface TicketsResponse {
  success: boolean;
  data: Ticket[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export interface DailyStats {
  success: boolean;
  data: {
    date: string;
    totalVehicles: number;
    completedSessions: number;
    totalRevenue: number;
  };
}
