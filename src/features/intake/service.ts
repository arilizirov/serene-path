import { getMatchingCatalog } from "@/features/therapists";
import { getNextAvailable } from "@/features/scheduling";
import { aiProvider, recordUsage, type ChatMessage } from "@/server/ai";
import { buildSystemPrompt } from "./prompt";
import { modelOutputSchema } from "./schema";
import {
  createSession,
  getSession,
  saveSession,
  type StoredMessage,
  type IntakeSessionRow,
  type FullSession,
} from "./repository";
import { detectConcerns, pickMatch } from "./concerns";
import {
  copy,
  confirmOptions,
  isConfirmNo,
  mirrorMessage,
  buildRationale,
  matchMessage,
} from "./copy";
import type {
  IntakeResponse,
  Locale,
  IntakeStateName,
  TherapistMatch,
  IntakeEngine,
} from "./types";

// Shown when the AI returns unparseable / invalid output — a safe, honest CLARIFY
// in the user's locale (never a crash, never a fabricated match).
const FALLBACK_REPLY: Record<Locale, string> = {
  en: "Sorry — I didn't quite follow that. Could you tell me a little more?",
  he: "סליחה — לא הבנתי במדויק. אפשר לספר לי קצת יותר?",
  fr: "Désolé — je n'ai pas bien saisi. Pouvez-vous m'en dire un peu plus ?",
};

/** Best-effort parse of the model's raw text into JSON (tolerate fences/prose). */
function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const block = raw.match(/\{[\s\S]*\}/);
    if (block) {
      try {
        return JSON.parse(block[0]);
      } catch {
        /* fall through */
      }
    }
    return null;
  }
}

type Phase = "g1" | "g2" | "g3" | "confirm" | "regather" | "done";

/**
 * Resolve the effective engine for a turn. Sticky: once a session has run on one
 * engine we keep it (don't swap brains mid-conversation) — so the request's
 * `engine` is intentionally a no-op after turn 1 (don't "fix" this into a per-turn
 * switch: it would let one session probe each engine's guardrails). Otherwise the
 * request's choice, else a sensible default. "ai" only ever takes effect when a key
 * is configured — without it we always fall back to the deterministic scripted flow
 * rather than the dev stub, so the live experience never degrades silently.
 */
function resolveEngine(
  session: IntakeSessionRow,
  requested: IntakeEngine | undefined,
): IntakeEngine {
  const hasKey = !!process.env.OPENAI_API_KEY;
  const choice = session.engine ?? requested ?? (hasKey ? "ai" : "scripted");
  return choice === "ai" && hasKey ? "ai" : "scripted";
}

/**
 * Run one intake turn (APP_SPEC §5). Loads/creates the anonymous session, appends
 * the user message, then dispatches to the chosen engine. Both engines keep the
 * server-side §5 guarantees: matches only ever name catalog therapists and
 * `nextAvailable` is always resolved by the scheduling engine, never invented.
 */
export async function runIntakeTurn(input: {
  sessionId?: string;
  message: string;
  locale: Locale;
  engine?: IntakeEngine;
}): Promise<IntakeResponse> {
  const existing = input.sessionId ? await getSession(input.sessionId) : null;
  const session = existing ?? (await createSession());
  const engine = resolveEngine(session, input.engine);

  const messages: StoredMessage[] = [...session.messages];
  messages.push({ role: "user", content: input.message.trim() });

  return engine === "ai"
    ? runAiTurn(input.locale, session, messages)
    : runScriptedTurn(input.locale, session, messages);
}

/** AI engine: the LLM drives the conversation; the server enforces §5 on its
 *  UNTRUSTED output (validate, drop non-catalog ids, dedupe, resolve slots). */
