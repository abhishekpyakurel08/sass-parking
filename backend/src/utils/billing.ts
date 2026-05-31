export interface BillingResult {
  base_fare: number;
  breakdown: BillingLineItem[];
  audit_alert: boolean;
  duration_display: string;
  chargeable_minutes: number;
}

export interface BillingLineItem {
  label: string;
  amount: number;
}

const GRACE_PERIOD_MINUTES = 15;
const OVERSTAY_THRESHOLD_MINUTES = 48 * 60;

export function calculateFare(
  durationMinutes: number,
  ratePerHour: number,
): BillingResult {
  const halfRate = ratePerHour / 2;
  const breakdown: BillingLineItem[] = [];

  const totalMins = Math.floor(durationMinutes);
  const dispH = Math.floor(totalMins / 60);
  const dispM = totalMins % 60;
  const duration_display = dispH > 0 ? `${dispH}h ${dispM}m` : `${dispM}m`;

  const audit_alert = durationMinutes > OVERSTAY_THRESHOLD_MINUTES;

  if (durationMinutes <= GRACE_PERIOD_MINUTES) {
    breakdown.push({ label: 'Grace period (FREE)', amount: 0 });
    return {
      base_fare: 0,
      breakdown,
      audit_alert,
      duration_display,
      chargeable_minutes: 0,
    };
  }

  let remaining = durationMinutes;
  let base_fare = 0;

  breakdown.push({ label: 'Hour 1', amount: ratePerHour });
  base_fare += ratePerHour;
  remaining -= 60;

  let hourBlock = 2;
  while (remaining > 0) {
    const blockMins = Math.min(remaining, 60);

    if (blockMins <= 30) {
      breakdown.push({ label: `Hour ${hourBlock} (≤30 min — half)`, amount: halfRate });
      base_fare += halfRate;
    } else {
      breakdown.push({ label: `Hour ${hourBlock}`, amount: ratePerHour });
      base_fare += ratePerHour;
    }

    remaining -= 60;
    hourBlock++;
  }

  return {
    base_fare,
    breakdown,
    audit_alert,
    duration_display,
    chargeable_minutes: durationMinutes,
  };
}
