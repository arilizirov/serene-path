import { DateTime } from "luxon";

/**
 * A weekly availability rule: a recurring window on `weekday` (0=Sun..6=Sat),
 * with `start`/`end` as "HH:MM" in the therapist's local timezone.
 */
export type WeeklySlot = { weekday: number; start: string; end: string };

/**
 * The next slot start at or after `fromIso`, given weekly `rules` interpreted
 * in `timezone` (an IANA zone, e.g. "Asia/Jerusalem"). Returns a UTC ISO-8601
 * string, or null if there are no usable rules.
 *
 * Read-only: rules are expanded forward from `fromIso`; blocked-date exceptions
 * and already-booked appointments are not yet subtracted — that lands with
 * transactional booking (Stage 6). The model never invents times; this is the
 * single source of a proposed slot (APP_SPEC §5, §9).
 */
export function computeNextAvailable(
  rules: WeeklySlot[],
  timezone: string,
  fromIso: string,
): string | null {
  const from = DateTime.fromISO(fromIso, { zone: "utc" });
  if (!from.isValid) return null;
  const fromLocal = from.setZone(timezone);
  if (!fromLocal.isValid) return null;

  let best: DateTime | null = null;
  for (const rule of rules) {
    const next = nextOccurrence(rule, fromLocal);
    if (next && (best === null || next < best)) best = next;
  }
  return best ? best.toUTC().toISO() : null;
}

/**
 * The next datetime matching `rule` (its weekday + start time) at or after
 * `fromLocal`, expressed in fromLocal's zone.
 */
function nextOccurrence(rule: WeeklySlot, fromLocal: DateTime): DateTime | null {
  const [h, m] = rule.start.split(":").map(Number);
  if (!Number.isInteger(h) || !Number.isInteger(m)) return null;
  // luxon weekday: 1=Mon..7=Sun; ours: 0=Sun..6=Sat → Sunday maps to 7.
  const targetWeekday = rule.weekday === 0 ? 7 : rule.weekday;
  const deltaDays = (targetWeekday - fromLocal.weekday + 7) % 7;
  let candidate = fromLocal
    .plus({ days: deltaDays })
    .set({ hour: h, minute: m, second: 0, millisecond: 0 });
  // Same-weekday match whose time already passed today → jump a week.
  if (candidate < fromLocal) candidate = candidate.plus({ days: 7 });
  return candidate;
}