async function runAiTurn(
  locale: Locale,
  session: IntakeSessionRow,
  messages: StoredMessage[],
): Promise<IntakeResponse> {
  const catalog = await getMatchingCatalog(locale);
  const catalogIds = new Set(catalog.map((c) => c.id));

  const chat: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(catalog, locale) },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];
  const { text: raw, usage } = await aiProvider().complete(chat);
  // Fire-and-forget cost tracking (Phase 4): only the real provider reports usage;
  // recordUsage is wrapped so it can never break this turn. Stub path → usage null.
  if (usage) void recordUsage("intake", process.env.OPENAI_MODEL || "gpt-5.4", usage);

  const parsed = modelOutputSchema.safeParse(safeJson(raw));
  const out = parsed.success
    ? parsed.data
    : { state: "CLARIFY" as const, reply: FALLBACK_REPLY[locale], matches: [] };

  const allowMatches = out.state === "MATCH" || out.state === "PRESENT_OPTIONS";
  const accepted: { therapist_id: string; rationale: string }[] = [];
  if (allowMatches) {
    const seen = new Set<string>();
    for (const m of out.matches) {
      if (catalogIds.has(m.therapist_id) && !seen.has(m.therapist_id)) {
        seen.add(m.therapist_id);
        accepted.push(m);
      }
    }
  }

  const now = new Date().toISOString();
  const matches: TherapistMatch[] = await Promise.all(
    accepted.map(async (m) => ({
      therapistId: m.therapist_id,
      rationale: m.rationale,
      nextAvailable: await getNextAvailable(m.therapist_id, now),
    })),
  );

  // If the model claimed a MATCH but every id was non-catalog (all dropped), don't
  // persist/return a match state with zero therapists — that paints an empty
  // "Suggested therapists" panel. Fall back to a safe CLARIFY.
  const state: IntakeStateName =
    allowMatches && matches.length === 0 ? "CLARIFY" : out.state;

  messages.push({ role: "assistant", content: out.reply });
  await saveSession(session.id, {
    state,
    messages,
    suggestedTherapistIds: matches.map((m) => m.therapistId),
    phase: "ai",
    engine: "ai",
  });

  return {
    sessionId: session.id,
    assistantMessage: out.reply,
    state,
    matches,
    engine: "ai",
  };
}

/** Scripted engine: deterministic phase machine, no model call. Phase persisted on
 *  the session; matching scores the real catalog; the server resolves the slot. */
async function runScriptedTurn(
  locale: Locale,
  session: IntakeSessionRow,
  messages: StoredMessage[],
): Promise<IntakeResponse> {
  const c = copy(locale);
  const phase = (session.phase as Phase | null) ?? "g1";
  const answers = messages.filter((m) => m.role === "user").map((m) => m.content);
  const lastUser = answers[answers.length - 1] ?? "";

  let reply: string;
  let state: IntakeStateName;
  let nextPhase: Phase;
  let options: string[] | undefined;
  let matches: TherapistMatch[] = [];

  if (phase === "g1") {
    reply = c.probe1;
    state = "GATHER";
    nextPhase = "g2";
  } else if (phase === "g2") {
    reply = c.probe2;
    state = "GATHER";
    nextPhase = "g3";
  } else if (phase === "g3" || phase === "regather") {
    reply = mirrorMessage(locale, detectConcerns(answers.join(" ")));
    state = "CONFIRM";
    nextPhase = "confirm";
    options = confirmOptions(locale);
  } else if (phase === "confirm") {
    if (isConfirmNo(locale, lastUser)) {
      reply = c.notQuite;
      state = "GATHER";
      nextPhase = "regather";
    } else {
      const concerns = detectConcerns(answers.join(" "));
      const catalog = await getMatchingCatalog(locale);
      const picked = pickMatch(catalog, concerns, answers.join(" "), locale);
      if (!picked) {
        reply = c.noMatch;
        state = "CLARIFY";
        nextPhase = "done";
      } else {
        const entry = catalog.find((e) => e.id === picked.id)!;
        const nextAvailable = await getNextAvailable(picked.id, new Date().toISOString());
        const rationale = buildRationale(locale, picked.concept, picked.snippet);
        reply = matchMessage(locale, entry.name, rationale, nextAvailable);
        state = "PRESENT_OPTIONS";
        nextPhase = "done";
        matches = [{ therapistId: picked.id, rationale, nextAvailable }];
      }
    }
  } else {
    reply = c.support;
    state = "FOLLOWUP";
    nextPhase = "done";
  }

  messages.push({ role: "assistant", content: reply });
  await saveSession(session.id, {
    state,
    messages,
    suggestedTherapistIds: matches.map((m) => m.therapistId),
    phase: nextPhase,
    engine: "scripted",
  });

  return {
    sessionId: session.id,
    assistantMessage: reply,
    state,
    matches,
    options,
    engine: "scripted",
  };
}

