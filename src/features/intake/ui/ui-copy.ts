import type { Locale } from "../types";
import { SECONDARY_LABELS } from "../flow-copy";

// Shared localized UI strings for BOTH intake chat surfaces (chip + AI). These were
// duplicated as ad-hoc Record<Locale,string> maps inside chip-intake-chat.tsx; they
// now live here so the AI flow (intake-chat.tsx) renders the SAME he/fr/en copy and
// nothing English leaks across a flow that's one toggle-tap from every visitor.
// RTL is handled at render (dir) — these are just the strings.

export const ERROR_REPLY: Record<Locale, string> = {
  en: "Something went wrong. Please try again.",
  he: "משהו השתבש. נסו שוב.",
  fr: "Une erreur s'est produite. Veuillez réessayer.",
};

export const TEXT_PLACEHOLDER: Record<Locale, string> = {
  en: "Tell me what's going on…",
  he: "ספרו לי מה עובר עליכם…",
  fr: "Dites-moi ce qui se passe…",
};

export const SEND_LABEL: Record<Locale, string> = {
  en: "Send",
  he: "שליחה",
  fr: "Envoyer",
};

export const MATCH_TITLE: Record<Locale, string> = {
  en: "Your recommended therapist",
  he: "המטפל/ת המומלץ/ת עבורך",
  fr: "Votre thérapeute recommandé·e",
};

// The AI flow can surface MORE than one suggestion, so its panel heading is plural.
export const SUGGESTED_THERAPISTS: Record<Locale, string> = {
  en: "Suggested therapists",
  he: "מטפלים מומלצים",
  fr: "Thérapeutes suggéré·e·s",
};

export const VIEW_PROFILE: Record<Locale, string> = {
  en: "View profile →",
  he: "← לצפייה בפרופיל",
  fr: "Voir le profil →",
};

export const NEXT_OPENING: Record<Locale, string> = {
  en: "Next opening:",
  he: "מועד פנוי:",
  fr: "Prochaine disponibilité :",
};

export const FOLLOWUP_CONFIRM: Record<Locale, string> = {
  en: "Thank you — someone from our team will reach out to you soon.",
  he: "תודה — מישהו מהצוות שלנו ייצור איתך קשר בקרוב.",
  fr: "Merci — un membre de notre équipe vous contactera bientôt.",
};

// AI-flow engine toggle labels (the comparison switch inside intake-chat.tsx).
export const ENGINE_AI_LABEL: Record<Locale, string> = {
  en: "AI",
  he: 'בינה מלאכותית',
  fr: "IA",
};

export const ENGINE_GUIDED_LABEL: Record<Locale, string> = {
  en: "Guided",
  he: "מודרך",
  fr: "Guidé",
};

// Shown when AI mode is requested but no API key is configured (falls back to guided).
export const AI_KEY_NOTICE: Record<Locale, string> = {
  en: "AI mode needs an API key — showing the guided flow for now.",
  he: "מצב הבינה המלאכותית דורש מפתח API — מוצג בינתיים המסלול המודרך.",
  fr: "Le mode IA nécessite une clé API — affichage du mode guidé pour le moment.",
};

// Persistent crisis help (B2): the AI flow has no secondaryActions on its response,
// so it renders this button + copy directly, on EVERY turn, like the chip UI's
// always-visible get_help_now. The resources string itself is crisisMessage(locale).
export const GET_HELP_NOW_LABEL: Record<Locale, string> = {
  en: SECONDARY_LABELS.en.get_help_now,
  he: SECONDARY_LABELS.he.get_help_now,
  fr: SECONDARY_LABELS.fr.get_help_now,
};
