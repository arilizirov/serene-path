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
  // Owner-scoped: only ANONYMOUS sessions are resumable via the bearer cuid. Once a
  // session is linked to a user (linkSessionToUser), this returns null, so the cuid
  // alone can no longer read a logged-in user's private transcript (§11 IDOR).
  const s = await prisma.intakeSession.findFirst({
    where: { id, userId: null },
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

// --- Admin: finished-conversation read model (transcripts review) ------------
// "Finished" = no activity for ≥30 min AND at least one stored message. There is
// no explicit end-of-conversation marker on IntakeSession, so we infer it from
// inactivity (updatedAt older than the cutoff) plus a non-empty transcript (skip
// sessions that were created but never spoken to). These transcripts are
// sensitive (§11) and are only ever read by an authenticated ADMIN.

/** Minutes of inactivity after which a session is considered finished. */
export const FINISHED_AFTER_MIN = 30;

/** Cutoff instant: a session is finished if updatedAt is strictly before this. */
function finishedCutoff(now: Date): Date {
  return new Date(now.getTime() - FINISHED_AFTER_MIN * 60_000);
}

/** Engine sniffed from the stored `constraints` blob (chip flow or AI/scripted). */
function engineFromConstraints(constraints: unknown): IntakeEngine | null {
  const c = (constraints as { engine?: IntakeEngine; flow?: unknown } | null) ?? null;
  if (c?.engine) return c.engine;
  if (c?.flow) return "scripted"; // chip-driven flow is the deterministic engine
  return null;
}

/** A finished intake session as the admin conversations list needs it. */
export type FinishedSessionRow = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  state: IntakeStateName;
  engine: IntakeEngine | null;
  turns: number;
  matched: number;
};

/**
 * Finished intake sessions, newest first. Filters in the DB on the inactivity
 * cutoff; the empty-transcript guard is applied in app code because `messages`
 * is a Json column (no portable "array length ≥ 1" predicate across providers).
 */
export async function listFinishedSessions(
  now: Date = new Date(),
): Promise<FinishedSessionRow[]> {
  const rows = await prisma.intakeSession.findMany({
    where: { updatedAt: { lt: finishedCutoff(now) } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      state: true,
      constraints: true,
      messages: true,
      suggestedTherapistIds: true,
    },
  });
  return rows
    .map((s) => {
      const messages = (s.messages as StoredMessage[] | null) ?? [];
      return {
        id: s.id,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        state: s.state,
        engine: engineFromConstraints(s.constraints),
        turns: messages.length,
        matched: s.suggestedTherapistIds.length,
        _empty: messages.length === 0,
      };
    })
    .filter((s) => !s._empty)
    .map(({ _empty: _drop, ...row }) => row);
}

/** A single finished session with its full transcript, for the .md export. */
export type FullSession = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  state: IntakeStateName;
  engine: IntakeEngine | null;
  messages: StoredMessage[];
  matched: string[];
};

/** Load one full session (transcript included) by id, or null. */
export async function getFullSession(id: string): Promise<FullSession | null> {
  const s = await prisma.intakeSession.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      state: true,
      constraints: true,
      messages: true,
      suggestedTherapistIds: true,
    },
  });
  if (!s) return null;
  return {
    id: s.id,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    state: s.state,
    engine: engineFromConstraints(s.constraints),
    messages: (s.messages as StoredMessage[] | null) ?? [],
    matched: s.suggestedTherapistIds,
  };
}

/**
 * Load several full sessions (transcripts included) by id, newest-finished first.
 * For the admin "download selected" export. The caller validates/caps `ids`
 * before reaching here; an empty list returns `[]` without a query. Same select
 * and FullSession mapping as `getFullSession`.
 */
export async function getFullSessionsByIds(ids: string[]): Promise<FullSession[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.intakeSession.findMany({
    where: { id: { in: ids } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      state: true,
      constraints: true,
      messages: true,
      suggestedTherapistIds: true,
    },
  });
  return rows.map((s) => ({
    id: s.id,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    state: s.state,
    engine: engineFromConstraints(s.constraints),
    messages: (s.messages as StoredMessage[] | null) ?? [],
    matched: s.suggestedTherapistIds,
  }));
}

