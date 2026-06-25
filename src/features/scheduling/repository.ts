import { prisma } from "@/lib/db";

/**
 * Already-taken appointment start instants (UTC ISO) for a therapist within a
 * range. Non-cancelled only, so a cancelled appointment's time is offered as
 * bookable again — the Stage-6.2 booking path must revive the cancelled row at
 * that key (the @@unique has no status component, so a plain insert would
 * P2002 on a slot shown as free). See the Appointment model comment.
 */
export async function getBookedSlots(
  therapistId: string,
  fromIso: string,
  toIso: string,
): Promise<string[]> {
  const rows = await prisma.appointment.findMany({
    where: {
      therapistId,
      status: { not: "CANCELLED" },
      startUtc: { gte: new Date(fromIso), lte: new Date(toIso) },
    },
    select: { startUtc: true },
  });
  return rows.map((r) => r.startUtc.toISOString());
}

/** A client's own upcoming appointments, soonest first, with the therapist's
 * display name/title for rendering. Excludes cancelled ones. */
export async function getClientAppointments(userId: string, fromIso: string) {
  return prisma.appointment.findMany({
    where: {
      clientId: userId,
      status: { not: "CANCELLED" },
      startUtc: { gte: new Date(fromIso) },
    },
    orderBy: { startUtc: "asc" },
    select: {
      id: true,
      startUtc: true,
      status: true,
      therapist: { select: { title: true, user: { select: { name: true } } } },
    },
  });
}

/**
 * An appointment the given user is a party to (the CLIENT or the THERAPIST),
 * owner-scoped in the WHERE — no other id is trusted. Excludes cancelled rows.
 * Returns the times + which party the caller is, or null if it isn't theirs.
 * The session-join time-gate is applied by the caller (the sessions feature).
 */
export async function getAppointmentForParty(
  appointmentId: string,
  userId: string,
) {
  const a = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      status: { not: "CANCELLED" },
      OR: [{ clientId: userId }, { therapist: { userId } }],
    },
    select: { id: true, startUtc: true, endUtc: true, clientId: true },
  });
  if (!a) return null;
  return {
    id: a.id,
    startIso: a.startUtc.toISOString(),
    endIso: a.endUtc.toISOString(),
    party: a.clientId === userId ? ("CLIENT" as const) : ("THERAPIST" as const),
  };
}

/**
 * Cancel an appointment the user owns. Owner-scoped in the WHERE clause — the row
 * must belong to the caller as the CLIENT or as the THERAPIST (no other id is
 * trusted), be still-active, and (policy) start in the future. Returns the number
 * of rows changed: 1 = cancelled, 0 = not yours / already over / already cancelled.
 * Setting CANCELLED frees the slot — getBookedSlots ignores it and bookSlot revives
 * it on the next booking.
 */
export async function cancelOwnAppointment(
  appointmentId: string,
  userId: string,
  nowIso: string,
): Promise<number> {
  const res = await prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      status: { notIn: ["CANCELLED", "COMPLETED"] },
      startUtc: { gt: new Date(nowIso) },
      OR: [{ clientId: userId }, { therapist: { userId } }],
    },
    data: { status: "CANCELLED" },
  });
  return res.count;
}

// --- Admin appointment management (read + admin-scoped writes) ---------------
// These are NOT owner-scoped: an ADMIN operates over every appointment. The
// requireRole("ADMIN") check is enforced at the action boundary (actions.ts);
// the repository just runs the query. Kept distinct from the owner-scoped
// cancelOwnAppointment, which trusts only the session user's own rows.

import type { AppointmentStatus } from "@/generated/prisma/enums";

/** Filters for the admin appointments table — all optional, AND-combined. */
export type AdminAppointmentFilters = {
  status?: AppointmentStatus;
  therapistId?: string;
  from?: string; // inclusive lower bound on startUtc (UTC ISO)
  to?: string; // inclusive upper bound on startUtc (UTC ISO)
};

/**
 * Every appointment (any status), newest-first, joined to therapist + client
 * display names. Admin-only read — the WHERE narrows by the optional filters
 * only, never by an owner. Returns minimal columns for the table.
 */
export async function listAllAppointments(filters: AdminAppointmentFilters = {}) {
  const startUtc =
    filters.from || filters.to
      ? {
          ...(filters.from ? { gte: new Date(filters.from) } : {}),
          ...(filters.to ? { lte: new Date(filters.to) } : {}),
        }
      : undefined;
  return prisma.appointment.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.therapistId ? { therapistId: filters.therapistId } : {}),
      ...(startUtc ? { startUtc } : {}),
    },
    orderBy: { startUtc: "desc" },
    select: {
      id: true,
      startUtc: true,
      endUtc: true,
      status: true,
      therapistId: true,
      therapist: { select: { title: true, user: { select: { name: true } } } },
      client: { select: { name: true, email: true } },
    },
  });
}

/** Count of all appointments (any status) — for the admin dashboard. */
export function countAppointments(): Promise<number> {
  return prisma.appointment.count();
}

/** Appointment counts grouped by status — for the stats page (no full load). */
export function appointmentCountsByStatus() {
  return prisma.appointment.groupBy({ by: ["status"], _count: { _all: true } });
}

/**
 * Admin-scoped status change for any appointment by id (e.g. CANCELLED /
 * NO_SHOW). NOT owner-scoped — the admin acts over all rows, so the only gate is
 * the requireRole("ADMIN") in the action. updateMany returns the affected count
 * (0 = no such id). Distinct from cancelOwnAppointment which is session-scoped.
 */
export async function adminSetAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<number> {
  const res = await prisma.appointment.updateMany({
    where: { id: appointmentId },
    data: { status },
  });
  return res.count;
}

function isP2002(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
}

/**
 * Book a slot atomically. Revives a CANCELLED appointment at (therapistId,
 * startUtc) if one exists (the @@unique key still occupies it); otherwise
 * inserts a fresh PENDING one. The unique constraint serializes concurrent
 * bookings of a free slot — the loser gets P2002 → "taken". An UPDATE scoped to
 * status=CANCELLED never overwrites an ACTIVE appointment.
 */
export async function bookSlot(
  therapistId: string,
  clientId: string,
  startUtc: Date,
  endUtc: Date,
): Promise<"booked" | "taken"> {
  const revived = await prisma.appointment.updateMany({
    where: { therapistId, startUtc, status: "CANCELLED" },
    data: { clientId, status: "PENDING", endUtc },
  });
  if (revived.count > 0) return "booked";

  try {
    await prisma.appointment.create({
      data: { therapistId, clientId, startUtc, endUtc, status: "PENDING" },
    });
    return "booked";
  } catch (e) {
    if (isP2002(e)) return "taken";
    throw e;
  }
}
