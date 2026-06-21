import { prisma } from "@/lib/db";
import type { IntakeStateName } from "./types";

/** One stored chat turn. Mental-health content (§11) — kept minimal. */
export type StoredMessage = { role: "user" | "assistant"; content: string };

export type IntakeSessionRow = {
  id: string;
  state: IntakeStateName;
  messages: StoredMessage[];
};

/** Create a fresh anonymous intake session. */
export async function createSession(): Promise<IntakeSessionRow> {
  const s = await prisma.intakeSession.create({
    data: { messages: [], state: "GREETING" },
    select: { id: true, state: true },
  });
  return { id: s.id, state: s.state, messages: [] };
}

/**
 * Load a session by id (anonymous, resumable), or null.
 *
 * SECURITY (read before wiring login-linking, F1.5): today every IntakeSession is
 * anonymous (`userId` is never set), so the high-entropy cuid is a bearer token —
 * acceptable for anonymous intake. The schema has `userId` for "linked on login";
 * the moment a session is linked, resume MUST be owner-scoped (add `where: {userId}`
 * for linked sessions), or anyone holding the cuid could read a logged-in user's
 * private mental-health transcript (§11 IDOR). Do not skip that when F1.5 lands.
 */
export async function getSession(id: string): Promise<IntakeSessionRow | null> {
  const s = await prisma.intakeSession.findUnique({
    where: { id },
    select: { id: true, state: true, messages: true },
  });
  if (!s) return null;
  return {
    id: s.id,
    state: s.state,
    messages: (s.messages as StoredMessage[] | null) ?? [],
  };
}

/** Persist the turn's result: full transcript, new state, suggested ids. */
export async function saveSession(
  id: string,
  data: {
    state: IntakeStateName;
    messages: StoredMessage[];
    suggestedTherapistIds: string[];
  },
): Promise<void> {
  await prisma.intakeSession.update({
    where: { id },
    data: {
      state: data.state,
      messages: data.messages,
      suggestedTherapistIds: data.suggestedTherapistIds,
    },
  });
}
