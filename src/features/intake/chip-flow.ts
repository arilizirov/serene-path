import {
  CONCERN_IDS,
  STYLE_IDS,
  LANGUAGE_IDS,
  CONFIRM_IDS,
  FIT_GATE_IDS,
  THERAPIST_GENDER_IDS,
  THERAPIST_RELIGION_IDS,
  AVAILABILITY_IDS,
  FEE_IDS,
  type IntakeInput,
  type IntakeTurn,
  type IntakeSelection,
  type IntakeFlowState,
  type IntakeMatch,
  type SecondaryAction,
  type ConcernId,
  type StyleId,
  type LanguageId,
  type TherapistGenderId,
  type TherapistReligionId,
  type AvailabilityId,
  type FeeId,
} from "./contract";
import {
  createFlowSession,
  getFlowSession,
  saveFlowSession,
  type FlowSession,
  type StoredMessage,
} from "./repository";
import { flowMsg } from "./flow-copy";
import { isCrisis, crisisMessage } from "./crisis";
import { buildConfirmMessage } from "./confirm";
import { extractConcern } from "./extract";
import { pickTherapist } from "./matching";

// The chip-driven pre-choice intake engine (INTAKE_BUILD_SPEC). Deterministic state
// machine: opener (free text, $0) → concern → style → language chips ($0) → CONFIRM
// (the ONE model call, step 6) → fit form (step 6b, tap-only $0: gate → gender →
// religion → availability → fee) → MATCH (step 7, deterministic $0). Gender is asked
// ONCE, in the fit form (spec §6b "supersedes the inline Step-5 chip"). Phase + chip
// selection persist per session.

type Phase =
  | "opener"
  | "concern"
  | "something_else"
  | "style"
  | "language"
  | "confirm"
  // Step 6b fit form (tap-only, between confirm and match).
  | "fit_gate"
  | "fit_gender"
  | "fit_religion"
  | "fit_availability"
  | "fit_fee"
  | "matched"
  | "crisis";

// Persistent on EVERY turn: get_help_now is the crisis safety net (independent of the
// classifier); browse_all / human_followup are the always-available escape hatches.
const SECONDARY: SecondaryAction[] = ["get_help_now", "browse_all", "human_followup"];

const isConcern = (v: unknown): v is ConcernId => (CONCERN_IDS as readonly string[]).includes(v as string);
const isStyle = (v: unknown): v is StyleId => (STYLE_IDS as readonly string[]).includes(v as string);
const isLanguage = (v: unknown): v is LanguageId => (LANGUAGE_IDS as readonly string[]).includes(v as string);
const isFitGate = (v: unknown): v is "sure" | "skip" => (FIT_GATE_IDS as readonly string[]).includes(v as string);
const isTherapistGender = (v: unknown): v is TherapistGenderId => (THERAPIST_GENDER_IDS as readonly string[]).includes(v as string);
const isTherapistReligion = (v: unknown): v is TherapistReligionId => (THERAPIST_RELIGION_IDS as readonly string[]).includes(v as string);
const isAvailability = (v: unknown): v is AvailabilityId => (AVAILABILITY_IDS as readonly string[]).includes(v as string);
const isFee = (v: unknown): v is FeeId => (FEE_IDS as readonly string[]).includes(v as string);

type StepResult = {
  state: IntakeFlowState;
  assistantMessage: string;
  options?: string[];
  matches?: IntakeMatch[];
  done?: boolean;
};

async function persist(
  session: FlowSession,
  messages: StoredMessage[],
  result: StepResult,
  phase: Phase,
  selection: IntakeSelection,
  opener: string,
): Promise<IntakeTurn> {
  const matches = result.matches ?? [];
  messages.push({ role: "assistant", content: result.assistantMessage });
  await saveFlowSession(session.id, {
    state: result.state,
    messages,
    suggestedTherapistIds: matches.map((m) => m.therapistId),
    phase,
    selection,
    opener,
  });
  return {
    sessionId: session.id,
    assistantMessage: result.assistantMessage,
    state: result.state,
    options: result.options,
    secondaryActions: SECONDARY,
    matches,
    done: result.done,
  };
}

