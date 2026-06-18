import type { Locale } from "@/lib/utils";
import type { TherapistCard } from "./types";

/** The therapist fields the discovery mapper needs (a subset of the DB row). */
export type TherapistCardSource = {
  id: string;
  title: string;
  skills: string[];
  bio: unknown; // { en, he, fr } JSON
  user: { name: string | null };
};

/** First sentence of `text` (up to and including the first . ! or ?). */
function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[^.!?]*[.!?]/);
  return (match ? match[0] : trimmed).trim();
}

/**
 * Map a therapist row + active locale to a presentational discovery card.
 * Pure: no I/O, so the localization + tagline rules are unit-testable.
 */
export function toTherapistCard(
  row: TherapistCardSource,
  locale: Locale,
): TherapistCard {
  const bio = (row.bio ?? {}) as Partial<Record<Locale, string>>;
  const text = bio[locale] ?? bio.en ?? "";
  return {
    id: row.id,
    name: row.user.name ?? row.title,
    title: row.title,
    tagline: firstSentence(text),
    skills: row.skills,
  };
}
