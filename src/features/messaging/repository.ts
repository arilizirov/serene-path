import { prisma } from "@/lib/db";

// Messaging DB access. A thread is the unordered (sender, recipient) USER pair.
// Eligibility (a shared appointment) is checked here too — querying Appointment
// directly via the shared Prisma client (no cross-feature import needed). All
// reads/writes are scoped by the caller's own id in the WHERE (no trusted ids).

/** True if userA and userB are a therapist+client who share at least one
 *  appointment (any status) — the gate that lets a pair message at all. */
export async function shareAppointment(userA: string, userB: string): Promise<boolean> {
  const a = await prisma.appointment.findFirst({
    where: {
      OR: [
        { clientId: userA, therapist: { userId: userB } },
        { clientId: userB, therapist: { userId: userA } },
      ],
    },
    select: { id: true },
  });
  return a !== null;
}

/** Insert a message; returns the created row's minimal shape. */
export async function insertMessage(senderId: string, recipientId: string, body: string) {
  return prisma.message.create({
    data: { senderId, recipientId, body },
    select: { id: true, senderId: true, body: true, createdAt: true },
  });
}

/** All messages between two users, oldest-first; optional `sinceIso` returns only
 *  newer rows (for incremental polling). */
export async function listMessagesBetween(userA: string, userB: string, sinceIso?: string) {
  return prisma.message.findMany({
    where: {
      OR: [
        { senderId: userA, recipientId: userB },
        { senderId: userB, recipientId: userA },
      ],
      ...(sinceIso ? { createdAt: { gt: new Date(sinceIso) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, senderId: true, body: true, createdAt: true },
  });
}

/** Mark every unread message FROM `otherId` TO `userId` as read. Returns the
 *  count changed (0 when already read — cheap to call on each poll). */
export async function markThreadRead(userId: string, otherId: string): Promise<number> {
  const res = await prisma.message.updateMany({
    where: { recipientId: userId, senderId: otherId, readAt: null },
    data: { readAt: new Date() },
  });
  return res.count;
}

/** The user's most-recent messages (either direction) with both party names —
 *  the service derives the per-thread list from these (newest occurrence wins). */
export async function recentMessagesFor(userId: string, take = 120) {
  return prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }] },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      senderId: true,
      recipientId: true,
      body: true,
      createdAt: true,
      sender: { select: { name: true } },
      recipient: { select: { name: true } },
    },
  });
}

/** Unread counts grouped by the sender (the other party) — for thread badges. */
export async function unreadCountsBySender(userId: string) {
  return prisma.message.groupBy({
    by: ["senderId"],
    where: { recipientId: userId, readAt: null },
    _count: { _all: true },
  });
}