// --- Admin: finished-conversation reads + .md export -------------------------
// The admin conversations page / download routes read finished transcripts (§11,
// admin-only). The reads are pure repository pass-throughs (re-exported so the
// app reaches them through the feature's public surface); the markdown builders
// below are pure, so they're unit-testable without a DB.
export {
  listFinishedSessions,
  getFullSession,
  listFinishedSessionsFull,
  countFinishedSessions,
  deleteSession,
  purgeSessionsOlderThan,
} from "./repository";
export type { FinishedSessionRow, FullSession } from "./repository";

/** One transcript turn rendered as a labelled markdown block. */
function turnToMarkdown(m: StoredMessage): string {
  const speaker = m.role === "user" ? "User" : "Assistant";
  return `**${speaker}:**\n\n${m.content}`;
}

/**
 * Render one finished session as a standalone `.md` document: YAML frontmatter
 * (id / created / finished / state / engine / matched count / turns) followed by
 * the transcript as alternating **User:** / **Assistant:** blocks.
 */
export function conversationToMarkdown(session: FullSession): string {
  const frontmatter = [
    "---",
    `id: ${session.id}`,
    `created: ${session.createdAt.toISOString()}`,
    `finished: ${session.updatedAt.toISOString()}`,
    `state: ${session.state}`,
    `engine: ${session.engine ?? "unknown"}`,
    `matched: ${session.matched.length}`,
    `turns: ${session.messages.length}`,
    "---",
  ].join("\n");
  const transcript = session.messages.map(turnToMarkdown).join("\n\n");
  // Keep a trailing blank line between frontmatter and an empty transcript tidy.
  return transcript ? `${frontmatter}\n\n${transcript}\n` : `${frontmatter}\n`;
}

/** Render many finished sessions into one `.md`, separated by horizontal rules. */
export function conversationsToMarkdown(sessions: FullSession[]): string {
  return sessions.map(conversationToMarkdown).join("\n\n---\n\n");
}

// --- Admin: intake statistics (Phase 2, DB-derived) --------------------------

import {
  sessionCountsByState,
  countSessions,
  countMatchedSessions,
  listSessionConstraints,
} from "./repository";
import { tallyEngines, matchRate } from "./stats";

/** The intake metrics the admin stats page renders, all derived from the DB. */
export type IntakeStats = {
  total: number;
  byState: Record<string, number>;
  matched: number;
  matchRate: number; // 0..1
  engines: { ai: number; scripted: number; none: number };
};

/**
 * Intake funnel + match rate + engine breakdown, purely from the DB. Counts/funnel
 * use prisma groupBy/count (no table load); the engine breakdown reduces the
 * `constraints` blobs in app code via the pure tallyEngines helper.
 */
export async function getIntakeStats(): Promise<IntakeStats> {
  const [stateRows, total, matched, constraintRows] = await Promise.all([
    sessionCountsByState(),
    countSessions(),
    countMatchedSessions(),
    listSessionConstraints(),
  ]);
  const byState = Object.fromEntries(
    stateRows.map((r) => [r.state, r._count._all]),
  );
  return {
    total,
    byState,
    matched,
    matchRate: matchRate(matched, total),
    engines: tallyEngines(constraintRows),
  };
}
