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

export const LANGUAGE_IDS = ["he", "en", "fr"] as const;

export const GENDER_PREF_IDS = ["no_preference", "female", "male"] as const;

export const CONFIRM_IDS = ["yes", "not_quite"] as const;

export const SECONDARY_ACTIONS = ["browse_all", "human_followup", "get_help_now"] as const;

export type ConcernId = (typeof CONCERN_IDS)[number];
export type StyleId = (typeof STYLE_IDS)[number];
export type LanguageId = (typeof LANGUAGE_IDS)[number];
export type GenderPrefId = (typeof GENDER_PREF_IDS)[number];
export type ConfirmId = (typeof CONFIRM_IDS)[number];
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

/** The accumulated chip selection that drives matching — all IDs. */
export type IntakeSelection = {
  concern?: ConcernId;
  style?: StyleId;
  language?: LanguageId;
  genderPreference?: GenderPrefId;
};

/** One inbound action: an opener / something_else free text, a chip tap (its id),
 *  or a persistent secondary action. Exactly one of text/choice/action is set. */
export type IntakeInput = {
  sessionId?: string;
  locale: LanguageId;
  text?: string;
  choice?: string;
  action?: SecondaryAction;
};

/** The swappable seam: the chip flow and a full-API flow both implement this. */
export interface IntakeProvider {
  handle(input: IntakeInput): Promise<IntakeTurn>;
}
