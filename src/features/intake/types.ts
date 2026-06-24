// Public contract for intake/matching (APP_SPEC §5). These are the shapes the
// API route + UI speak; the model's own (untrusted) output shape lives in
// schema.ts and never leaves the service.

export type Locale = "he" | "en" | "fr";

/** Which conversation engine produced a turn: the LLM ("ai") or the deterministic
 *  scripted flow ("scripted"). Lets the UI label/compare them. */
export type IntakeEngine = "ai" | "scripted";

export type IntakeStateName =
  | "GREETING"
  | "GATHER"
  | "MIRROR"
  | "CONFIRM"
  | "MATCH"
  | "CLARIFY"
  | "PRESENT_OPTIONS"
  | "FOLLOWUP"
  | "CRISIS";

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
  /** Quick-reply chips for the current turn (e.g. Yes / Not quite at CONFIRM). */
  options?: string[];
  /** The engine that actually handled this turn (after key/availability fallback). */
  engine: IntakeEngine;
};
