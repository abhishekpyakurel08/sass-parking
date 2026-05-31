const VEHICLE_CODES: Record<string, string> = {
  CAR:   'CR',
  BIKE:  'BK',
  TRUCK: 'TR',
  SUV:   'SV',
  BUS:   'BS',
};

export function generateTicketNumber(vehicleType: string): string {
  const typeCode = VEHICLE_CODES[vehicleType?.toUpperCase()] ?? 'XX';

  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const suffix = String(1000 + (buf[0] % 9000)).padStart(4, '0');

  return `PKT-${typeCode}-${suffix}`;
}
