import { runConversationFlowTurn } from "./conversation-flow";
import { noKeyMessage } from "./flow-copy";
import type { IntakeInput, IntakeProvider, IntakeTurn } from "./contract";

// The intake seam (INTAKE_BUILD_SPEC §Contract: "Implement behind an IntakeProvider
// interface"). ONE live system now: the prompted conversation → fit form →
// deterministic match. The interface is retained so a future provider can swap in
// without touching the route/UI — but the chip-gather flow and the chip-vs-conversation
// toggle are retired (the conversation IS the gather; concern/style are extracted from
// it and validated, never tapped as concept chips).

/** True when the AI conversation can actually run. The prompted conversation is the
 *  whole intake — without a key it is non-functional, so we must NOT serve it. */
function intakeConversationConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/** The live pre-choice intake: prompted conversation, then fit form, then a
 *  deterministic match. Crisis is gated on every free-text turn inside the flow.
 *
 *  B2.1 — FAIL CLOSED on a missing OPENAI_API_KEY. The conversation is non-functional
 *  without the key; rather than silently degrade to a thin keyword-only flow, refuse
 *  the conversation entirely and return a static "browse therapists + crisis
 *  resources" turn. The failure is loud (the user is told the guided chat is
 *  unavailable and pointed at the directory + crisis resources), never a half-recall
 *  mode. get_help_now stays a persistent secondary action so the crisis net is intact.
 */
export class ConversationIntakeProvider implements IntakeProvider {
  handle(input: IntakeInput): Promise<IntakeTurn> {
    if (!intakeConversationConfigured()) {
      return Promise.resolve({
        sessionId: input.sessionId ?? "no-intake",
        assistantMessage: noKeyMessage(input.locale),
        state: "CLARIFY",
        // Point them at the real, working paths: the directory + a human, plus the
        // persistent crisis net. No matches (no conversation ran), done so the UI
        // doesn't keep prompting for a reply the non-existent flow can't answer.
        secondaryActions: ["browse_all", "human_followup", "get_help_now"],
        matches: [],
        done: true,
      });
    }
    return runConversationFlowTurn(input);
  }
}

/** Select the active intake provider. There is one live flow; the seam stays so a
 *  future provider can replace it behind the same IntakeTurn contract. */
export function getIntakeProvider(): IntakeProvider {
  return new ConversationIntakeProvider();
}
