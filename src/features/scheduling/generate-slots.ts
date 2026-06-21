import { DateTime } from "luxon";

/** A weekly availability window: `weekday` 0=Sun..6=Sat, `start`/`end` "HH:MM"
 *  in the therapist's local timezone. */
export type SlotRule = { weekday: number; start: string; end: string };

/**
 * Expand weekly rules into discrete, bookable UTC slot starts over [fromIso,
 * toIso], MINUS blocked dates and already-booked instants. Pure (APP_SPEC §9):
 *
 *  - slots are `slotMinutes` long and must fit fully inside their window;
 *  - a slot on a `blockedDates` (YYYY-MM-DD, therapist-local) day is dropped;
 *  - a slot whose UTC instant is in `bookedUtc` is dropped;
 *  - past slots (before `fromIso`) are dropped;
 *  - overlapping rules are de-duplicated; the result is sorted ascending.
 */
export function generateSlots(
  rules: SlotRule[],
  blockedDates: string[],
  bookedUtc: string[],
  timezone: string,
  fromIso: string,
  toIso: string,
  slotMinutes: number,
): string[] {
  const from = DateTime.fromISO(fromIso, { zone: "utc" });
  const to = DateTime.fromISO(toIso, { zone: "utc" });
  if (!from.isValid || !to.isValid || slotMinutes <= 0) return [];

  const blocked = new Set(blockedDates);
  const booked = new Set(
    bookedUtc
      .map((b) => DateTime.fromISO(b, { zone: "utc" }).toUTC().toISO())
      .filter((iso): iso is string => iso !== null),
  );
  const out = new Set<string>();

  // Walk each local calendar day in the range.
  let day = from.setZone(timezone).startOf("day");
  const lastDay = to.setZone(timezone).endOf("day");
  while (day.isValid && day <= lastDay) {
    const dateStr = day.toFormat("yyyy-MM-dd");
    if (!blocked.has(dateStr)) {
      for (const rule of rules) {
        // luxon weekday: 1=Mon..7=Sun; ours: 0=Sun..6=Sat → Sunday maps to 7.
        const ruleWeekday = rule.weekday === 0 ? 7 : rule.weekday;
        if (ruleWeekday !== day.weekday) continue;

        const [sh, sm] = rule.start.split(":").map(Number);
        const [eh, em] = rule.end.split(":").map(Number);
        if ([sh, sm, eh, em].some((n) => !Number.isInteger(n))) continue;

        const windowEnd = day.set({ hour: eh, minute: em, second: 0, millisecond: 0 });
        let slot = day.set({ hour: sh, minute: sm, second: 0, millisecond: 0 });
        while (slot.plus({ minutes: slotMinutes }) <= windowEnd) {
          const utc = slot.toUTC();
          const iso = utc.toISO();
          if (iso && utc >= from && utc <= to && !booked.has(iso)) {
            out.add(iso);
          }
          slot = slot.plus({ minutes: slotMinutes });
        }
      }
    }
    day = day.plus({ days: 1 });
  }

  return [...out].sort();
}
