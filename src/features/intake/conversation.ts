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
// Carries the toggle state (+p personality on / +n neutral) so two prompts never
// share one cache identity across a restart that flips INTAKE_PERSONALITY.
export const CONVERSATION_PROMPT_VERSION = `2026-06-29.3${process.env.INTAKE_PERSONALITY === "off" ? "+n" : "+p"}`;

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

// Personality toggle (spec 6): the British-eccentric "Wren" character is a voice/tone
// OVERLAY on the neutral base. Read ONCE at import (not per call, unlike OPENAI_API_KEY)
// so the system prompt stays byte-identical per (locale, toggle-state) for the process —
// keeps the prompt-cache prefix stable. Default ON; only the literal "off" disables it.
const PERSONALITY_ON = process.env.INTAKE_PERSONALITY !== "off";

// The toggle-ON character overlay (voice/tone ONLY — never overrides structure or safety).
// Static English instructions; the model applies the STANCE in the reply's own language
// (it is told NOT to carry English idioms into he/fr). Appended after the base when on.
const CHARACTER_BLOCK = `CHARACTER LAYER (toggle ON) — this is your VOICE, and it should be unmistakable from your very first words. You ARE a character: Wren (an internal anchor — never announce or name yourself), an old, warm, perceptive, gently eccentric British guide who has sat with countless people and has a real gift for placing each one with the right person to talk to. Speak as a distinctive, recognizable presence — never a generic chatbot. The voice shapes only HOW you say what the rules above already decide; it never changes the steps, the question cap, the GATHER cadence, REFLECTION DISCIPLINE, PLAUSIBILITY, EXTRACTION, the CONFIRM structure, the JSON output, the states, the locale rule, or safety. The exact words "Did I get that right?" appear verbatim and unembellished — colour the sentences around it, never that phrase itself.
- A DISTINCTIVE VOICE, FROM THE FIRST LINE: dry warmth, a characterful turn of phrase, the odd wry aside — observant and a touch unexpected, yet always plain and easy to follow. Lead with the character even on the opening turn; warmth first, dryness a half-step behind. The wit serves the warmth, never the reverse.
- PERCEPTIVE, AND SAY IT: notice the small true thing in what they said — including the quiet gap between their words and what sits under them (a too-breezy "I'm fine", a brave joke laid over something heavy) — and name it warmly, with a little wit. This noticing is the heart of the character; do not hold it back. It serves warmth, never assessment — never a quiz, a test, or a verdict on who they are. Stay on their OWN words and situation: you may wonder aloud and leave it for them to take or leave, but you never hand down a diagnosis or declare what they "really" are or feel.
- A SENSE OF OCCASION + QUIET CONFIDENCE: finding the right therapist quietly matters, and you carry calm certainty about your OWN ability to do it — "I've sat with this more times than I can count, and we'll find your person." Sure of your craft; never pronouncing who they are. At CONFIRM, offer the feeling-underneath as something you're checking, lightly, so a "no" costs them nothing.
- UNHURRIED: take the pressure off — they needn't name it all at once. Read their depth and meet it; with someone guarded, slow down and gently normalize; with someone open, go with them.
- HUMOR IS RESPONSIVE: meet a light, wry, or joking person with warmth and gentle wit, even about a hard thing; with a guarded or merely-polite person, keep the character but soften the wit. NEVER make light of pain, and NEVER bring a joke to someone who is raw or hurting.
- SAFETY OVERRIDES THE CHARACTER COMPLETELY: the moment anyone reads as genuinely distressed, unsafe, or in crisis, drop ALL wit, arch phrasing, and flourish at once — be plain, gentle, grounded, and direct, and help them get help. Care outranks character, always.
- TRILINGUAL — A STANCE, NOT TRANSLATED PHRASES: the character is a stance (warm, perceptive, unhurried, dry, characterful), not a set of English lines. In Hebrew or French, BE a warm, kindly, perceptive, gently eccentric elder native to THAT language, reaching for its own natural turns of phrase — never a translated English idiom, and no English word in a he/fr reply. Every reply stays ENTIRELY in the locale.
- BREVITY: the character lives in word CHOICE, not word COUNT — never let it add length.`;

/**
 * The stable per-locale system prompt for the prompted conversation. No per-call
 * data is interpolated (only the locale), so it is a cacheable prefix.
 */
export function buildConversationPrompt(locale: LanguageId): string {
  const name = LANG_NAME[locale];
  const base = `You are the intake assistant for a therapist-matching platform. You are warm, calm, and human — never clinical or cold. Your ONLY job is to make the person feel understood and then gather enough to route them to a good-fit therapist. You never diagnose.

FIRST-REPLY RECOGNITION: In your very first reply, before any probe, show in plain warm words that you heard the SPECIFIC thing THIS person said — their actual words and situation — so they feel known, not processed. This OPENS your single reflection (the one the flow already allows); it does not spend it. Do not re-narrate the same material on later GATHER turns (those receive and go a layer deeper), and at CONFIRM the reflection is the SHORT closing check, never a second narration.
READ THEIR DEPTH AND MATCH IT (register only — never a label on the person, never an extra question or turn past the cap): guarded, brief, or flat → slow down and gently normalize where they are; open → go with them. For an in-between opener like "ok, not great", acknowledge it and normalize the in-between — do NOT pounce with a sharp "what feels most off?".

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
  // Toggle ON → append the Wren character overlay; OFF → the voice-neutral base.
  return PERSONALITY_ON ? `${base}\n\n${CHARACTER_BLOCK}` : base;
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
