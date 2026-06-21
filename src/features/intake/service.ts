import { getMatchingCatalog } from "@/features/therapists";
import { getNextAvailable } from "@/features/scheduling";
import { aiProvider, type ChatMessage } from "@/server/ai";
import { buildSystemPrompt } from "./prompt";
import { modelOutputSchema } from "./schema";
import {
  createSession,
  getSession,
  saveSession,
  type StoredMessage,
} from "./repository";
import type { IntakeResponse, Locale, TherapistMatch } from "./types";

// Shown when the model returns unparseable / invalid output — a safe, honest
// CLARIFY in the user's locale (never a crash, never a fabricated match).
const FALLBACK_REPLY: Record<Locale, string> = {
  en: "Sorry — I didn't quite follow that. Could you tell me a little more?",
  he: "סליחה — לא הבנתי במדויק. אפשר לספר לי קצת יותר?",
  fr: "Désolé — je n'ai pas bien saisi. Pouvez-vous m'en dire un peu plus ?",
};

/** Best-effort parse of the model's raw text into JSON: tolerate code fences or
 *  surrounding prose by extracting the first {...} block. */
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

/**
 * Run one intake turn (APP_SPEC §5). Loads/creates the anonymous session, appends
 * the user message, builds the verified-therapist catalog (no prices/times),
 * calls the model, then enforces the server-side contract on the UNTRUSTED output:
 *  - validate with zod (invalid → safe CLARIFY fallback);
 *  - matches only survive in MATCH/PRESENT_OPTIONS;
 *  - any therapist id not in the catalog is dropped (no hallucinated identities);
 *  - duplicates collapsed;
 *  - nextAvailable is resolved by the scheduling engine, never the model.
 * Persists the transcript/state and returns the public response.
 */
export async function runIntakeTurn(input: {
  sessionId?: string;
  message: string;
  locale: Locale;
}): Promise<IntakeResponse> {
  const existing = input.sessionId ? await getSession(input.sessionId) : null;
  const session = existing ?? (await createSession());
  const messages: StoredMessage[] = [...session.messages];
  messages.push({ role: "user", content: input.message });

  const catalog = await getMatchingCatalog(input.locale);
  const catalogIds = new Set(catalog.map((c) => c.id));

  const chat: ChatMessage[] = [
    { role: "system", content: buildSystemPrompt(catalog, input.locale) },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];
  const raw = await aiProvider().complete(chat);

  const parsed = modelOutputSchema.safeParse(safeJson(raw));
  const out = parsed.success
    ? parsed.data
    : { state: "CLARIFY" as const, reply: FALLBACK_REPLY[input.locale], matches: [] };

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

  messages.push({ role: "assistant", content: out.reply });
  await saveSession(session.id, {
    state: out.state,
    messages,
    suggestedTherapistIds: matches.map((m) => m.therapistId),
  });

  return {
    sessionId: session.id,
    assistantMessage: out.reply,
    state: out.state,
    matches,
  };
}
