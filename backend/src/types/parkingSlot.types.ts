export interface IParkingSlot {
  tenantId: any;
  slotNumber: string;
  floor: string;
  vehicleType: 'BIKE' | 'CAR' | 'TRUCK';
  status: 'FREE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  createdAt: Date;
  updatedAt: Date;
}
