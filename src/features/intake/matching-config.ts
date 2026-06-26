// Tunable matching weights (INTAKE_BUILD_SPEC §Step 7). These numbers are
// EVAL-CALIBRATED, not fixed truth — they live here, isolated from the matching
// logic, so the eval can tune them without touching control flow. Keep them in one
// place; do not inline magic numbers in matching.ts.

export const MATCHING_WEIGHTS = {
  /** skills/modalities cover the concern. */
  concernMatch: 3,
  /** modalities cover the support style. */
  styleMatch: 2,
  /** therapist religiousAlignment == requested therapistReligion (skip if no_preference). */
  religiousSoft: 1,
  /** availability tag overlap (skip if `flexible`). */
  availabilitySoft: 1,
  /** Below this total → no match (CLARIFY). */
  minScore: 3,
} as const;

export type MatchingWeights = typeof MATCHING_WEIGHTS;
