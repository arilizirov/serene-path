// Public surface of the intake feature (F1/F2 — AI intake chat + bio-grounded
// matching, APP_SPEC §5). Slice 3.2: the public contract + request schema. The
// engine (service + session persistence) and the API route land in 3.3 / 3.4.
export { intakeRequestSchema, chipIntakeRequestSchema } from "./schema";
export type { IntakeRequestInput, ChipIntakeRequestInput } from "./schema";
export { runIntakeTurn } from "./service";
export { runChipTurn } from "./chip-flow";
export { IntakeChat } from "./ui/intake-chat";
export { FeelingField } from "./ui/feeling-field";
export type {
  IntakeResponse,
  TherapistMatch,
  IntakeStateName,
  Locale,
} from "./types";
export type { IntakeTurn, IntakeFlowState, SecondaryAction } from "./contract";
