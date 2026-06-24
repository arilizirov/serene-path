import { prisma } from "@/lib/db";
import type { IntakeStateName, IntakeEngine } from "./types";
import type { IntakeFlowState, IntakeSelection } from "./contract";

/** One stored chat turn. Mental-health content (§11) — kept minimal. */
export type StoredMessage = { role: "user" | "assistant"; content: string };

export type IntakeSessionRow = {
  id: string;
  state: IntakeStateName;
  messages: StoredMessage[];
  /** Scripted-flow phase, stored in `constraints` (null on a fresh session). */
  phase: string | null;
  /** Sticky engine for this session, stored in `constraints` (null = not chosen). */
  engine: IntakeEngine | null;
};

/** Create a fresh anonymous intake session. */
export async function createSession(): Promise<IntakeSessionRow> {
  const s = await prisma.intakeSession.create({
    data: { messages: [], state: "GREETING" },
    select: { id: true, state: true },
  });
  return { id: s.id, state: s.state, messages: [], phase: null, engine: null };
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
    select: { id: true, state: true, messages: true, constraints: true },
  });
  if (!s) return null;
  const constraints =
    (s.constraints as { phase?: string; engine?: IntakeEngine } | null) ?? null;
  return {
    id: s.id,
    state: s.state,
    messages: (s.messages as StoredMessage[] | null) ?? [],
    phase: constraints?.phase ?? null,
    engine: constraints?.engine ?? null,
  };
}

/** Persist the turn's result: full transcript, new state, suggested ids. */
export async function saveSession(
  id: string,
  data: {
    state: IntakeStateName;
    messages: StoredMessage[];
    suggestedTherapistIds: string[];
    phase: string;
    engine: IntakeEngine;
  },
): Promise<void> {
  await prisma.intakeSession.update({
    where: { id },
    data: {
      state: data.state,
      messages: data.messages,
      suggestedTherapistIds: data.suggestedTherapistIds,
      constraints: { phase: data.phase, engine: data.engine },
    },
  });
}

// --- Chip-driven flow (INTAKE_BUILD_SPEC) ------------------------------------
// Same IntakeSession table; the flow state (phase + chip selection + opener) lives
// in `constraints.flow`. Anonymous bearer-token session (same caveat as getSession).

export type FlowSession = {
  id: string;
  messages: StoredMessage[];
  phase: string | null;
  selection: IntakeSelection;
  opener: string;
};

type FlowConstraints = {
  flow?: { phase?: string; selection?: IntakeSelection; opener?: string };
};

export async function createFlowSession(): Promise<FlowSession> {
  const s = await prisma.intakeSession.create({
    data: { messages: [], state: "GREETING" },
    select: { id: true },
  });
  return { id: s.id, messages: [], phase: null, selection: {}, opener: "" };
}

export async function getFlowSession(id: string): Promise<FlowSession | null> {
  const s = await prisma.intakeSession.findUnique({
    where: { id },
    select: { id: true, messages: true, constraints: true },
  });
  if (!s) return null;
  const flow = ((s.constraints as FlowConstraints | null) ?? {}).flow ?? {};
  return {
    id: s.id,
    messages: (s.messages as StoredMessage[] | null) ?? [],
    phase: flow.phase ?? null,
    selection: flow.selection ?? {},
    opener: flow.opener ?? "",
  };
}

export async function saveFlowSession(
  id: string,
  data: {
    state: IntakeFlowState;
    messages: StoredMessage[];
    suggestedTherapistIds: string[];
    phase: string;
    selection: IntakeSelection;
    opener: string;
  },
): Promise<void> {
  await prisma.intakeSession.update({
    where: { id },
    data: {
      state: data.state,
      messages: data.messages,
      suggestedTherapistIds: data.suggestedTherapistIds,
      constraints: { flow: { phase: data.phase, selection: data.selection, opener: data.opener } },
    },
  });
}
