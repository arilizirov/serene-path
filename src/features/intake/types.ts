// Public contract for intake/matching (APP_SPEC §5). These are the shapes the
// API route + UI speak; the model's own (untrusted) output shape lives in
// schema.ts and never leaves the service.

export type Locale = "he" | "en" | "fr";

export type IntakeStateName =
  | "GREETING"
  | "GATHER"
  | "MIRROR"
  | "CONFIRM"
  | "MATCH"
  | "CLARIFY"
  | "PRESENT_OPTIONS"
  | "FOLLOWUP";

/** A proposed therapist. `nextAvailable` is ALWAYS server-filled (the model
 *  never invents times) — ISO-8601 UTC, or null if none upcoming. */
export type TherapistMatch = {
  therapistId: string;
  rationale: string;
  nextAvailable: string | null;
};

export type IntakeResponse = {
  sessionId: string;
  assistantMessage: string;
  state: IntakeStateName;
  matches: TherapistMatch[];
};
