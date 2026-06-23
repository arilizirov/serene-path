import type { CatalogEntry } from "@/features/therapists";

// Deterministic concern tagging + therapist scoring for the scripted intake
// (ported from the eval ScriptedIntakeProvider, adapted to the real catalog).
// Keyword-based: simple, predictable, no model call.

export const TAGS: Record<string, string[]> = {
  "stress-burnout": ["stress", "burnout", "burn-out", "overwhelmed", "exhausted", "work", "pressure"],
  anxiety: ["anxiety", "anxious", "panic", "worry", "worried"],
  depression: ["depression", "depressed", "hopeless", "empty", "low", "crying", "cry"],
  sleep: ["sleep", "insomnia", "can't sleep", "cant sleep", "rest", "awake"],
  relationships: ["couple", "couples", "relationship", "marriage", "partner", "divorce", "intimacy"],
  trauma: ["trauma", "ptsd", "war", "flashback", "abuse", "assault"],
  grief: ["grief", "loss", "bereavement", "died", "death", "mourning"],
};

/** Concern keys present in the text, in TAGS order. */
export function detectConcerns(text: string): string[] {
  const t = text.toLowerCase();
  return Object.entries(TAGS)
    .filter(([, kws]) => kws.some((k) => t.includes(k)))
    .map(([concern]) => concern);
}

function firstSentenceWith(bio: string, term: string): string {
  const sentences = bio.split(/(?<=[.!?])\s+/);
  const found = term && sentences.find((s) => s.toLowerCase().includes(term));
  return (found || sentences[0] || bio).trim();
}

/**
 * Score a therapist against the detected concerns + free text. A concern hit in
 * their SKILLS/TITLE (an actual specialty) weighs far more than a passing mention
 * in the bio — that's what stops, e.g., a child therapist matching "burnout" just
 * because their bio happens to contain the word "exhausted". `specialty` is the
 * first concern they genuinely specialize in (null if they only coincide in prose).
 */
function scoreEntry(
  e: CatalogEntry,
  concerns: string[],
  text: string,
): { score: number; specialty: string | null } {
  const expertise = (e.skills.join(" ") + " " + e.title).toLowerCase();
  const bio = e.bio.toLowerCase();
  let score = 0;
  let specialty: string | null = null;
  for (const c of concerns) {
    for (const kw of TAGS[c] ?? []) {
      if (expertise.includes(kw)) {
        score += 5; // they specialize in it
        specialty ??= c;
      } else if (bio.includes(kw)) {
        score += 1; // only mentioned in passing
      }
    }
  }
  for (const w of text.toLowerCase().split(/\W+/).filter((w) => w.length > 4)) {
    if (expertise.includes(w)) score += 2;
    else if (bio.includes(w)) score += 0.5;
  }
  return { score, specialty };
}

export type Pick = { id: string; concept: string; snippet: string };

/**
 * Best verified therapist for the detected concerns + free text. Prefers ones who
 * speak `locale` (falls back to all if that empties the pool). Only therapists who
 * genuinely SPECIALIZE in a stated concern qualify — a bio coincidence is not a
 * match — so when no real fit exists we return null (honest CLARIFY) rather than
 * forcing a weak one. Returns the id, the concern they specialize in, and the most
 * relevant sentence from their (localized) bio for the rationale.
 */
export function pickMatch(
  catalog: CatalogEntry[],
  concerns: string[],
  text: string,
  locale: string,
): Pick | null {
  const spoken = catalog.filter((e) => e.languages.includes(locale));
  const pool = spoken.length ? spoken : catalog;
  const ranked = pool
    .map((e) => ({ e, ...scoreEntry(e, concerns, text) }))
    .filter((r) => r.specialty !== null)
    .sort((a, b) => b.score - a.score);
  if (!ranked.length) return null;

  const best = ranked[0];
  const concept = best.specialty as string;
  const hay = (best.e.skills.join(" ") + " " + best.e.bio).toLowerCase();
  const term = (TAGS[concept] ?? []).find((k) => hay.includes(k)) ?? "";
  return { id: best.e.id, concept, snippet: firstSentenceWith(best.e.bio, term) };
}
