// Chip-driven pre-choice intake contract (INTAKE_BUILD_SPEC.md).
//
// The backend works in STABLE IDS only; the frontend renders the localized label
// for each id from the messages catalogs (so "anxiety" / "חרדה" / "Anxiété" are one
// thing). Matching inputs are chips (taps), never free text — the only free text is
// the opening feeling (+ the `something_else` valve), which feeds the warm
// reflection, not the match. This keeps the flow un-derailable and the match
// deterministic. The whole flow lives behind `IntakeProvider` so it and a full-API
// conversation flow stay interchangeable.

export const CONCERN_IDS = [
  "anxiety",
  "stress_burnout",
  "relationships",
  "trauma",
  "grief",
  "sleep",
  "depression",
  "something_else",
] as const;

export const STYLE_IDS = [
  "practical_tools",
  "explore_feelings",
  "mindfulness",
  "faith_aligned",
] as const;

// The FIXED extraction vocab the prompted conversation maps to (INTAKE_BUILD_SPEC
// §"Where the structured concern comes from"). Concern/style are EXTRACTED from the
// conversation (folded into the step-4 confirm call) and validated against these
// lists; an unmappable concern → CLARIFY (honest no-match → escape hatch). The
// concern vocab uses `other` (the spec's unmappable bucket) — distinct from the
// retired chip flow's `something_else` valve; both mean "no real concern → no match".
export const EXTRACT_CONCERN_IDS = [
  "anxiety",
  "stress_burnout",
  "relationships",
  "trauma",
  "grief",
  "sleep",
  "depression",
  "other",
] as const;
export const EXTRACT_STYLE_IDS = STYLE_IDS;

export type ExtractConcernId = (typeof EXTRACT_CONCERN_IDS)[number];
export type ExtractStyleId = (typeof EXTRACT_STYLE_IDS)[number];

export const LANGUAGE_IDS = ["he", "en", "fr"] as const;

export const GENDER_PREF_IDS = ["no_preference", "female", "male"] as const;

export const CONFIRM_IDS = ["yes", "not_quite"] as const;

// Step 6b — the fit form (tap-only, $0). All ids, like every chip set. The
// transition gate, then four fit questions; gender is collected HERE (superseding
// the inline Step-5 preference chip — spec §6b "don't ask twice").
export const FIT_GATE_IDS = ["sure", "skip"] as const;
export const THERAPIST_GENDER_IDS = ["no_preference", "female", "male"] as const;
export const THERAPIST_RELIGION_IDS = [
  "no_preference",
  "secular",
  "masorti",
  "dati",
  "haredi",
] as const;
export const AVAILABILITY_IDS = ["weekday_day", "evenings", "weekends", "flexible"] as const;
export const FEE_IDS = ["standard", "sliding_scale", "insurance", "soldier_subsidy"] as const;

export const SECONDARY_ACTIONS = ["browse_all", "human_followup", "get_help_now"] as const;

export type ConcernId = (typeof CONCERN_IDS)[number];
export type StyleId = (typeof STYLE_IDS)[number];
export type LanguageId = (typeof LANGUAGE_IDS)[number];
export type GenderPrefId = (typeof GENDER_PREF_IDS)[number];
export type ConfirmId = (typeof CONFIRM_IDS)[number];
export type FitGateId = (typeof FIT_GATE_IDS)[number];
export type TherapistGenderId = (typeof THERAPIST_GENDER_IDS)[number];
export type TherapistReligionId = (typeof THERAPIST_RELIGION_IDS)[number];
export type AvailabilityId = (typeof AVAILABILITY_IDS)[number];
export type FeeId = (typeof FEE_IDS)[number];
export type SecondaryAction = (typeof SECONDARY_ACTIONS)[number];

/** Full state set incl. CRISIS (the guardrail state that halts the flow). */
export type IntakeFlowState =
  | "GREETING"
  | "GATHER"
  | "MIRROR"
  | "CONFIRM"
  | "MATCH"
  | "CLARIFY"
  | "PRESENT_OPTIONS"
  | "FOLLOWUP"
  | "CRISIS";

/** Where a match's rationale was grounded — always the active-locale bio, a real
 *  quote (capped), never model-chosen. */
export type RationaleSource = {
  field: "bio";
  matchedTerm: string;
  quote: string;
};

export type IntakeMatch = {
  therapistId: string;
  rationale: string;
  rationaleSource: RationaleSource;
  nextAvailable: string | null; // server-filled from the DB
};

/** The public turn shape the API + UI speak (INTAKE_BUILD_SPEC §Contract). */
export type IntakeTurn = {
  sessionId: string;
  assistantMessage: string;
  state: IntakeFlowState;
  options?: string[]; // STABLE IDS (e.g. "anxiety", "yes"); frontend localizes
  secondaryActions?: SecondaryAction[];
  matches: IntakeMatch[];
  done?: boolean;
};

/** The accumulated chip selection that drives matching — all IDs.
 *  `genderPreference` is the legacy inline Step-5 field (kept for back-compat with
 *  the AI flow / older sessions). The canonical fit-form fields below (collected in
 *  Step 6b) are what Step-7 matching reads: `therapistGender` supersedes it. */
export type IntakeSelection = {
  concern?: ConcernId;
  style?: StyleId;
  language?: LanguageId;
  genderPreference?: GenderPrefId;
  // Step 6b fit form — the structured filters that tune the deterministic match.
  therapistGender?: TherapistGenderId;
  therapistReligion?: TherapistReligionId;
  availability?: AvailabilityId;
  fee?: FeeId;
};

/** One inbound action: an opener / something_else free text, a chip tap (its id),
 *  or a persistent secondary action. Exactly one of text/choice/action is set.
 *  `message` is the AI conversational flow's native free-text field (the chip flow
 *  uses `text`); `provider` selects which flow handles the turn (default chip). */
export type IntakeInput = {
  sessionId?: string;
  locale: LanguageId;
  text?: string;
  choice?: string;
  action?: SecondaryAction;
  message?: string;
  provider?: "chip" | "api";
};

/** The swappable seam: the chip flow and a full-API flow both implement this. */
export interface IntakeProvider {
  handle(input: IntakeInput): Promise<IntakeTurn>;
}
