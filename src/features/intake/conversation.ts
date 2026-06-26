import { aiProvider, recordUsage, type ChatMessage } from "@/server/ai";
import {
  EXTRACT_CONCERN_IDS,
  EXTRACT_STYLE_IDS,
  type LanguageId,
  type StyleId,
} from "./contract";
import type { StoredMessage } from "./repository";

// The prompted conversation — the felt-understood core (INTAKE_BUILD_SPEC §"The
// conversation — behavior"). The model drives steps 2–4: ~1–2 warm probes (state
// GATHER), then ONE mirror/confirm turn (state CONFIRM) that ALSO returns the
// extracted `concern`/`style`. The server validates those against the FIXED vocab
// (contract: EXTRACT_CONCERN_IDS / EXTRACT_STYLE_IDS); an unmappable concern is
// dropped → the flow routes to CLARIFY (honest no-match → escape hatch). There is NO
// separate extraction API call — extraction is folded into the step-4 call.
//
// Prompt-cache: the system prompt is a STABLE per-locale prefix (no per-call data),
// so the provider's automatic prefix cache keeps the fixed portion cheap every turn.
export const CONVERSATION_PROMPT_VERSION = "2026-06-26.2";

// M2 — gather-loop cost guards. The "~3–4 questions" guarantee was prompt-only;
// these enforce it server-side: cap the transcript slice sent to the model so the
// per-turn cost can't grow unbounded with the conversation, and cap the output
// tokens (each turn is a short JSON object). The flow forces CONFIRM after the user
// turn cap (see conversation-flow MAX_USER_TURNS), so this prompt also honors a
// `forceConfirm` hint to deliver the mirror/confirm now instead of probing again.
const MAX_TRANSCRIPT_MESSAGES = 12; // most-recent N turns sent to the model
const MAX_COMPLETION_TOKENS = 600; // a CONFIRM/GATHER JSON object is small

// The matcher's concern vocab (7 real concerns); `other` is the spec's unmappable
// bucket and is intentionally NOT here — it maps to `undefined` → no-match → CLARIFY.
const REAL_CONCERNS = EXTRACT_CONCERN_IDS.filter((c) => c !== "other");

/** The validated, matcher-ready concern (one of the 7 real concerns) or undefined. */
export type ExtractedConcern = (typeof REAL_CONCERNS)[number];

export type ConversationTurn = {
  reply: string;
  state: "GATHER" | "CONFIRM";
  concern?: ExtractedConcern; // only finalized at the CONFIRM (step-4) turn
  style?: StyleId;
};

const LANG_NAME: Record<LanguageId, string> = { he: "Hebrew", en: "English", fr: "French" };

/**
 * The stable per-locale system prompt for the prompted conversation. No per-call
 * data is interpolated (only the locale), so it is a cacheable prefix.
 */
export function buildConversationPrompt(locale: LanguageId): string {
  const name = LANG_NAME[locale];
  return `You are the intake assistant for a therapist-matching platform. You are warm, calm, and human — never clinical or cold. Your ONLY job is to make the person feel understood and then gather enough to route them to a good-fit therapist. You never diagnose.

LANGUAGE: Reply ENTIRELY in ${locale} (he | en | fr) — every word of every reply. Never switch to or mix in another language.

YOUR ROLE — gather & route, NOT therapy:
- You understand and route. You NEVER advise, problem-solve, coach, or work through a problem (no "have you tried…", no relationship advice). The matched therapist does the real work.
- Cap the funnel: about 3–4 questions total, then reflect and confirm. Do NOT keep probing for 5+ turns.

THE CONVERSATION (you control steps 2–4; the greeting is shown before you):
2–3. GATHER — ask 1–2 warm, contextual follow-up probes that go a layer deeper (what's feeding it, how long). CADENCE (this is where it reads cold/interrogational — warm it without adding length):
   - Don't end every turn with a question. Vary the rhythm — some turns just receive and reflect what they said, then only sometimes ask the next thing. Never more than ONE question per turn.
   - Acknowledgments must be specific to what THIS person said (e.g. "tired in both body and mind, and it's mostly work") — never generic tokens like "that sounds hard".
   - Match their state: for someone low or depleted, use a softer, warmer register — still brief.
   - Avoid misfired therapy-isms (don't reply "I'm glad you said that" to "I'm tired").
4. CONFIRM — once you've gathered enough (after ~2 probes, or sooner if they signal they feel understood), deliver ONE message: a brief affirmation of their strength, ONE reflection of the feeling underneath in YOUR OWN words (name the toll they didn't quite say), a short check ending with the exact words "Did I get that right?", and a reassuring support line. Set state to CONFIRM and include the extracted concern/style (below).

REFLECTION DISCIPLINE (never say the same thing twice — repeating reads as NOT listening):
- Reflect their situation ONCE, in your own words. NEVER restate or re-summarize it a second time in a later turn.
- Respect / Mirror / Validate / Empathize / Confirm are TOOLS you choose based on the conversation — not a fixed checklist. After a full reflection, the confirm is a SHORT check only, not a second narration.
- Treat a felt-heard signal ("thanks for understanding", "yeah, you get it") as a green light to advance straight to the brief CONFIRM. Do NOT re-mirror after they've said they feel understood.

PLAUSIBILITY (light skepticism, never at safety's expense):
- Don't earnestly validate clearly implausible, inconsistent, or trolling input as a sincere clinical picture — gently and non-judgmentally check or redirect instead. This NEVER weakens genuine distress, which is always taken seriously.

EXTRACTION (only at the CONFIRM turn): from the whole conversation, choose the SINGLE best-fit concern and support style from these FIXED lists. Map to the closest one; if nothing fits the concern list, use "other".
- concern: ${EXTRACT_CONCERN_IDS.join(" | ")}
- style: ${EXTRACT_STYLE_IDS.join(" | ")}

OUTPUT: Respond with ONLY this JSON, nothing else.
- While gathering: {"state":"GATHER","reply":"<your message, in ${name}>"}
- At the confirm turn: {"state":"CONFIRM","reply":"<your message, in ${name}>","concern":"<one concern id>","style":"<one style id>"}`;
}

