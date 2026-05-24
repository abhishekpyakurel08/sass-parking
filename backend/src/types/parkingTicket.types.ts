export interface IParkingTicket {
  tenantId: any;
  slotId: any;
  ticketNumber?: string;
  vehiclePlateNumber: string;
  vehicleType: 'BIKE' | 'CAR' | 'TRUCK';
  checkInTime: Date;
  checkOutTime?: Date;
  totalCost?: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  gateStaffIn: any;
  gateStaffOut?: any;
  createdAt: Date;
  updatedAt: Date;
}
