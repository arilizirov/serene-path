import type { LanguageId } from "./contract";

// CRISIS guardrail (INTAKE_BUILD_SPEC §Guardrails). Runs on every free-text input.
//
// ⚠️ RESOURCES BELOW ARE PUBLIC ISRAEL LINES, PENDING OWNER VERIFICATION — confirm
// the current numbers before launch (the spec requires human-verified lines).
//
// Detection here is an interim HIGH-RECALL keyword pass; Stage E layers a model
// classifier on top. It is deliberately not the only safeguard: `get_help_now` is a
// persistent secondary action on every turn, independent of whether this fires.

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

// ⚠️ VERIFY BEFORE LAUNCH — owner to confirm these are current Israel lines.
const RESOURCES: Record<LanguageId, string> = {
  en: "If you're in immediate danger, call 101 (medical) or 100 (police) right now. For emotional first aid any time, ERAN is at 1201, and Sahar offers online support at sahar.org.il. NATAL (trauma): 1-800-363-363. You don't have to carry this alone — please reach out to one of these now.",
  he: 'אם את/ה בסכנה מיידית, חייג/י עכשיו 101 (מד"א) או 100 (משטרה). לעזרה ראשונה נפשית בכל שעה — ער"ן בטלפון 1201, וסה"ר בתמיכה מקוונת באתר sahar.org.il. נט"ל (טראומה): 1-800-363-363. אינך צריך/ה לשאת את זה לבד — אנא פנה/י לאחד מהם עכשיו.',
  fr: "En cas de danger immédiat, appelez le 101 (secours médical) ou le 100 (police) maintenant. Pour un premier soutien émotionnel à tout moment : ERAN au 1201, et Sahar en ligne sur sahar.org.il. NATAL (trauma) : 1-800-363-363. Vous n'avez pas à porter cela seul·e — contactez l'un d'eux maintenant.",
};

/** The crisis message for a locale (human-authored, never generated). */
export function crisisMessage(locale: LanguageId): string {
  return RESOURCES[locale];
}
