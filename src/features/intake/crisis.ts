import { aiProvider, type ChatMessage } from "@/server/ai";
import type { LanguageId } from "./contract";

// CRISIS guardrail (INTAKE_BUILD_SPEC §Guardrails). Runs on every free-text input.
//
// Resources below are the Israel lines CONFIRMED by the owner (2026-06-24).
//
// Detection is two layers: a fast HIGH-RECALL keyword pass, then a model classifier
// (also high-recall) for phrasings the keywords miss (passive ideation, indirect
// disclosure). It is deliberately not the only safeguard: `get_help_now` is a
// persistent secondary action on every turn, independent of whether detection fires.

const CRISIS_TERMS: Record<LanguageId, string[]> = {
  en: [
    "suicide", "suicidal", "kill myself", "killing myself", "end my life", "end it all",
    "want to die", "wanna die", "don't want to live", "dont want to live", "hurt myself",
    "harm myself", "self harm", "self-harm", "no reason to live", "better off dead",
  ],
  he: [
    "להתאבד", "אתאבד", "אובדני", "אובדנית", "לשים סוף", "לסיים עם הכל", "לא רוצה לחיות",
    "אין לי סיבה לחיות", "לפגוע בעצמי", "לעשות לעצמי משהו", "עדיף שאמות",
  ],
  fr: [
    "suicide", "suicidaire", "me tuer", "me suicider", "en finir", "veux mourir",
    "envie de mourir", "plus envie de vivre", "me faire du mal", "plus de raison de vivre",
    "mieux mort", "mieux morte",
  ],
};

/** Interim high-recall keyword check (locale + English net). Stage E adds a model
 *  classifier; this stays as a cheap first pass. */
export function looksLikeCrisis(text: string, locale: LanguageId): boolean {
  const t = text.toLowerCase();
  const terms = [...CRISIS_TERMS[locale], ...CRISIS_TERMS.en];
  return terms.some((k) => t.includes(k));
}

const CLASSIFIER_PROMPT = `You are a safety classifier for a mental-health intake chat. Decide whether the user's message suggests GENUINE risk of suicide, self-harm, or being in immediate danger. Be high-recall on real signals — including indirect or passive ideation (e.g. "everyone would be better off without me", "I can't go on", "I don't see the point anymore"). A false alarm is far better than a miss. BUT do NOT flag ordinary stress or common hyperbole/idioms that are clearly not about self-harm (e.g. "this deadline is killing me", "I'm dying of boredom", "I could kill for a coffee", "my back is killing me"). The message may be in Hebrew, English, or French. Output ONLY JSON: {"crisis": true} or {"crisis": false}.`;

/** Model classifier (high-recall) for phrasings the keywords miss. Fails to non-
 *  crisis on error/no-key — the keyword pass already ran and get_help_now persists. */
async function classifyCrisis(text: string): Promise<boolean> {
  if (!process.env.OPENAI_API_KEY) return false;
  const chat: ChatMessage[] = [
    { role: "system", content: CLASSIFIER_PROMPT },
    { role: "user", content: text },
  ];
  try {
    const raw = await aiProvider().complete(chat);
    const block = raw.match(/\{[\s\S]*\}/);
    if (!block) return false;
    return (JSON.parse(block[0]) as { crisis?: unknown }).crisis === true;
  } catch {
    return false;
  }
}

/** Two-layer crisis check on a free-text input: keyword net, then the model. */
export async function isCrisis(text: string, locale: LanguageId): Promise<boolean> {
  if (looksLikeCrisis(text, locale)) return true;
  return classifyCrisis(text);
}

// Israel crisis lines — CONFIRMED by the owner (2026-06-24).
const RESOURCES: Record<LanguageId, string> = {
  en: "If you're in immediate danger, call 101 (medical) or 100 (police) right now. For emotional first aid any time, ERAN is at 1201, and Sahar offers online support at sahar.org.il. NATAL (trauma): 1-800-363-363. You don't have to carry this alone — please reach out to one of these now.",
  he: 'אם את/ה בסכנה מיידית, חייג/י עכשיו 101 (מד"א) או 100 (משטרה). לעזרה ראשונה נפשית בכל שעה — ער"ן בטלפון 1201, וסה"ר בתמיכה מקוונת באתר sahar.org.il. נט"ל (טראומה): 1-800-363-363. אינך צריך/ה לשאת את זה לבד — אנא פנה/י לאחד מהם עכשיו.',
  fr: "En cas de danger immédiat, appelez le 101 (secours médical) ou le 100 (police) maintenant. Pour un premier soutien émotionnel à tout moment : ERAN au 1201, et Sahar en ligne sur sahar.org.il. NATAL (trauma) : 1-800-363-363. Vous n'avez pas à porter cela seul·e — contactez l'un d'eux maintenant.",
};

/** The crisis message for a locale (human-authored, never generated). */
export function crisisMessage(locale: LanguageId): string {
  return RESOURCES[locale];
}
