import { getNextAvailable } from "@/features/scheduling";
import { getMatchCandidates } from "@/features/therapists";
import type {
  IntakeSelection,
  IntakeMatch,
  LanguageId,
  ConcernId,
  StyleId,
} from "./contract";

// Step 7 — deterministic matching (INTAKE_BUILD_SPEC §Step 7). No model: hard
// filters + a tunable score over the chip selection; the therapist is chosen by
// code, validated against the catalog, and the slot is filled by the scheduler. The
// rationale is grounded in a real quote from the active-locale bio, never invented.

// Tunable config — calibrate via the eval; NOT fixed truth.
const CONCERN_SCORE = 3; // skills/modalities cover the concern
const STYLE_SCORE = 2; // modalities cover the support style
const MIN_SCORE = 3; // below this → no match (CLARIFY)

const CONCERN_KEYWORDS: Record<ConcernId, string[]> = {
  anxiety: ["anxiety", "anxious", "panic", "worry"],
  stress_burnout: ["stress", "burnout", "burn-out", "overwhelm", "work"],
  relationships: ["couple", "relationship", "marriage", "family", "intimacy"],
  trauma: ["trauma", "ptsd", "emdr", "abuse"],
  grief: ["grief", "loss", "bereavement", "mourning"],
  sleep: ["sleep", "insomnia"],
  depression: ["depression", "depressive", "mood"],
  something_else: [],
};

const STYLE_KEYWORDS: Record<StyleId, string[]> = {
  practical_tools: ["cbt", "dbt", "solution", "practical", "skills", "behavioral"],
  explore_feelings: ["psychodynamic", "insight", "humanistic", "person-centered", "emotion"],
  mindfulness: ["mindfulness", "mbct", "mbsr", "meditation", "acceptance", "act"],
  faith_aligned: ["faith", "religious", "spiritual", "torah", "jewish", "observant"],
};

function firstSentenceWith(bio: string, term: string): string {
  const sentences = bio.split(/(?<=[.!?])\s+/);
  const found = term ? sentences.find((s) => s.toLowerCase().includes(term)) : undefined;
  let q = (found ?? sentences[0] ?? bio).trim();
  if (q.length > 140) q = q.slice(0, 139).trimEnd() + "…";
  return q;
}

function rationaleText(locale: LanguageId, quote: string): string {
  if (locale === "he") return `בפרופיל שלהם/ן מצוין: "${quote}" — בדיוק מה שתיארת.`;
  if (locale === "fr") return `Leur profil mentionne : « ${quote} » — précisément ce que vous décrivez.`;
  return `Their profile mentions: "${quote}" — exactly what you described.`;
}

function matchMessage(locale: LanguageId, name: string, rationale: string): string {
  if (locale === "he") return `${name} נראה/ית התאמה ממש טובה עבורך. ${rationale}`;
  if (locale === "fr") return `${name} semble être un très bon choix pour vous. ${rationale}`;
  return `${name} looks like a really good fit for you. ${rationale}`;
}

/** Pick the best-fitting therapist for the chip selection, or null (→ CLARIFY).
 *  `locale` is the conversation language (used for the bio quote + copy);
 *  `selection.language` is the therapist-language hard filter. */
export async function pickTherapist(
  selection: IntakeSelection,
  locale: LanguageId,
): Promise<{ match: IntakeMatch; assistantMessage: string } | null> {
  const { concern, style, language, genderPreference } = selection;
  const candidates = await getMatchCandidates();

  const pool = candidates.filter((c) => {
    if (language && !c.languages.includes(language)) return false;
    if (genderPreference === "female" && c.gender !== "FEMALE") return false;
    if (genderPreference === "male" && c.gender !== "MALE") return false;
    return true;
  });

  const concernKw = concern ? CONCERN_KEYWORDS[concern] : [];
  const styleKw = style ? STYLE_KEYWORDS[style] : [];

  const ranked = pool
    .map((c) => {
      const hay = (c.skills.join(" ") + " " + c.modalities.join(" ")).toLowerCase();
      const term = concernKw.find((k) => hay.includes(k));
      let score = 0;
      if (term) score += CONCERN_SCORE;
      if (styleKw.some((k) => hay.includes(k))) score += STYLE_SCORE;
      return { c, score, term };
    })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || b.c.rating - a.c.rating);

  if (!ranked.length) return null;

  const best = ranked[0];
  const bio = best.c.bio[locale] ?? best.c.bio.en ?? "";
  const matchedTerm = best.term ?? concernKw[0] ?? "";
  const quote = firstSentenceWith(bio, matchedTerm);
  const rationale = rationaleText(locale, quote);
  const nextAvailable = await getNextAvailable(best.c.id, new Date().toISOString());

  return {
    match: {
      therapistId: best.c.id,
      rationale,
      rationaleSource: { field: "bio", matchedTerm, quote },
      nextAvailable,
    },
    assistantMessage: matchMessage(locale, best.c.name, rationale),
  };
}
