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

function scoreEntry(e: CatalogEntry, concerns: string[], text: string): number {
  const hay = (e.skills.join(" ") + " " + e.bio + " " + e.title).toLowerCase();
  let score = 0;
  for (const c of concerns) for (const kw of TAGS[c] ?? []) if (hay.includes(kw)) score += 2;
  for (const w of text.toLowerCase().split(/\W+/).filter((w) => w.length > 4))
    if (hay.includes(w)) score += 1;
  return score;
}

export type Pick = { id: string; concept: string; snippet: string };

/**
 * Best verified therapist for the detected concerns + free text. Prefers ones who
 * speak `locale` (falls back to all if that empties the pool). Returns the id, the
 * leading concern key, and the most relevant sentence from their (localized) bio —
 * the service builds the localized rationale from these. Null if nothing scores.
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
    .map((e) => ({ e, score: scoreEntry(e, concerns, text) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!ranked.length) return null;

  const best = ranked[0].e;
  const concept = concerns[0] ?? "";
  const hay = (best.skills.join(" ") + " " + best.bio).toLowerCase();
  const term = (TAGS[concept] ?? []).find((k) => hay.includes(k)) ?? "";
  return { id: best.id, concept, snippet: firstSentenceWith(best.bio, term) };
}
