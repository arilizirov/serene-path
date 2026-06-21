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
