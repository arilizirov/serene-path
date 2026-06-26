import type {
  LanguageId,
  ConcernId,
  StyleId,
  GenderPrefId,
  ConfirmId,
  FitGateId,
  TherapistGenderId,
  TherapistReligionId,
  AvailabilityId,
  FeeId,
  SecondaryAction,
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
  // Step 6b fit form (taxonomies kept in this locale config — the religion
  // spectrum differs FR vs IL; spec §6b). Ids globally unique across all sets.
  fitGate: Record<FitGateId, string>;
  therapistGender: Record<TherapistGenderId, string>;
  therapistReligion: Record<TherapistReligionId, string>;
  availability: Record<AvailabilityId, string>;
  fee: Record<FeeId, string>;
};

export const CHIP_LABELS: Record<LanguageId, ChipLabels> = {
  en: {
    concern: { anxiety: "Anxiety", stress_burnout: "Stress & burnout", relationships: "Relationships", trauma: "Trauma", grief: "Grief & loss", sleep: "Sleep", depression: "Depression", something_else: "Something else" },
    style: { practical_tools: "Practical tools", explore_feelings: "Exploring feelings", mindfulness: "Mindfulness", faith_aligned: "Faith-aligned" },
    language: { he: "עברית", en: "English", fr: "Français" },
    genderPreference: { no_preference: "No preference", female: "A woman", male: "A man" },
    confirm: { yes: "Yes, that's right", not_quite: "Not quite" },
    fitGate: { sure: "Sure", skip: "Skip" },
    therapistGender: { no_preference: "No preference", female: "A woman", male: "A man" },
    therapistReligion: { no_preference: "No preference", secular: "Secular", masorti: "Traditional (Masorti)", dati: "Religious (Dati)", haredi: "Haredi" },
    availability: { weekday_day: "Weekday daytime", evenings: "Evenings", weekends: "Weekends", flexible: "I'm flexible" },
    fee: { standard: "Standard rate", sliding_scale: "Sliding scale", insurance: "Through insurance", soldier_subsidy: "Soldier subsidy" },
  },
  he: {
    concern: { anxiety: "חרדה", stress_burnout: "לחץ ושחיקה", relationships: "זוגיות ויחסים", trauma: "טראומה", grief: "אובדן ושכול", sleep: "שינה", depression: "דיכאון", something_else: "משהו אחר" },
    style: { practical_tools: "כלים מעשיים", explore_feelings: "חקירת רגשות", mindfulness: "מיינדפולנס", faith_aligned: "מותאם לאמונה" },
    language: { he: "עברית", en: "English", fr: "Français" },
    genderPreference: { no_preference: "אין העדפה", female: "אישה", male: "גבר" },
    confirm: { yes: "כן, זה נכון", not_quite: "לא בדיוק" },
    fitGate: { sure: "בשמחה", skip: "אפשר לדלג" },
    therapistGender: { no_preference: "אין העדפה", female: "אישה", male: "גבר" },
    therapistReligion: { no_preference: "אין העדפה", secular: "חילוני/ת", masorti: "מסורתי/ת", dati: "דתי/ה", haredi: "חרדי/ת" },
    availability: { weekday_day: "ימי חול, שעות היום", evenings: "שעות ערב", weekends: "סופי שבוע", flexible: "גמיש/ה" },
    fee: { standard: "תעריף רגיל", sliding_scale: "תשלום מדורג", insurance: "דרך ביטוח", soldier_subsidy: "סבסוד לחיילים" },
  },
  fr: {
    concern: { anxiety: "Anxiété", stress_burnout: "Stress et épuisement", relationships: "Relations", trauma: "Traumatisme", grief: "Deuil", sleep: "Sommeil", depression: "Dépression", something_else: "Autre chose" },
    style: { practical_tools: "Outils pratiques", explore_feelings: "Explorer les émotions", mindfulness: "Pleine conscience", faith_aligned: "En accord avec la foi" },
    language: { he: "עברית", en: "English", fr: "Français" },
    genderPreference: { no_preference: "Peu importe", female: "Une femme", male: "Un homme" },
    confirm: { yes: "Oui, c'est ça", not_quite: "Pas tout à fait" },
    fitGate: { sure: "Bien sûr", skip: "Passer" },
    therapistGender: { no_preference: "Peu importe", female: "Une femme", male: "Un homme" },
    therapistReligion: { no_preference: "Peu importe", secular: "Laïque", masorti: "Traditionaliste (Masorti)", dati: "Religieux (Dati)", haredi: "Haredi" },
    availability: { weekday_day: "En semaine, journée", evenings: "En soirée", weekends: "Week-ends", flexible: "Je suis flexible" },
    fee: { standard: "Tarif standard", sliding_scale: "Tarif dégressif", insurance: "Via l'assurance", soldier_subsidy: "Subvention militaire" },
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
  // Step 6b fit-form prompts (tap-only, $0).
  fitGateQ: string;
  fitGenderQ: string;
  fitReligionQ: string;
  fitAvailabilityQ: string;
  fitFeeQ: string;
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
    fitGateQ: "Before I match you, can I ask a few quick questions to get the fit right?",
    fitGenderQ: "What gender therapist would you feel most comfortable with?",
    fitReligionQ: "What religious background would you like your therapist to have? (so I can find someone who understands your world)",
    fitAvailabilityQ: "When would you usually want to meet?",
    fitFeeQ: "And what works best for you around fees?",
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
    fitGateQ: "לפני שאני מתאים/ה לך מטפל/ת, אפשר לשאול כמה שאלות קצרות כדי לדייק את ההתאמה?",
    fitGenderQ: "עם מטפל/ת מאיזה מגדר תרגיש/י הכי בנוח?",
    fitReligionQ: "איזה רקע דתי תרצה/י שיהיה למטפל/ת? (כדי שאמצא מישהו שמבין/ה את העולם שלך)",
    fitAvailabilityQ: "מתי בדרך כלל יתאים לך להיפגש?",
    fitFeeQ: "ומה הכי מתאים לך בנוגע לעלות?",
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
    fitGateQ: "Avant de vous proposer quelqu'un, puis-je poser quelques questions rapides pour affiner la correspondance ?",
    fitGenderQ: "Avec un·e thérapeute de quel genre seriez-vous le plus à l'aise ?",
    fitReligionQ: "Quel parcours religieux souhaiteriez-vous pour votre thérapeute ? (pour trouver quelqu'un qui comprend votre univers)",
    fitAvailabilityQ: "Quand souhaiteriez-vous généralement vous rencontrer ?",
    fitFeeQ: "Et qu'est-ce qui vous conviendrait le mieux concernant les honoraires ?",
  },
};

