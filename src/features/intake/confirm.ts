import { aiProvider, type ChatMessage } from "@/server/ai";
import { labels, flowMsg } from "./flow-copy";
import type { IntakeSelection, LanguageId } from "./contract";

// Step 6 — the ONE model call (INTAKE_BUILD_SPEC §Step 6). Given the free-text
// opener + the chip selections, the model writes the warm Respect → Mirror →
// Validate → Empathize → Confirm → Support message, in the user's language. It's the
// only client-facing generated text on the happy path, so it always reads human (no
// canned reflection). FAILURE-ONLY fallback: empty/malformed/wrong-language → retry
// once → templated confirm assembled from the chips (never used on the happy path).

const LANG_NAME: Record<LanguageId, string> = { he: "Hebrew", en: "English", fr: "French" };

function systemPrompt(locale: LanguageId): string {
  const name = LANG_NAME[locale];
  return `You are a warm, calm intake assistant for a therapy service. You never diagnose. Reply ONLY in ${name}.
The person told us how they're feeling and tapped a few choices. Write ONE short message (3–5 sentences):
1) Respect — briefly affirm the strength it took to reach out.
2) Mirror → Validate → Empathize — reflect the FEELING underneath what they shared, in YOUR OWN words, and say it makes sense. NEVER just restate their words back ("it sounds like…" + a repeat is hollow); add the emotion or the toll they didn't name.
3) A one-line summary of their situation, ending with the question "Did I get that right?"
4) A short reassuring line that whatever the answer, you'll find someone to walk through it with them.
Do NOT mention specific therapists, prices, or appointment times.
Output ONLY this JSON, nothing else: {"reply":"<your message, in ${name}>"}`;
}

function userSummary(opener: string, selection: IntakeSelection, locale: LanguageId): string {
  const l = labels(locale);
  const lines: string[] = [];
  if (opener) lines.push(`In their own words: "${opener}"`);
  if (selection.concern) lines.push(`Main concern: ${l.concern[selection.concern]}`);
  if (selection.style) lines.push(`Support style they want: ${l.style[selection.style]}`);
  if (selection.genderPreference && selection.genderPreference !== "no_preference")
    lines.push(`Therapist preference: ${l.genderPreference[selection.genderPreference]}`);
  return lines.join("\n");
}

function parseReply(raw: string): string | null {
  const tryParse = (s: string): string | null => {
    try {
      const o = JSON.parse(s) as { reply?: unknown };
      return typeof o.reply === "string" && o.reply.trim() ? o.reply.trim() : null;
    } catch {
      return null;
    }
  };
  return tryParse(raw) ?? tryParse(raw.match(/\{[\s\S]*\}/)?.[0] ?? "");
}

/** Cheap wrong-language guard: a Hebrew reply must contain Hebrew letters. */
function looksRightLanguage(text: string, locale: LanguageId): boolean {
  if (locale === "he") return /[֐-׿]/.test(text);
  return true;
}

/** Templated confirm — the FAILURE-ONLY fallback, assembled from chips (no model). */
export function templatedConfirm(locale: LanguageId, selection: IntakeSelection): string {
  const m = flowMsg(locale);
  const l = labels(locale);
  const concern = selection.concern ? l.concern[selection.concern] : "";
  const style = selection.style ? l.style[selection.style] : "";
  const mid = !concern
    ? ""
    : locale === "he"
      ? `ממה ששיתפת, ${concern} מעיק/ה עליך, ואת/ה מחפש/ת ${style}.`
      : locale === "fr"
        ? `D'après ce que vous partagez, ${concern} pèse sur vous, et vous cherchez ${style}.`
        : `From what you've shared, ${concern} is weighing on you, and you're looking for ${style}.`;
  const didIGet = locale === "he" ? "הבנתי נכון?" : locale === "fr" ? "Ai-je bien compris ?" : "Did I get that right?";
  return `${m.respect} ${mid} ${didIGet} ${m.support}`.replace(/\s+/g, " ").trim();
}

/** The step-6 confirm message: one model call (retried once), else templated. */
export async function buildConfirmMessage(
  opener: string,
  selection: IntakeSelection,
  locale: LanguageId,
): Promise<string> {
  // No key → don't fall through to the dev stub; use the deterministic templated
  // confirm so the experience stays coherent.
  if (!process.env.OPENAI_API_KEY) return templatedConfirm(locale, selection);

  const chat: ChatMessage[] = [
    { role: "system", content: systemPrompt(locale) },
    { role: "user", content: userSummary(opener, selection, locale) },
  ];
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await aiProvider().complete(chat);
      const reply = parseReply(raw);
      if (reply && looksRightLanguage(reply, locale)) return reply;
    } catch {
      /* retry, then fall back */
    }
  }
  return templatedConfirm(locale, selection);
}