const isConcern = (v: unknown): v is ExtractedConcern =>
  typeof v === "string" && (REAL_CONCERNS as readonly string[]).includes(v);
const isStyle = (v: unknown): v is StyleId =>
  typeof v === "string" && (EXTRACT_STYLE_IDS as readonly string[]).includes(v);

/** Cheap wrong-language guard: a Hebrew reply must contain Hebrew letters. (en/fr
 *  share the Latin script, so we only positively gate Hebrew — matching confirm.ts.) */
function looksRightLanguage(text: string, locale: LanguageId): boolean {
  if (locale === "he") return /[֐-׿]/.test(text);
  return true;
}

type RawTurn = { state?: unknown; reply?: unknown; concern?: unknown; style?: unknown };

/** Parse + shape-check one model completion; null if unusable (→ retry/fallback). */
function parseTurn(raw: string, locale: LanguageId): ConversationTurn | null {
  let obj: RawTurn | null = null;
  try {
    obj = JSON.parse(raw) as RawTurn;
  } catch {
    const block = raw.match(/\{[\s\S]*\}/);
    if (!block) return null;
    try {
      obj = JSON.parse(block[0]) as RawTurn;
    } catch {
      return null;
    }
  }
  const reply = typeof obj.reply === "string" ? obj.reply.trim() : "";
  if (!reply || !looksRightLanguage(reply, locale)) return null;
  const state = obj.state === "CONFIRM" ? "CONFIRM" : "GATHER";
  // Validate extraction against the fixed vocab; anything unmappable (incl. "other"
  // or an out-of-vocab id) becomes undefined → the flow routes that to CLARIFY.
  return {
    reply,
    state,
    concern: isConcern(obj.concern) ? obj.concern : undefined,
    style: isStyle(obj.style) ? obj.style : undefined,
  };
}

// Neutral, templated GATHER line — the FAILURE-ONLY fallback (never the happy path).
const FALLBACK_PROBE: Record<LanguageId, string> = {
  en: "Thank you for sharing that. Could you tell me a little more about what's been going on?",
  he: "תודה ששיתפת. אפשר לספר לי עוד קצת על מה שעובר עליך?",
  fr: "Merci de votre partage. Pouvez-vous m'en dire un peu plus sur ce qui se passe ?",
};

// A short nudge appended to the system prompt when the flow has hit its probe cap:
// stop gathering and deliver the CONFIRM this turn.
const FORCE_CONFIRM_NUDGE =
  "\n\nIMPORTANT: You have gathered enough. Do NOT ask another question — deliver the CONFIRM message now (state \"CONFIRM\") with the extracted concern and style.";

/**
 * Run one conversation turn. Builds the cached system prompt + the (capped)
 * transcript, calls the model with an output-token cap, validates the JSON and the
 * reply language, retries ONCE on a bad/empty/wrong-language output, then falls
 * back to a neutral templated GATHER line. The fallback is FAILURE-ONLY — it never
 * appears on the happy path.
 *
 * `forceConfirm` (M2): when the flow has hit its probe cap, nudge the model to
 * CONFIRM this turn AND defensively coerce a stubborn GATHER to CONFIRM, so the
 * funnel can't loop past the cap regardless of what the model returns.
 */
export async function runConversationTurn(
  transcript: StoredMessage[],
  locale: LanguageId,
  forceConfirm = false,
): Promise<ConversationTurn> {
  // No key → don't drop to the dev stub; use the neutral templated line so the
  // experience stays coherent (and tests stay deterministic without a key).
  if (!process.env.OPENAI_API_KEY) {
    return { reply: FALLBACK_PROBE[locale], state: "GATHER" };
  }

  const system = buildConversationPrompt(locale) + (forceConfirm ? FORCE_CONFIRM_NUDGE : "");
  // M2 — cap the transcript slice so cost doesn't grow unbounded with the convo. Keep
  // the most-recent messages (the system prompt carries all the standing instructions).
  const recent = transcript.slice(-MAX_TRANSCRIPT_MESSAGES);
  const chat: ChatMessage[] = [
    { role: "system", content: system },
    ...recent.map((m) => ({ role: m.role, content: m.content })),
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { text: raw, usage } = await aiProvider().complete(chat, {
        maxCompletionTokens: MAX_COMPLETION_TOKENS,
      });
      // Fire-and-forget cost tracking (Phase 4); recordUsage can't break this path.
      if (usage) void recordUsage("intake", process.env.OPENAI_MODEL || "gpt-5.4", usage);
      const turn = parseTurn(raw, locale);
      if (turn) return forceConfirm && turn.state !== "CONFIRM" ? { ...turn, state: "CONFIRM" } : turn;
    } catch {
      /* retry once, then fall back */
    }
  }
  return { reply: FALLBACK_PROBE[locale], state: "GATHER" };
}
