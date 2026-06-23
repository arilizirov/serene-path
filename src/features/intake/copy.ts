import type { Locale } from "./types";

// All user-facing scripted-intake copy, per locale (he/en/fr). The flow:
// greet (the home page) → 2 probes → respect + mirror + confirm → match.

type LocaleCopy = {
  probe1: string;
  probe2: string;
  confirmYes: string;
  confirmNo: string;
  notQuite: string;
  noMatch: string;
  support: string;
  respect: string;
  fallbackConcern: string;
  and: string;
  concerns: Record<string, string>;
};

const COPY: Record<Locale, LocaleCopy> = {
  en: {
    probe1: "Thank you for sharing that. What's been feeding that most right now?",
    probe2: "And how long has this been sitting with you?",
    confirmYes: "Yes, that's right",
    confirmNo: "Not quite",
    notQuite: "Thank you for telling me — I want to get this right. What would you change or add?",
    noMatch: "Thank you for trusting me with this. I don't yet have someone who's a clear fit for what you described — but you deserve the right person, so let me note this so we can find them for you.",
    support: "Whatever you're carrying, we'll find someone who can walk through it with you.",
    respect: "You've been holding a lot on your own — that takes real strength.",
    fallbackConcern: "a great deal right now",
    and: "and",
    concerns: {
      "stress-burnout": "stress and burnout",
      anxiety: "anxiety",
      depression: "low and heavy days",
      sleep: "trouble resting",
      relationships: "strain in a relationship",
      trauma: "the weight of trauma",
      grief: "grief and loss",
    },
  },
  he: {
    probe1: "תודה ששיתפת. מה הכי מזין את זה כרגע?",
    probe2: "וכמה זמן זה כבר מלווה אותך?",
    confirmYes: "כן, זה נכון",
    confirmNo: "לא בדיוק",
    notQuite: "תודה שאמרת לי — חשוב לי להבין נכון. מה היית משנה או מוסיף?",
    noMatch: "תודה שנתת בי אמון. עדיין אין לי מטפל/ת שמתאים/ה בבירור למה שתיארת — אבל מגיע לך האדם הנכון, אז ארשום את זה כדי שנמצא אותו עבורך.",
    support: "מה שלא תישא/י, נמצא מישהו שילווה אותך בזה.",
    respect: "החזקת הרבה לבד — זה דורש כוח אמיתי.",
    fallbackConcern: "הרבה כרגע",
    and: "ו",
    concerns: {
      "stress-burnout": "לחץ ושחיקה",
      anxiety: "חרדה",
      depression: "ימים כבדים ומדכאים",
      sleep: "קושי לנוח",
      relationships: "מתח בזוגיות",
      trauma: "משקל של טראומה",
      grief: "אובדן ושכול",
    },
  },
  fr: {
    probe1: "Merci de partager cela. Qu'est-ce qui nourrit le plus cela en ce moment ?",
    probe2: "Et depuis combien de temps cela vous accompagne-t-il ?",
    confirmYes: "Oui, c'est ça",
    confirmNo: "Pas tout à fait",
    notQuite: "Merci de me le dire — je veux bien comprendre. Que changeriez-vous ou ajouteriez-vous ?",
    noMatch: "Merci de votre confiance. Je n'ai pas encore quelqu'un qui corresponde clairement à ce que vous décrivez — mais vous méritez la bonne personne, alors je le note pour que nous la trouvions.",
    support: "Quoi que vous portiez, nous trouverons quelqu'un pour traverser cela avec vous.",
    respect: "Vous portez beaucoup, seul·e — cela demande une vraie force.",
    fallbackConcern: "beaucoup en ce moment",
    and: "et",
    concerns: {
      "stress-burnout": "le stress et l'épuisement",
      anxiety: "l'anxiété",
      depression: "des journées lourdes et sombres",
      sleep: "des difficultés à vous reposer",
      relationships: "des tensions dans une relation",
      trauma: "le poids d'un traumatisme",
      grief: "un deuil",
    },
  },
};

export const copy = (locale: Locale) => COPY[locale];
export const confirmOptions = (locale: Locale) => [COPY[locale].confirmYes, COPY[locale].confirmNo];

/** True when the confirm answer is "not quite" (chip text or a typed negation). */
export function isConfirmNo(locale: Locale, msg: string): boolean {
  const m = msg.trim().toLowerCase();
  if (m === COPY[locale].confirmNo.toLowerCase()) return true;
  return /^(not quite|no\b|nope|לא|לא בדיוק|non|pas)/i.test(m);
}

function humanizeConcerns(locale: Locale, concerns: string[]): string {
  const c = COPY[locale];
  const labels = concerns.map((k) => c.concerns[k]).filter(Boolean);
  if (labels.length === 0) return c.fallbackConcern;
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} ${c.and} ${labels[labels.length - 1]}`;
}

/** Respect + mirror + a confirm question (the chips are returned separately). */
export function mirrorMessage(locale: Locale, concerns: string[]): string {
  const phrase = humanizeConcerns(locale, concerns);
  const c = COPY[locale];
  if (locale === "he") {
    return `${c.respect}\n\nמה שאני שומעת הוא שאת/ה נושא/ת ${phrase}, וזה מלווה אותך לאורך היום. זה הגיוני לחלוטין. רק כדי לוודא שהבנתי — זה הלב של מה שעובר עליך עכשיו? ${c.support}`;
  }
  if (locale === "fr") {
    return `${c.respect}\n\nCe que j'entends, c'est que vous portez ${phrase}, et que cela vous suit tout au long de la journée. C'est tout à fait compréhensible. Juste pour être sûr d'avoir bien compris — c'est bien le cœur de ce que vous traversez ? ${c.support}`;
  }
  return `${c.respect}\n\nWhat I'm hearing is that you've been carrying ${phrase}, and it's been following you through the day. That makes complete sense. Just to make sure I've got it — is that the heart of what's going on for you? ${c.support}`;
}

function whenSuffix(locale: Locale, iso: string | null): string {
  if (!iso) return "";
  const when = new Date(iso).toLocaleString(locale, {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });
  if (locale === "he") return ` יש להם/ן זמן פנוי ב${when}.`;
  if (locale === "fr") return ` Iel a une disponibilité ${when}.`;
  return ` They have an opening ${when}.`;
}

/** The rationale string (also shown on the match card). */
export function buildRationale(locale: Locale, concept: string, snippet: string): string {
  const label = COPY[locale].concerns[concept] ?? COPY[locale].fallbackConcern;
  if (locale === "he")
    return `בפרופיל שלהם/ן כתוב "${snippet}", וזה מדבר ישירות אל ${label} שתיארת — בדיוק ההתאמה הנכונה.`;
  if (locale === "fr")
    return `leur profil indique « ${snippet} », ce qui répond directement à ${label} que vous décrivez — exactement le bon profil pour vous.`;
  return `their profile says "${snippet}", which speaks directly to ${label} you described — exactly the right fit for you.`;
}

/** The match presentation message (confident sell). */
export function matchMessage(
  locale: Locale,
  name: string,
  rationale: string,
  nextAvailable: string | null,
): string {
  const tail = whenSuffix(locale, nextAvailable);
  if (locale === "he")
    return `תודה. בהתבסס על מה ששיתפת, ${name} נראה/ית התאמה חזקה עבורך — ${rationale}${tail}`;
  if (locale === "fr")
    return `Merci. D'après ce que vous avez partagé, ${name} semble être un excellent choix pour vous — ${rationale}${tail}`;
  return `Thank you. Based on what you've shared, ${name} looks like a strong fit for you — ${rationale}${tail}`;
}
