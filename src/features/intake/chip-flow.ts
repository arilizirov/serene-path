import {
  CONCERN_IDS,
  STYLE_IDS,
  LANGUAGE_IDS,
  GENDER_PREF_IDS,
  CONFIRM_IDS,
  type IntakeInput,
  type IntakeTurn,
  type IntakeSelection,
  type IntakeFlowState,
  type SecondaryAction,
  type ConcernId,
  type StyleId,
  type LanguageId,
  type GenderPrefId,
} from "./contract";
import {
  createFlowSession,
  getFlowSession,
  saveFlowSession,
  type FlowSession,
  type StoredMessage,
} from "./repository";
import { flowMsg } from "./flow-copy";
import { looksLikeCrisis, crisisMessage } from "./crisis";
import { buildConfirmMessage } from "./confirm";

// The chip-driven pre-choice intake engine (INTAKE_BUILD_SPEC). Deterministic state
// machine: opener (free text) → concern → style → language → gender chips → CONFIRM
// → matching. The CONFIRM reflection (Stage C, one model call) and the MATCH (Stage
// D, deterministic) are wired in later slices; here CONFIRM uses the spec's templated
// fallback and "yes" returns a placeholder. Phase + chip selection persist per session.

type Phase =
  | "opener"
  | "concern"
  | "something_else"
  | "style"
  | "language"
  | "gender"
  | "confirm"
  | "matched"
  | "crisis";

// Persistent on EVERY turn: get_help_now is the crisis safety net (independent of the
// classifier); browse_all / human_followup are the always-available escape hatches.
const SECONDARY: SecondaryAction[] = ["get_help_now", "browse_all", "human_followup"];

const isConcern = (v: unknown): v is ConcernId => (CONCERN_IDS as readonly string[]).includes(v as string);
const isStyle = (v: unknown): v is StyleId => (STYLE_IDS as readonly string[]).includes(v as string);
const isLanguage = (v: unknown): v is LanguageId => (LANGUAGE_IDS as readonly string[]).includes(v as string);
const isGenderPref = (v: unknown): v is GenderPrefId => (GENDER_PREF_IDS as readonly string[]).includes(v as string);

type StepResult = {
  state: IntakeFlowState;
  assistantMessage: string;
  options?: string[];
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
  messages.push({ role: "assistant", content: result.assistantMessage });
  await saveFlowSession(session.id, {
    state: result.state,
    messages,
    suggestedTherapistIds: [],
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
    matches: [],
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
    if (looksLikeCrisis(text, locale)) {
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
    if (looksLikeCrisis(text, locale)) {
      return persist(session, messages, { state: "CRISIS", assistantMessage: crisisMessage(locale) }, "crisis", selection, opener);
    }
    if (text) messages.push({ role: "user", content: text });
    // Stage E: extract a concern from the text via one model call. Interim: record it.
    selection.concern = "something_else";
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
      return persist(session, messages, { state: "GATHER", assistantMessage: m.genderQ, options: [...GENDER_PREF_IDS] }, "gender", selection, opener);
    }
    return persist(session, messages, { state: "GATHER", assistantMessage: m.languageQ, options: [...LANGUAGE_IDS] }, "language", selection, opener);
  }

  if (phase === "gender") {
    if (isGenderPref(input.choice)) {
      selection.genderPreference = input.choice;
      // Step 6 CONFIRM — the one model call (warm reflection), templated only on failure.
      const confirm = await buildConfirmMessage(opener, selection, locale);
      return persist(session, messages, { state: "CONFIRM", assistantMessage: confirm, options: [...CONFIRM_IDS] }, "confirm", selection, opener);
    }
    return persist(session, messages, { state: "GATHER", assistantMessage: m.genderQ, options: [...GENDER_PREF_IDS] }, "gender", selection, opener);
  }

  if (phase === "confirm") {
    if (input.choice === "not_quite") {
      // Re-ask the chip sequence (simple version): clear answers, back to concern.
      return persist(
        session,
        messages,
        { state: "GATHER", assistantMessage: m.concernQ, options: [...CONCERN_IDS] },
        "concern",
        { concern: undefined, style: undefined, language: undefined, genderPreference: undefined },
        opener,
      );
    }
    // "yes" → Step 7 matching (Stage D). Interim placeholder.
    return persist(session, messages, { state: "PRESENT_OPTIONS", assistantMessage: m.support, done: true }, "matched", selection, opener);
  }

  // matched / crisis terminal.
  return persist(session, messages, { state: "FOLLOWUP", assistantMessage: m.support, done: true }, phase, selection, opener);
}
