import { Types } from 'mongoose';
import { VehicleType, SpaceStatus } from './enums.js';

export interface IParkingSpace {
  tenant_id: Types.ObjectId;
  floor_level: string;
  space_number: string;
  vehicle_type: VehicleType;
  status: SpaceStatus;
}
