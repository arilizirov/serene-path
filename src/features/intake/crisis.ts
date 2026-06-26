import { aiProvider, recordUsage, type ChatMessage } from "@/server/ai";
import type { LanguageId } from "./contract";

// CRISIS guardrail (INTAKE_BUILD_SPEC §Guardrails). Runs on every free-text input.
//
// Resources below are the Israel lines CONFIRMED by the owner (2026-06-24).
//
// Detection is two layers: a fast HIGH-RECALL keyword pass, then a model classifier
// (also high-recall) for phrasings the keywords miss (passive ideation, indirect
// disclosure). It is deliberately not the only safeguard: `get_help_now` is a
// persistent secondary action on every turn, independent of whether detection fires.

// High-recall keyword floor. Deliberately broad: a false alarm is acceptable, a miss
// is not. Includes explicit self-harm terms AND passive-ideation / hopelessness /
// abuse stems (B2.2) so the floor catches indirect disclosures even with no model key.
const CRISIS_TERMS: Record<LanguageId, string[]> = {
  en: [
    "suicide", "suicidal", "kill myself", "killing myself", "end my life", "end it all",
    "want to die", "wanna die", "don't want to live", "dont want to live", "hurt myself",
    "harm myself", "self harm", "self-harm", "no reason to live", "better off dead",
    // Passive ideation / hopelessness stems (B2.2).
    "i don't see the point", "i dont see the point", "don't see the point anymore",
    "dont see the point anymore", "what's the point anymore", "whats the point anymore",
    "i can't go on", "i cant go on", "can't go on anymore", "cant go on anymore",
    "no reason to go on", "can't do this anymore", "cant do this anymore",
    "don't want to be here", "dont want to be here", "can't take it anymore",
    "cant take it anymore", "give up on life",
    // Abuse stems (B2.2).
    "being abused", "he hits me", "she hits me", "they hit me", "hits me", "beats me",
    "hurts me", "afraid to go home", "scared to go home", "not safe at home",
  ],
  he: [
    "להתאבד", "אתאבד", "אובדני", "אובדנית", "לשים סוף", "לסיים עם הכל", "לא רוצה לחיות",
    "אין לי סיבה לחיות", "לפגוע בעצמי", "לעשות לעצמי משהו", "עדיף שאמות",
    // Passive ideation / hopelessness stems (B2.2).
    "אין לי טעם", "אין טעם להמשיך", "אין יותר טעם", "מה הטעם בכלל", "לא רואה טעם",
    "אני לא יכול להמשיך", "אני לא יכולה להמשיך", "לא יכול יותר", "לא יכולה יותר",
    "אני לא רוצה להיות פה", "אני לא רוצה להיות כאן", "נשבר לי", "אין לי כוח להמשיך",
    // Abuse stems (B2.2).
    "מתעלל בי", "מתעללת בי", "מכה אותי", "מרביץ לי", "מרביצה לי", "פוחד לחזור הביתה",
    "פוחדת לחזור הביתה", "לא בטוח בבית", "אלימות בבית",
  ],
  fr: [
    "suicide", "suicidaire", "me tuer", "me suicider", "en finir", "veux mourir",
    "envie de mourir", "plus envie de vivre", "me faire du mal", "plus de raison de vivre",
    "mieux mort", "mieux morte",
    // Passive ideation / hopelessness stems (B2.2).
    "je ne vois pas l'intérêt", "je ne vois plus l'intérêt", "à quoi bon",
    "à quoi bon continuer", "ça ne sert à rien de continuer", "je ne peux plus continuer",
    "je n'en peux plus", "je ne veux plus être là", "plus de raison de continuer",
    "je n'ai plus la force",
    // Abuse stems (B2.2).
    "il me frappe", "elle me frappe", "ils me frappent", "on me frappe", "me bat",
    "me maltraite", "peur de rentrer", "pas en sécurité à la maison", "violence à la maison",
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
    const { text: raw, usage } = await aiProvider().complete(chat);
    // Fire-and-forget cost tracking (Phase 4); recordUsage can't break this path.
    if (usage) void recordUsage("crisis", process.env.OPENAI_MODEL || "gpt-5.4", usage);
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
