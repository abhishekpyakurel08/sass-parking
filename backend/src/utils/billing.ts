/**
 * ──────────────────────────────────────────────────────────────────────────────
 * ParkSaaS Billing Engine  — Billing Rule v1
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Vehicle Rates (configurable per tenant via HourlyRate model):
 *   2-Wheeler : NPR 40 / hr
 *   4-Wheeler : NPR 80 / hr
 *
 * Grace Period (First 15 minutes):
 *   duration ≤ 15 min  →  NPR 0  (FREE)
 *
 * First Hour Rule:
 *   15 min < duration ≤ 60 min  →  Full hourly rate (40 / 80)
 *
 * Additional Hours Rule (for every hour block after the first):
 *   remaining ≤ 30 min  →  Half rate  (20 / 40)
 *   remaining  > 30 min  →  Full rate  (40 / 80)
 *
 * Special Cases:
 *   24h+   → No cap; accumulate hourly rates indefinitely
 *   72h+   → Daily cumulative: (rate * 24) * days
 *   Overstay (> 48h) → flag audit_alert = true
 *   Lost ticket      → flat NPR 200 penalty (configurable via lost_ticket_penalty)
 *   Monthly pass     → waive all charges (future)
 * ──────────────────────────────────────────────────────────────────────────────
 */

export interface BillingResult {
  /** Gross fare before any discount (NPR) */
  base_fare: number;
  /** Itemised breakdown for receipt */
  breakdown: BillingLineItem[];
  /** Whether a supervisor audit alert should be raised (overstay > 48 h) */
  audit_alert: boolean;
  /** Duration string for display, e.g. "2h 10m" */
  duration_display: string;
  /** Total chargeable minutes (after grace period deducted) */
  chargeable_minutes: number;
}

export interface BillingLineItem {
  label: string;   // e.g. "Hour 1", "Hour 2 (half)"
  amount: number;  // NPR
}

const GRACE_PERIOD_MINUTES = 15;
const OVERSTAY_THRESHOLD_MINUTES = 48 * 60; // 48 hours

/**
 * Calculate the parking fare given the actual duration and the hourly rate.
 *
 * @param durationMinutes  Actual parking duration in minutes (float OK)
 * @param ratePerHour      Configured hourly rate for this vehicle type (NPR)
 */
export function calculateFare(
  durationMinutes: number,
  ratePerHour: number,
): BillingResult {
  const halfRate = ratePerHour / 2;
  const breakdown: BillingLineItem[] = [];

  // ── Duration display ────────────────────────────────────────────────────────
  const totalMins = Math.floor(durationMinutes);
  const dispH = Math.floor(totalMins / 60);
  const dispM = totalMins % 60;
  const duration_display = dispH > 0 ? `${dispH}h ${dispM}m` : `${dispM}m`;

  // ── Overstay alert ──────────────────────────────────────────────────────────
  const audit_alert = durationMinutes > OVERSTAY_THRESHOLD_MINUTES;

  // ── Grace period ────────────────────────────────────────────────────────────
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

  // ── First hour (15 min < duration ≤ 60 min) ─────────────────────────────────
  let remaining = durationMinutes;
  let base_fare = 0;

  // Charge first full hour (even if duration is between 15–60 min)
  breakdown.push({ label: 'Hour 1', amount: ratePerHour });
  base_fare += ratePerHour;
  remaining -= 60;

  // ── Additional hour blocks ──────────────────────────────────────────────────
  let hourBlock = 2;
  while (remaining > 0) {
    const blockMins = Math.min(remaining, 60);

    if (blockMins <= 30) {
      // ≤ 30 min remaining in this block → half rate
      breakdown.push({ label: `Hour ${hourBlock} (≤30 min — half)`, amount: halfRate });
      base_fare += halfRate;
    } else {
      // > 30 min remaining → full rate
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