export async function runChipTurn(input: IntakeInput): Promise<IntakeTurn> {
  const locale = input.locale;
  const existing = input.sessionId ? await getFlowSession(input.sessionId) : null;
  const session = existing ?? (await createFlowSession());
  const phase = (session.phase as Phase | null) ?? "opener";
  const selection: IntakeSelection = { ...session.selection };
  let opener = session.opener;
  const messages: StoredMessage[] = [...session.messages];
  const m = flowMsg(locale);

  // Persistent crisis safety net — any turn, regardless of phase or classifier.
  if (input.action === "get_help_now") {
    return persist(session, messages, { state: "CRISIS", assistantMessage: crisisMessage(locale) }, "crisis", selection, opener);
  }

  if (phase === "opener") {
    const text = (input.text ?? "").trim();
    if (!text) {
      // Bare start: show the greeting + open question; free text comes next.
      return {
        sessionId: session.id,
        assistantMessage: `${m.greeting}\n\n${m.open}`,
        state: "GREETING",
        secondaryActions: SECONDARY,
        matches: [],
      };
    }
    if (await isCrisis(text, locale)) {
      return persist(session, messages, { state: "CRISIS", assistantMessage: crisisMessage(locale) }, "crisis", selection, text);
    }
    opener = text;
    messages.push({ role: "user", content: text });
    return persist(session, messages, { state: "GATHER", assistantMessage: m.concernQ, options: [...CONCERN_IDS] }, "concern", selection, opener);
  }

  if (phase === "concern") {
    if (input.choice === "something_else") {
      return persist(session, messages, { state: "GATHER", assistantMessage: m.somethingElse }, "something_else", selection, opener);
    }
    if (isConcern(input.choice)) {
      selection.concern = input.choice;
      return persist(session, messages, { state: "GATHER", assistantMessage: m.styleQ, options: [...STYLE_IDS] }, "style", selection, opener);
    }
    return persist(session, messages, { state: "GATHER", assistantMessage: m.concernQ, options: [...CONCERN_IDS] }, "concern", selection, opener);
  }

  if (phase === "something_else") {
    const text = (input.text ?? "").trim();
    // Guard empty text: don't fire paid isCrisis + extractConcern on nothing — just
    // re-ask. (Crisis detection only ever runs on real free text.)
    if (!text) {
      return persist(session, messages, { state: "GATHER", assistantMessage: m.somethingElse }, "something_else", selection, opener);
    }
    if (await isCrisis(text, locale)) {
      return persist(session, messages, { state: "CRISIS", assistantMessage: crisisMessage(locale) }, "crisis", selection, opener);
    }
    messages.push({ role: "user", content: text });
    // Map the free text to a concern (one model call); unclear → "something_else",
    // which won't match and routes to the honest no-match escape.
    selection.concern = await extractConcern(text, locale);
    return persist(session, messages, { state: "GATHER", assistantMessage: m.styleQ, options: [...STYLE_IDS] }, "style", selection, opener);
  }

  if (phase === "style") {
    if (isStyle(input.choice)) {
      selection.style = input.choice;
      return persist(session, messages, { state: "GATHER", assistantMessage: m.languageQ, options: [...LANGUAGE_IDS] }, "language", selection, opener);
    }
    return persist(session, messages, { state: "GATHER", assistantMessage: m.styleQ, options: [...STYLE_IDS] }, "style", selection, opener);
  }

  if (phase === "language") {
    if (isLanguage(input.choice)) {
      selection.language = input.choice;
      // Step 6 CONFIRM — the one model call (warm reflection), templated only on failure.
      const confirm = await buildConfirmMessage(opener, selection, locale);
      return persist(session, messages, { state: "CONFIRM", assistantMessage: confirm, options: [...CONFIRM_IDS] }, "confirm", selection, opener);
    }
    return persist(session, messages, { state: "GATHER", assistantMessage: m.languageQ, options: [...LANGUAGE_IDS] }, "language", selection, opener);
  }

  if (phase === "confirm") {
    if (input.choice === "not_quite") {
      // Re-ask the chip sequence (simple version): clear answers, back to concern.
      return persist(
        session,
        messages,
        { state: "GATHER", assistantMessage: m.concernQ, options: [...CONCERN_IDS] },
        "concern",
        {},
        opener,
      );
    }
    // "yes" → Step 6b: the fit-form transition gate (tap-only, $0). NOT match yet.
    return persist(session, messages, { state: "GATHER", assistantMessage: m.fitGateQ, options: [...FIT_GATE_IDS] }, "fit_gate", selection, opener);
  }

  // --- Step 6b fit form (tap-only, $0) ---------------------------------------
  if (phase === "fit_gate") {
    if (input.choice === "skip") {
      // Skip → match on what we have, no penalty.
      return finishMatch(session, messages, selection, opener, locale, m.noMatch);
    }
    if (input.choice === "sure") {
      return persist(session, messages, { state: "GATHER", assistantMessage: m.fitGenderQ, options: [...THERAPIST_GENDER_IDS] }, "fit_gender", selection, opener);
    }
    return persist(session, messages, { state: "GATHER", assistantMessage: m.fitGateQ, options: [...FIT_GATE_IDS] }, "fit_gate", selection, opener);
  }

  if (phase === "fit_gender") {
    if (isTherapistGender(input.choice)) {
      selection.therapistGender = input.choice;
      return persist(session, messages, { state: "GATHER", assistantMessage: m.fitReligionQ, options: [...THERAPIST_RELIGION_IDS] }, "fit_religion", selection, opener);
    }
    return persist(session, messages, { state: "GATHER", assistantMessage: m.fitGenderQ, options: [...THERAPIST_GENDER_IDS] }, "fit_gender", selection, opener);
  }

  if (phase === "fit_religion") {
    if (isTherapistReligion(input.choice)) {
      selection.therapistReligion = input.choice;
      return persist(session, messages, { state: "GATHER", assistantMessage: m.fitAvailabilityQ, options: [...AVAILABILITY_IDS] }, "fit_availability", selection, opener);
    }
    return persist(session, messages, { state: "GATHER", assistantMessage: m.fitReligionQ, options: [...THERAPIST_RELIGION_IDS] }, "fit_religion", selection, opener);
  }

  if (phase === "fit_availability") {
    if (isAvailability(input.choice)) {
      selection.availability = input.choice;
      return persist(session, messages, { state: "GATHER", assistantMessage: m.fitFeeQ, options: [...FEE_IDS] }, "fit_fee", selection, opener);
    }
    return persist(session, messages, { state: "GATHER", assistantMessage: m.fitAvailabilityQ, options: [...AVAILABILITY_IDS] }, "fit_availability", selection, opener);
  }

  if (phase === "fit_fee") {
    if (isFee(input.choice)) {
      selection.fee = input.choice;
      return finishMatch(session, messages, selection, opener, locale, m.noMatch);
    }
    return persist(session, messages, { state: "GATHER", assistantMessage: m.fitFeeQ, options: [...FEE_IDS] }, "fit_fee", selection, opener);
  }

  // matched / crisis terminal.
  return persist(session, messages, { state: "FOLLOWUP", assistantMessage: m.support, done: true }, phase, selection, opener);
}

/** Step 7 — deterministic matching. A genuine fit → PRESENT_OPTIONS with one match;
 *  nothing scoring ≥ threshold → honest CLARIFY (no-match → escape hatch). */
async function finishMatch(
  session: FlowSession,
  messages: StoredMessage[],
  selection: IntakeSelection,
  opener: string,
  locale: LanguageId,
  noMatch: string,
): Promise<IntakeTurn> {
  const picked = await pickTherapist(selection, locale);
  if (picked) {
    return persist(
      session,
      messages,
      { state: "PRESENT_OPTIONS", assistantMessage: picked.assistantMessage, matches: [picked.match], done: true },
      "matched",
      selection,
      opener,
    );
  }
  return persist(session, messages, { state: "CLARIFY", assistantMessage: noMatch, done: true }, "matched", selection, opener);
}
