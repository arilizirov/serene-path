// Pure date helpers for availability exceptions (blocked dates). An exception
// is a whole-day block stored as a Prisma @db.Date; the UI speaks YYYY-MM-DD.
// Times are date-only here (no timezone): a blocked day is the same calendar
// day everywhere, so we anchor it at UTC midnight for stable storage.

/** True iff `s` is a real calendar date in strict YYYY-MM-DD form. */
export function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  // Reject overflow (e.g. 2026-02-30 rolls into March).
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Parse a YYYY-MM-DD string to a UTC-midnight Date for @db.Date storage.
 *  Precondition: caller must pre-validate with isIsoDate — malformed input
 *  yields an Invalid Date here, not a thrown error. */
export function isoToUtcDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Format a stored @db.Date back to YYYY-MM-DD. */
export function utcDateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}
