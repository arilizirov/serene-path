import { runChipTurn } from "./chip-flow";
import { runIntakeTurn } from "./service";
import { crisisMessage } from "./crisis";
import type { IntakeInput, IntakeProvider, IntakeTurn, SecondaryAction } from "./contract";

// The two interchangeable intake flows behind ONE seam (INTAKE_BUILD_SPEC §Contract:
// "Implement behind an IntakeProvider interface so this flow and a full-API flow are
// interchangeable"). The CHIP flow is the spec's canonical pre-choice intake; the API
// (full-LLM conversational) flow is the live system that predates it. Both speak the
// same IntakeTurn, so the route/UI can select either without code changes elsewhere.

// Persistent on EVERY turn, independent of any classifier (spec §Guardrails):
// get_help_now is the crisis safety net; browse_all / human_followup are the escapes.
const SECONDARY: SecondaryAction[] = ["get_help_now", "browse_all", "human_followup"];

/** The canonical chip-driven pre-choice intake (this spec). */
export class ChipIntakeProvider implements IntakeProvider {
  handle(input: IntakeInput): Promise<IntakeTurn> {
    return runChipTurn(input);
  }
}

/** The full-LLM conversational intake (the live flow), adapted to the IntakeTurn
 *  contract so it stays swappable with the chip flow. The AI flow speaks `message`
 *  (free text) and an IntakeResponse; here we translate to/from IntakeTurn. */
export class ApiIntakeProvider implements IntakeProvider {
  async handle(input: IntakeInput): Promise<IntakeTurn> {
    // Persistent crisis safety net — same contract as the chip flow. get_help_now
    // is a real CRISIS turn, surfaced BEFORE any AI turn, never dropped into empty
    // text (runIntakeTurn reads `message`, not `action`). crisis.ts is reused.
    if (input.action === "get_help_now") {
      return {
        sessionId: input.sessionId ?? "",
        assistantMessage: crisisMessage(input.locale),
        state: "CRISIS",
        secondaryActions: SECONDARY,
        matches: [],
      };
    }
    // The conversational flow is driven by free text. Its UI posts `message`; we
    // also accept `text`/`choice` so a chip tap maps to its id as text (a secondary
    // action has no AI turn — the UI handles browse/help locally).
    const message = (input.message ?? input.text ?? input.choice ?? "").trim();
    const r = await runIntakeTurn({
      sessionId: input.sessionId,
      message,
      locale: input.locale,
    });
    return {
      sessionId: r.sessionId,
      assistantMessage: r.assistantMessage,
      state: r.state,
      options: r.options,
      secondaryActions: SECONDARY,
      // The AI matcher has no structured rationaleSource; surface a contract-valid
      // one grounded in the rationale text it already produced (still bio-derived).
      matches: r.matches.map((m) => ({
        therapistId: m.therapistId,
        rationale: m.rationale,
        rationaleSource: { field: "bio" as const, matchedTerm: "", quote: m.rationale },
        nextAvailable: m.nextAvailable,
      })),
    };
  }
}

export type IntakeProviderName = "chip" | "api";

/** Select the active intake provider. Default = the chip flow (this spec's canonical
 *  pre-choice intake). Pass "api" to use the full-LLM conversational flow. The active
 *  default is chosen at the call site (route/page), so flipping flows is one argument. */
export function getIntakeProvider(name: IntakeProviderName = "chip"): IntakeProvider {
  return name === "api" ? new ApiIntakeProvider() : new ChipIntakeProvider();
}
