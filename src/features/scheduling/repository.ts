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