export const labels = (locale: LanguageId) => CHIP_LABELS[locale];
export const flowMsg = (locale: LanguageId) => FLOW_MSG[locale];

/** Localized label for any chip id. Ids are globally unique across the sets, except
 *  the gender prefs (no_preference/female/male) which share labels between the
 *  legacy genderPreference set and the fit-form therapistGender set — resolved the
 *  same either way. The fit-form sets are checked after the originals. */
export function chipLabel(locale: LanguageId, id: string): string {
  const l = CHIP_LABELS[locale];
  return (
    l.concern[id as ConcernId] ??
    l.style[id as StyleId] ??
    l.language[id as LanguageId] ??
    l.genderPreference[id as GenderPrefId] ??
    l.confirm[id as ConfirmId] ??
    l.fitGate[id as FitGateId] ??
    l.therapistReligion[id as TherapistReligionId] ??
    l.availability[id as AvailabilityId] ??
    l.fee[id as FeeId] ??
    id
  );
}

export const SECONDARY_LABELS: Record<LanguageId, Record<SecondaryAction, string>> = {
  en: { get_help_now: "Get help now", browse_all: "Browse all therapists", human_followup: "Have someone reach out" },
  he: { get_help_now: "קבלת עזרה עכשיו", browse_all: "עיון בכל המטפלים", human_followup: "שמישהו יחזור אליי" },
  fr: { get_help_now: "Obtenir de l'aide", browse_all: "Voir tous les thérapeutes", human_followup: "Être recontacté·e" },
};
