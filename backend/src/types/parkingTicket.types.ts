export interface IParkingTicket {
  tenantId: any;
  ticketNumber?: string;
  vehiclePlateNumber: string;
  vehicleType: 'BIKE' | 'CAR' | 'TRUCK' | 'SUV' | 'BUS';
  checkInTime: Date;
  checkOutTime?: Date;
  totalCost?: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  gateStaffIn: any;
  gateStaffOut?: any;
  createdAt: Date;
  updatedAt: Date;
  slot_number?: string; // Added as it's now embedded in the ticket
  floor_level?: string; // Added as it's now embedded in the ticket
}
