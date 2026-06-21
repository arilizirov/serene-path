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
