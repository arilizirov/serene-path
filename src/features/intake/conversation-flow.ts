import {
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
import { runConversationTurn } from "./conversation";
import { pickTherapist } from "./matching";

// THE live pre-choice intake (INTAKE_BUILD_SPEC §5 "prompted conversation → fit form
// → deterministic match"). The felt-understood core is the model-driven conversation
// (greeting static → 1–2 probes → a step-4 mirror/confirm that ALSO extracts
// concern/style — see conversation.ts). The server validates the extraction against
// the fixed vocab; matching inputs are therefore either extracted-and-validated
// (concern/style) or tapped (gender/religion/availability/fee). Language is the
// active UI locale — never asked. Crisis runs on EVERY free-text turn; the matcher is
// NEVER called on a crisis turn. The fit form + deterministic matcher are reused.

type Phase =
  // The conversation (model-driven; free text).
  | "opener"
  | "gather"
  | "reconfirm" // after `not_quite`: one more gather, then re-confirm ONCE
  | "confirm"
  // The fit form (tap-only, $0) — reused from the prior intake.
  | "fit_gate"
  | "fit_gender"
  | "fit_religion"
  | "fit_availability"
  | "fit_fee"
  | "matched"
  | "crisis";

// Persistent on EVERY turn, independent of the classifier: get_help_now is the crisis
// safety net; browse_all / human_followup are the always-available escape hatches.
const SECONDARY: SecondaryAction[] = ["get_help_now", "browse_all", "human_followup"];

// M2 — gather-loop cap. After this many USER turns (opener + probe answers) we force
// the model to CONFIRM rather than keep probing, bounding the "~3–4 questions" promise
// in code (each extra probe is a paid call on the growing transcript). 4 = opener + 3
// probe answers.
const MAX_USER_TURNS = 4;

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

export async function runConversationFlowTurn(input: IntakeInput): Promise<IntakeTurn> {
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

  // M1(b) — PHASE-INDEPENDENT crisis check. Any free-text turn (in ANY phase, incl.
  // the confirm phase where the schema permits typed text alongside a choice) is
  // classified BEFORE any model/matcher call or phase advance. This closes the
  // confirm-phase swallow (a typed "I want to die" at confirm used to fall through to
  // the fit form). The per-phase blocks below need no further crisis check.
  const freeText = (input.text ?? "").trim();
  if (freeText && (await isCrisis(freeText, locale))) {
    return persist(session, messages, { state: "CRISIS", assistantMessage: crisisMessage(locale) }, "crisis", selection, opener);
  }

  // --- The conversation (model-driven, free text) ----------------------------
  if (phase === "opener" || phase === "gather" || phase === "reconfirm") {
    const text = freeText;

    // Bare start: static greeting + open question. No model call, no crisis check
    // (there's no user text yet). get_help_now still persists via SECONDARY.
    if (phase === "opener" && !text) {
      return {
        sessionId: session.id,
        assistantMessage: `${m.greeting}\n\n${m.open}`,
        state: "GREETING",
        secondaryActions: SECONDARY,
        matches: [],
      };
    }
    if (!text) {
      // Empty mid-conversation input: re-prompt without burning a paid turn.
      return persist(session, messages, { state: "GATHER", assistantMessage: m.open }, phase, selection, opener);
    }

    if (phase === "opener") opener = text;
    messages.push({ role: "user", content: text });

    // M2 — server-side gather cap. The "~3–4 questions" guarantee was prompt-only;
    // count the user turns and FORCE the model to CONFIRM once we hit the cap, so the
    // funnel can't loop indefinitely (each loop is a paid call on the growing
    // transcript). `reconfirm` always confirms on its next free-text turn.
    const userTurns = messages.filter((msg) => msg.role === "user").length;
    const forceConfirm = phase === "reconfirm" || userTurns >= MAX_USER_TURNS;

    // The model drives steps 2–4: a probe (GATHER) or the mirror/confirm (CONFIRM,
    // which also returns the extracted concern/style). Extraction is validated inside
    // runConversationTurn against the fixed vocab (unmappable → undefined).
    const turn = await runConversationTurn(messages, locale, forceConfirm);

    if (turn.state === "CONFIRM") {
      // Fold the validated extraction into the selection (language = active locale).
      selection.concern = turn.concern; // one of the 7 reals, or undefined → CLARIFY at match
      selection.style = turn.style;
      return persist(
        session,
        messages,
        { state: "CONFIRM", assistantMessage: turn.reply, options: [...CONFIRM_IDS] },
        "confirm",
        selection,
        opener,
      );
    }
    // Still gathering. From `reconfirm` we keep gathering until the model decides to
    // re-confirm (it gives ONE fresh reflection — no looped restatement).
    return persist(session, messages, { state: "GATHER", assistantMessage: turn.reply }, phase === "opener" ? "gather" : phase, selection, opener);
  }

  if (phase === "confirm") {
    if (input.choice === "not_quite") {
      // Briefly ask what to adjust, then re-gather → re-confirm ONCE (spec §Confirm
      // loop: don't loop the same restatement). Clear the stale extraction.
      selection.concern = undefined;
      selection.style = undefined;
      return persist(session, messages, { state: "GATHER", assistantMessage: m.notQuite }, "reconfirm", selection, opener);
    }
    // M1(a) — ONLY an explicit "yes" chip (∈ CONFIRM_IDS) advances to the fit form.
    // The schema permits typed free text alongside/instead of a `choice`, so anything
    // that is not "yes" or "not_quite" (incl. raw text — already crisis-checked above)
    // is NOT treated as consent: re-prompt the confirm chips instead of advancing.
    if (input.choice === "yes") {
      return persist(session, messages, { state: "GATHER", assistantMessage: m.fitGateQ, options: [...FIT_GATE_IDS] }, "fit_gate", selection, opener);
    }
    // Re-ask the confirm question with the [yes / not_quite] chips (no advance).
    return persist(session, messages, { state: "CONFIRM", assistantMessage: m.notQuite, options: [...CONFIRM_IDS] }, "confirm", selection, opener);
  }

  // --- The fit form (tap-only, $0) -------------------------------------------
  if (phase === "fit_gate") {
    if (input.choice === "skip") return finishMatch(session, messages, selection, opener, locale, m.noMatch);
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

/** Step 6 — deterministic matching. The language hard filter = the active UI locale
 *  (never asked). A genuine fit → PRESENT_OPTIONS; nothing scoring ≥ threshold, or an
 *  unmapped concern (extraction couldn't classify) → honest CLARIFY (→ escape hatch). */
async function finishMatch(
  session: FlowSession,
  messages: StoredMessage[],
  selection: IntakeSelection,
  opener: string,
  locale: LanguageId,
  noMatch: string,
): Promise<IntakeTurn> {
  // Language = active UI locale → the matcher's `locale ∈ languages` hard filter.
  const picked = await pickTherapist({ ...selection, language: locale }, locale);
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