/** Every finished session with full transcripts (for the download-all export). */
export async function listFinishedSessionsFull(
  now: Date = new Date(),
): Promise<FullSession[]> {
  const rows = await prisma.intakeSession.findMany({
    where: { updatedAt: { lt: finishedCutoff(now) } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      state: true,
      constraints: true,
      messages: true,
      suggestedTherapistIds: true,
    },
  });
  return rows
    .map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      state: s.state,
      engine: engineFromConstraints(s.constraints),
      messages: (s.messages as StoredMessage[] | null) ?? [],
      matched: s.suggestedTherapistIds,
    }))
    .filter((s) => s.messages.length > 0);
}

/** Count of finished intake sessions — for the admin dashboard. */
export async function countFinishedSessions(
  now: Date = new Date(),
): Promise<number> {
  return (await listFinishedSessions(now)).length;
}

// --- Admin: manual data deletion (Phase 5, retention & GDPR) -----------------
// All admin-triggered (no scheduled auto-purge — the owner chose KEEP-INDEFINITELY).
// IntakeSession has NO child rows (userId is a nullable String with no FK, and no
// other table references it), so a plain delete/deleteMany is FK-safe — no
// transaction or children-first ordering is needed here. Authorization is enforced
// at the action boundary (requireRole("ADMIN")), never in the repository.

/** Hard-delete one intake session (transcript) by id. No child rows to cascade.
 *  Uses deleteMany (not delete) so a missing id is a no-op (count 0), not a throw. */
export async function deleteSession(id: string): Promise<void> {
  await prisma.intakeSession.deleteMany({ where: { id } });
}

/**
 * Manual bulk purge: hard-delete every intake session not touched in the last
 * `days` days (updatedAt strictly before the cutoff). Returns the number of rows
 * deleted. On-demand only — there is NO cron/timer. `days` is validated as a
 * positive integer at the action boundary (zod); the cutoff is computed here.
 */
export async function purgeSessionsOlderThan(
  days: number,
  now: Date = new Date(),
): Promise<number> {
  const cutoff = new Date(now.getTime() - days * 86_400_000);
  const { count } = await prisma.intakeSession.deleteMany({
    where: { updatedAt: { lt: cutoff } },
  });
  return count;
}

// --- Admin: intake statistics (Phase 2, DB-derived; no new tables) -----------

/** Intake-session counts grouped by state (the funnel) — via groupBy, no load. */
export function sessionCountsByState() {
  return prisma.intakeSession.groupBy({
    by: ["state"],
    _count: { _all: true },
  });
}

/** Total intake sessions. */
export function countSessions(): Promise<number> {
  return prisma.intakeSession.count();
}

/** Sessions that produced at least one suggested therapist (match-rate numerator).
 *  `isEmpty: false` filters the String[] column in the DB — no table load. */
export function countMatchedSessions(): Promise<number> {
  return prisma.intakeSession.count({
    where: { suggestedTherapistIds: { isEmpty: false } },
  });
}

/** Just the `constraints` blob of every session — for the engine breakdown,
 *  which is reduced in app code (JSON has no portable groupBy). Minimal columns. */
export function listSessionConstraints() {
  return prisma.intakeSession.findMany({ select: { constraints: true } });
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
  // Owner-scoped like getSession: a LINKED session (userId set) is no longer
  // resumable via its bearer cuid (§11 IDOR). During the anonymous conversation
  // userId is null, so the live flow is unaffected until sign-up links it.
  const s = await prisma.intakeSession.findFirst({
    where: { id, userId: null },
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

// --- Login-linking (F1.5): anonymous session → authenticated user ------------
// The cross-feature glue (read the sp_intake cookie, call this) lives in the app
// composition root (/account), never in the accounts feature.

/**
 * Link an anonymous intake session to a user, at sign-up/login. Scoped to
 * `userId: null` so it ONLY claims a still-anonymous session — a cuid that's
 * already owned by someone else can't be re-linked (no session hijack). No-op
 * (count 0) if the id is unknown or already linked.
 */
export async function linkSessionToUser(
  sessionId: string,
  userId: string,
): Promise<void> {
  await prisma.intakeSession.updateMany({
    where: { id: sessionId, userId: null },
    data: { userId },
  });
}

/**
 * The therapist ids most recently suggested to THIS user (owner-scoped on
 * `userId`), newest finished session first — for the "your recommended
 * therapist" card on /account. Empty array if none.
 */
export async function getRecommendationForUser(
  userId: string,
): Promise<string[]> {
  const s = await prisma.intakeSession.findFirst({
    where: { userId, suggestedTherapistIds: { isEmpty: false } },
    orderBy: { updatedAt: "desc" },
    select: { suggestedTherapistIds: true },
  });
  return s?.suggestedTherapistIds ?? [];
}
