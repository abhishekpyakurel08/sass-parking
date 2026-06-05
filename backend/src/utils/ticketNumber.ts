import { randomBytes } from 'crypto'; // added import

const VEHICLE_CODES: Record<string, string> = {
  CAR:   'CR',
  BIKE:  'BK',
  TRUCK: 'TR',
  SUV:   'SV',
  BUS:   'BS',
};

export function generateTicketNumber(vehicleType: string): string {
  const typeCode = VEHICLE_CODES[vehicleType?.toUpperCase()] ?? 'XX';

  // generate a 16-bit random number and map to 1000-9999
  const rand = randomBytes(2).readUInt16BE(0);
  const suffix = String(1000 + (rand % 9000)).padStart(4, '0');

  return `PKT-${typeCode}-${suffix}`;
}
