export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_OWNER = 'TENANT_OWNER',
  GATE_STAFF = 'GATE_STAFF',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum VehicleType {
  CAR = 'CAR',
  BIKE = 'BIKE',
  TRUCK = 'TRUCK',
  SUV = 'SUV',
  BUS = 'BUS',
}

export enum TicketStatus {
  ACTIVE = 'ACTIVE',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
}

export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  ESEWA = 'ESEWA',
  KHALTI = 'KHALTI',
  IMEPAY = 'IMEPAY',
  CONNECTIPS = 'CONNECTIPS',
  WALLET = 'WALLET',
}
