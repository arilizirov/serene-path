import type {
  LanguageId,
  ConcernId,
  StyleId,
  GenderPrefId,
  ConfirmId,
} from "./contract";

// Trilingual copy for the chip-driven intake (INTAKE_BUILD_SPEC §Pinned copy +
// chip sets). Backend holds IDs; these are the labels/messages the UI shows. The
// step-6 reflection is NOT here — it's model-generated (see the CONFIRM call); the
// templated confirm below is the failure-only fallback.

type ChipLabels = {
  concern: Record<ConcernId, string>;
  style: Record<StyleId, string>;
  language: Record<LanguageId, string>;
  genderPreference: Record<GenderPrefId, string>;
  confirm: Record<ConfirmId, string>;
};

export const CHIP_LABELS: Record<LanguageId, ChipLabels> = {
  en: {
    concern: { anxiety: "Anxiety", stress_burnout: "Stress & burnout", relationships: "Relationships", trauma: "Trauma", grief: "Grief & loss", sleep: "Sleep", depression: "Depression", something_else: "Something else" },
    style: { practical_tools: "Practical tools", explore_feelings: "Exploring feelings", mindfulness: "Mindfulness", faith_aligned: "Faith-aligned" },
    language: { he: "עברית", en: "English", fr: "Français" },
    genderPreference: { no_preference: "No preference", female: "A woman", male: "A man" },
    confirm: { yes: "Yes, that's right", not_quite: "Not quite" },
  },
  he: {
    concern: { anxiety: "חרדה", stress_burnout: "לחץ ושחיקה", relationships: "זוגיות ויחסים", trauma: "טראומה", grief: "אובדן ושכול", sleep: "שינה", depression: "דיכאון", something_else: "משהו אחר" },
    style: { practical_tools: "כלים מעשיים", explore_feelings: "חקירת רגשות", mindfulness: "מיינדפולנס", faith_aligned: "מותאם לאמונה" },
    language: { he: "עברית", en: "English", fr: "Français" },
    genderPreference: { no_preference: "אין העדפה", female: "אישה", male: "גבר" },
    confirm: { yes: "כן, זה נכון", not_quite: "לא בדיוק" },
  },
  fr: {
    concern: { anxiety: "Anxiété", stress_burnout: "Stress et épuisement", relationships: "Relations", trauma: "Traumatisme", grief: "Deuil", sleep: "Sommeil", depression: "Dépression", something_else: "Autre chose" },
    style: { practical_tools: "Outils pratiques", explore_feelings: "Explorer les émotions", mindfulness: "Pleine conscience", faith_aligned: "En accord avec la foi" },
    language: { he: "עברית", en: "English", fr: "Français" },
    genderPreference: { no_preference: "Peu importe", female: "Une femme", male: "Un homme" },
    confirm: { yes: "Oui, c'est ça", not_quite: "Pas tout à fait" },
  },
};

type FlowMessages = {
  greeting: string;
  open: string;
  concernQ: string;
  styleQ: string;
  languageQ: string;
  genderQ: string;
  somethingElse: string;
  respect: string;
  support: string;
  noMatch: string;
};

export const FLOW_MSG: Record<LanguageId, FlowMessages> = {
  en: {
    greeting: "Hi — I'm really glad you're here. Taking this step isn't easy, so thank you for showing up for yourself.",
    open: "How are you feeling today?",
    concernQ: "Thank you for trusting me with that. Which of these feels closest to what you're carrying?",
    styleQ: "That makes sense. What kind of support feels right for you?",
    languageQ: "And which language would you feel most comfortable in?",
    genderQ: "Last thing — any preference for who you speak with?",
    somethingElse: "Of course — tell me in your own words what's been going on.",
    respect: "You've been carrying a lot on your own — that takes real strength.",
    support: "Whatever the answer, we'll find someone who can walk through this with you.",
    noMatch: "I don't yet have someone who's a clear fit for what you described — would you like to browse our therapists, or have someone reach out?",
  },
  he: {
    greeting: "היי — אני ממש שמחה שאת/ה כאן. הצעד הזה לא פשוט, אז תודה שהגעת בשביל עצמך.",
    open: "איך את/ה מרגיש/ה היום?",
    concernQ: "תודה ששיתפת אותי בזה. מה מתוך אלה הכי קרוב למה שאת/ה נושא/ת?",
    styleQ: "זה הגיוני. איזה סוג של תמיכה מרגיש לך נכון?",
    languageQ: "ובאיזו שפה תרגיש/י הכי בנוח?",
    genderQ: "דבר אחרון — יש העדפה עם מי לדבר?",
    somethingElse: "בוודאי — ספר/י לי במילים שלך מה עובר עליך.",
    respect: "החזקת הרבה לבד — זה דורש כוח אמיתי.",
    support: "ויהיה אשר יהיה, נמצא מישהו שילווה אותך בזה.",
    noMatch: "עדיין אין לי מישהו שמתאים בבירור למה שתיארת — תרצה/י לעיין במטפלים שלנו, או שמישהו יחזור אליך?",
  },
  fr: {
    greeting: "Bonjour — je suis vraiment contente que vous soyez là. Faire ce pas n'est pas facile, alors merci d'être présent·e pour vous-même.",
    open: "Comment vous sentez-vous aujourd'hui ?",
    concernQ: "Merci de votre confiance. Lequel de ces éléments est le plus proche de ce que vous portez ?",
    styleQ: "C'est compréhensible. Quel type de soutien vous conviendrait le mieux ?",
    languageQ: "Et dans quelle langue seriez-vous le plus à l'aise ?",
    genderQ: "Dernière chose — avez-vous une préférence sur la personne à qui parler ?",
    somethingElse: "Bien sûr — dites-moi avec vos mots ce qui se passe.",
    respect: "Vous portez beaucoup, seul·e — cela demande une vraie force.",
    support: "Quoi qu'il en soit, nous trouverons quelqu'un pour traverser cela avec vous.",
    noMatch: "Je n'ai pas encore quelqu'un qui corresponde clairement à ce que vous décrivez — souhaitez-vous parcourir nos thérapeutes, ou qu'on vous recontacte ?",
  },
};

export const labels = (locale: LanguageId) => CHIP_LABELS[locale];
export const flowMsg = (locale: LanguageId) => FLOW_MSG[locale];
