import { sendMessageSchema, type SendMessageInput } from "./schema";
import * as repo from "./repository";

// Therapist↔client messaging service. EVERY entry point is owner-scoped to the
// caller's session id (passed by the route from getCurrentUser — never from the
// body) and gated by `shareAppointment`: a pair may only message if they share a
// booking. Returns plain DTOs (ISO strings, fromMe flag) the UI renders directly.

export type ThreadMessageDto = {
  id: string;
  fromMe: boolean;
  body: string;
  createdAtIso: string;
};

export type ConversationDto = {
  otherId: string;
  name: string;
  lastMessage: string;
  lastAtIso: string;
  unread: number;
};

export type SendResult =
  | { ok: true; message: ThreadMessageDto }
  | { ok: false; error: "invalid" | "self" | "not_allowed" };

export type ThreadResult =
  | { ok: true; messages: ThreadMessageDto[] }
  | { ok: false; error: "self" | "not_allowed" };

/** Send a message as `senderId`. Validates the body, blocks self-messaging, and
 *  requires a shared appointment with the recipient before any write. */
export async function sendMessage(senderId: string, input: SendMessageInput): Promise<SendResult> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { recipientId, body } = parsed.data;
  if (recipientId === senderId) return { ok: false, error: "self" };
  if (!(await repo.shareAppointment(senderId, recipientId))) {
    return { ok: false, error: "not_allowed" };
  }
  const m = await repo.insertMessage(senderId, recipientId, body);
  return {
    ok: true,
    message: { id: m.id, fromMe: true, body: m.body, createdAtIso: m.createdAt.toISOString() },
  };
}

/** Fetch the thread between `userId` and `otherId` (gated), oldest-first, and
 *  mark the incoming messages read. `sinceIso` returns only newer rows (polling). */
export async function getThread(
  userId: string,
  otherId: string,
  sinceIso?: string,
): Promise<ThreadResult> {
  if (otherId === userId) return { ok: false, error: "self" };
  if (!(await repo.shareAppointment(userId, otherId))) {
    return { ok: false, error: "not_allowed" };
  }
  const rows = await repo.listMessagesBetween(userId, otherId, sinceIso);
  await repo.markThreadRead(userId, otherId);
  return {
    ok: true,
    messages: rows.map((r) => ({
      id: r.id,
      fromMe: r.senderId === userId,
      body: r.body,
      createdAtIso: r.createdAt.toISOString(),
    })),
  };
}

/** The user's conversation list: one row per other party (newest message wins),
 *  with the other party's name + unread count, newest-first. */
export async function getThreads(userId: string): Promise<ConversationDto[]> {
  const [rows, unread] = await Promise.all([
    repo.recentMessagesFor(userId),
    repo.unreadCountsBySender(userId),
  ]);
  const unreadMap = new Map(unread.map((u) => [u.senderId, u._count._all]));
  const seen = new Set<string>();
  const out: ConversationDto[] = [];
  for (const r of rows) {
    const otherId = r.senderId === userId ? r.recipientId : r.senderId;
    if (seen.has(otherId)) continue;
    seen.add(otherId);
    const name = (r.senderId === userId ? r.recipient.name : r.sender.name) ?? "Client";
    out.push({
      otherId,
      name,
      lastMessage: r.body,
      lastAtIso: r.createdAt.toISOString(),
      unread: unreadMap.get(otherId) ?? 0,
    });
  }
  return out;
}
