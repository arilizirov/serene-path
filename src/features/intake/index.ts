// Public surface of the intake feature (F1/F2 — AI intake chat + bio-grounded
// matching, APP_SPEC §5). Slice 3.2: the public contract + request schema. The
// engine (service + session persistence) and the API route land in 3.3 / 3.4.
export { intakeRequestSchema, chipIntakeRequestSchema } from "./schema";
export type { IntakeRequestInput, ChipIntakeRequestInput } from "./schema";
export { runIntakeTurn } from "./service";
export { runChipTurn } from "./chip-flow";

// The IntakeProvider seam (INTAKE_BUILD_SPEC §Contract) — the chip flow and the
// full-LLM flow behind one interface, selectable by name (default = chip).
export {
  getIntakeProvider,
  ChipIntakeProvider,
  ApiIntakeProvider,
} from "./provider";
export type { IntakeProviderName } from "./provider";
export type { IntakeProvider, IntakeInput } from "./contract";

// Admin (transcripts review + .md export, §11 admin-only) — reads + pure builders.
export {
  listFinishedSessions,
  getFullSession,
  getFullSessionsByIds,
  listFinishedSessionsFull,
  countFinishedSessions,
  conversationToMarkdown,
  conversationsToMarkdown,
  parseSelectedIds,
  MAX_SELECTED_IDS,
} from "./service";
export type { FinishedSessionRow, FullSession, ParseIdsResult } from "./service";

// Admin manual data deletion (Phase 5, retention & GDPR) — admin-triggered only.
export { deleteSession, purgeSessionsOlderThan } from "./service";

// Admin statistics (Phase 2, DB-derived intake funnel / match rate / engines).
export { getIntakeStats } from "./service";
export type { IntakeStats } from "./service";

export { IntakeChat } from "./ui/intake-chat";
export { ChipIntakeChat } from "./ui/chip-intake-chat";
export { IntakeModeSwitch } from "./ui/intake-mode-switch";
export { FeelingField } from "./ui/feeling-field";
export type {
  IntakeResponse,
  TherapistMatch,
  IntakeStateName,
  Locale,
} from "./types";
export type { IntakeTurn, IntakeFlowState, SecondaryAction } from "./contract";
