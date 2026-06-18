import type { Locale } from "@/lib/utils";
import type { TherapistCard } from "./types";
import { findVerifiedTherapists } from "./repository";
import { toTherapistCard } from "./mapper";

/** Discovery list: every verified therapist as a localized card. */
export async function getDiscoverTherapists(
  locale: Locale,
): Promise<TherapistCard[]> {
  const rows = await findVerifiedTherapists();
  return rows.map((row) => toTherapistCard(row, locale));
}
