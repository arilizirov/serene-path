import { getSchedulingContext, getBlockedDates } from "@/features/therapists";
import { computeNextAvailable } from "./next-available";
import { generateSlots } from "./generate-slots";
import {
  getBookedSlots,
  bookSlot,
  getClientAppointments,
  cancelOwnAppointment,
} from "./repository";

/** Session length in minutes — one fixed duration for v1 (§9). */
const SESSION_MINUTES = 60;

/**
 * The next available slot start for a therapist, at or after `fromIso`, as a
 * UTC ISO-8601 string. Null if the therapist has no rules (or doesn't exist).
 *
 * This is the only sanctioned source of a proposed appointment time: callers
 * (e.g. intake matching) resolve real slots here rather than letting the model
 * invent them (APP_SPEC §5).
 */
export async function getNextAvailable(
  therapistId: string,
  fromIso: string,
): Promise<string | null> {
  const ctx = await getSchedulingContext(therapistId);
  if (!ctx) return null;
  return computeNextAvailable(ctx.rules, ctx.timezone, fromIso);
}

/**
 * The real bookable slots for a therapist in [fromIso, toIso]: weekly rules
 * expanded, MINUS blocked dates, MINUS already-booked appointments. Returns
 * UTC ISO instants, sorted. Empty if the therapist has no rules/doesn't exist.
 */
export async function getBookableSlots(
  therapistId: string,
  fromIso: string,
  toIso: string,
): Promise<string[]> {
  const ctx = await getSchedulingContext(therapistId);
  if (!ctx) return [];
  const blocked = (await getBlockedDates(therapistId)).map((b) => b.date);
  const booked = await getBookedSlots(therapistId, fromIso, toIso);
  return generateSlots(
    ctx.rules,
    blocked,
    booked,
    ctx.timezone,
    fromIso,
    toIso,
    SESSION_MINUTES,
  );
}

export type BookingResult = { ok: true } | { ok: false; error: string };

// Must be >= the profile page's calendar window (14d) so every displayed slot
// re-validates. Bookings slightly beyond the displayed window are still honored.
const BOOKING_HORIZON_DAYS = 60;

/**
 * Book a slot for a client. Re-validates the slot is actually bookable RIGHT
 * NOW (never trusts a client-supplied startUtc — rejects past/unavailable
 * times), derives endUtc from the same SESSION_MINUTES the slots use, then books
 * atomically (revive-or-insert). Returns {ok} or a reason.
 */
export async function createBooking(
  therapistId: string,
  clientId: string,
  startIso: string,
): Promise<BookingResult> {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Invalid time." };
  const normalized = start.toISOString();

  const now = new Date().toISOString();
  const horizon = new Date(
    Date.now() + BOOKING_HORIZON_DAYS * 86_400_000,
  ).toISOString();
  const bookable = await getBookableSlots(therapistId, now, horizon);
  if (!bookable.includes(normalized)) {
    return { ok: false, error: "That time isn't available." };
  }

  const endUtc = new Date(start.getTime() + SESSION_MINUTES * 60_000);
  const outcome = await bookSlot(therapistId, clientId, start, endUtc);
  return outcome === "booked"
    ? { ok: true }
    : { ok: false, error: "That slot was just taken." };
}

/** One of a client's upcoming appointments, shaped for the page. */
export type MyAppointment = {
  id: string;
  startIso: string;
  status: string;
  therapistName: string;
  therapistTitle: string;
};

/** A client's own upcoming appointments (UTC instants), soonest first. */
export async function getMyAppointments(userId: string): Promise<MyAppointment[]> {
  const rows = await getClientAppointments(userId, new Date().toISOString());
  return rows.map((r) => ({
    id: r.id,
    startIso: r.startUtc.toISOString(),
    status: r.status,
    therapistName: r.therapist.user.name ?? "",
    therapistTitle: r.therapist.title,
  }));
}

/**
 * Cancel one of the caller's own appointments. Ownership + the future-only policy
 * are enforced atomically in the repository's scoped UPDATE — a client can only
 * cancel their own (or a therapist their own) upcoming session. Returns whether a
 * row was actually cancelled (false = not yours / already over / already cancelled).
 */
export async function cancelAppointment(
  appointmentId: string,
  userId: string,
): Promise<boolean> {
  const count = await cancelOwnAppointment(
    appointmentId,
    userId,
    new Date().toISOString(),
  );
  return count > 0;
}
