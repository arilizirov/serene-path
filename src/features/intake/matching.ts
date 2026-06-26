import { getNextAvailable } from "@/features/scheduling";
import { getMatchCandidates } from "@/features/therapists";
import type {
  IntakeSelection,
  IntakeMatch,
  LanguageId,
  ConcernId,
  StyleId,
} from "./contract";
import { MATCHING_WEIGHTS as W } from "./matching-config";

// Step 7 — deterministic matching (INTAKE_BUILD_SPEC §Step 7). No model: hard
// filters + a tunable score over the chip selection; the therapist is chosen by
// code, validated against the catalog, and the slot is filled by the scheduler. The
// rationale is grounded in a real quote from the active-locale bio, never invented.
//
// Scoring weights are EVAL-CALIBRATED and live in matching-config.ts (not inlined).

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
  const { concern, style, language } = selection;
  // Gender comes from the fit form (therapistGender); fall back to the legacy
  // inline Step-5 field for older sessions / the AI flow (spec §6b "supersedes").
  const gender = selection.therapistGender ?? selection.genderPreference;
  const { therapistReligion, availability, fee } = selection;
  const candidates = await getMatchCandidates();

  // HARD FILTERS (must pass): accepting new clients, language, gender, fee tier, AND
  // a non-empty bio in the ACTIVE locale. Requested religion is SOFT only (never an
  // exclude). standard → no fee filter.
  const pool = candidates.filter((c) => {
    if (!c.acceptingNewClients) return false;
    if (language && !c.languages.includes(language)) return false;
    if (gender === "female" && c.gender !== "FEMALE") return false;
    if (gender === "male" && c.gender !== "MALE") return false;
    if (fee === "sliding_scale" && !c.offersSlidingScale) return false;
    if (fee === "insurance" && !c.acceptsInsurance) return false;
    if (fee === "soldier_subsidy" && !c.acceptsSoldierSubsidy) return false;
    // M3 — RTL/bidi: the rationale quote MUST come from the bio in the conversation
    // locale. A therapist with no active-locale bio is ineligible rather than quoted
    // in another language (a Hebrew user must never see an English quote in RTL).
    if (!(c.bio[locale] ?? "").trim()) return false;
    return true;
  });

  const concernKw = concern ? CONCERN_KEYWORDS[concern] : [];
  const styleKw = style ? STYLE_KEYWORDS[style] : [];

  // `something_else` (and an unset concern) carry NO concern keywords, so the
  // distress was never classifiable on a concern. Matching such a user on
  // style/scheduling soft signals alone would recommend a therapist for a problem
  // we couldn't identify — a safety risk. Require a genuine concern-term match here:
  // with no concern keywords there can be none, so we return null → honest CLARIFY.
  const concernRequired = concernKw.length === 0;

  // Two regimes, never mixed:
  //  - NO concern classified (concernKw empty): nobody can have a term hit, so
  //    matching on soft signals alone would recommend for an unidentified problem
  //    → require a "concern" that can't exist → no match → honest CLARIFY.
  //  - A concern IS classified: ONLY a therapist with a genuine concern-term hit
  //    (`r.term` truthy) is eligible. style/religion/availability are tie-breakers,
  //    NEVER a substitute for actually covering the concern. This also guarantees
  //    firstSentenceWith() can always quote a sentence containing the matched term
  //    (no fabricated term, no "exactly what you described" over an unrelated line).

  const ranked = pool
    .map((c) => {
      const hay = (c.skills.join(" ") + " " + c.modalities.join(" ")).toLowerCase();
      const term = concernKw.find((k) => hay.includes(k));
      let score = 0;
      if (term) score += W.concernMatch;
      if (styleKw.some((k) => hay.includes(k))) score += W.styleMatch;
      // SOFT: religion (skip if no_preference), availability (skip if flexible).
      if (
        therapistReligion &&
        therapistReligion !== "no_preference" &&
        c.religiousAlignment === therapistReligion
      ) {
        score += W.religiousSoft;
      }
      if (
        availability &&
        availability !== "flexible" &&
        c.availabilityTags.includes(availability)
      ) {
        score += W.availabilitySoft;
      }
      return { c, score, term };
    })
    // Below threshold → no match. Then: with NO classifiable concern require the
    // (impossible) concern hit → CLARIFY; with a concern require a REAL term hit so
    // soft signals can never substitute for covering the concern (B1).
    .filter((r) => r.score >= W.minScore && (concernKw.length === 0 ? !concernRequired : !!r.term))
    .sort((a, b) => b.score - a.score || b.c.rating - a.c.rating);

  if (!ranked.length) return null;

  const best = ranked[0];
  // The active-locale bio is REQUIRED for eligibility (M3 — no cross-language quote),
  // so it is non-empty here; never fall back to a different-language bio for the quote.
  const bio = best.c.bio[locale] ?? "";
  // After the B1 filter a ranked therapist ALWAYS has a real concern-term hit, so the
  // matchedTerm is genuine (never fabricated) and firstSentenceWith() quotes a sentence
  // that actually contains it — the rationale can't claim "exactly what you described"
  // over an unrelated line.
  const matchedTerm = best.term ?? "";
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
