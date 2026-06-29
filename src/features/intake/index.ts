// Public surface of the intake feature (F1/F2 — pre-choice intake: prompted
// conversation → fit form → deterministic match, INTAKE_BUILD_SPEC §5).
export { intakeTurnRequestSchema } from "./schema";
export type { IntakeTurnRequestInput } from "./schema";
// Crisis resources (human-authored, owner-verified). Server-side only; the intake
// page resolves the string here and passes it into the client UI as a prop, so the
// client chat never imports crisis.ts (which pulls in @/server/ai / Node-only deps).
export { crisisMessage } from "./crisis";

// The IntakeProvider seam (INTAKE_BUILD_SPEC §Contract) — the live flow behind one
// interface so a future provider can swap in without touching the route/UI.
export { getIntakeProvider, ConversationIntakeProvider } from "./provider";
export type { IntakeProvider, IntakeInput } from "./contract";
export type { IntakeTurn, IntakeFlowState, SecondaryAction } from "./contract";

// Admin (transcripts review + .md export, §11 admin-only) — reads + pure builders.
// These read the SAME IntakeSession table the live flow writes; unchanged by the
// flow rewrite (the conversation flow persists via saveFlowSession like before).
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

// Login-linking (F1.5) — link an anonymous intake session to a user at sign-up,
// and read that user's most-recent recommendation (both owner-scoped). Consumed
// only by the app composition root (/account).
export { linkSessionToUser, getRecommendationForUser } from "./service";

// Admin statistics (Phase 2, DB-derived intake funnel / match rate / engines).
export { getIntakeStats } from "./service";
export type { IntakeStats } from "./service";

// The live intake chat UI (the prompted conversation + fit-form taps) + the home
// "how are you feeling?" field that seeds it.
export { IntakeChat } from "./ui/intake-chat";
export { FeelingField } from "./ui/feeling-field";
export type { Locale } from "./types";
