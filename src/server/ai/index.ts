// AI adapter for intake/matching (APP_SPEC §5, §10). The platform defines its
// own provider interface; a vendor SDK lives ONLY behind this adapter. The owner
// chose OpenAI GPT-5.4 (a deviation from the spec's Anthropic) — but the seam is
// provider-neutral, so swapping is a local change.
//
// The real provider is a gated decision AND needs OPENAI_API_KEY (not yet set),
// so until both land the deterministic STUB drives the whole flow — every
// downstream piece (the intake service, the API route, the chat UI, the
// server-side matching rules) is built + tested against this seam now, and the
// real model plugs in here without any caller changing.

export type ChatRole = "system" | "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

export interface AiProvider {
  /**
   * Send the conversation (a system prompt carrying the intake instructions +
   * injected catalog, then the transcript) and return the model's RAW completion
   * text. The contract is that this text is strict JSON per §5 — the caller
   * (intake service) zod-validates it; the adapter does not parse.
   */
  complete(messages: ChatMessage[]): Promise<string>;
}

const ID_IN_SYSTEM = /"id"\s*:\s*"([^"]+)"/g;

/**
 * Deterministic dev stub. Returns strict JSON in the §5 model-output shape so the
 * full state machine + matching path are exercisable with no API key:
 *  - first user turn → MIRROR (reflect back, ask to confirm), no matches;
 *  - later turns → MATCH the first one or two catalog therapists (ids parsed from
 *    the injected catalog in the system message), or CLARIFY if the catalog is
 *    empty (no genuine fit).
 * The reply copy is intentionally generic placeholder text — real, locale-aware,
 * bio-grounded language is the real model's job.
 */
const stubProvider: AiProvider = {
  async complete(messages) {
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const userTurns = messages.filter((m) => m.role === "user").length;
    const catalogIds = [...system.matchAll(ID_IN_SYSTEM)].map((m) => m[1]);

    if (userTurns <= 1) {
      return JSON.stringify({
        state: "MIRROR",
        reply:
          "If I understand correctly, you're going through something that's weighing on you. Did I get that right?",
        matches: [],
      });
    }

    if (catalogIds.length === 0) {
      return JSON.stringify({
        state: "CLARIFY",
        reply:
          "I don't have someone who's a genuine fit for this yet. Could you tell me a bit more about what you're looking for?",
        matches: [],
      });
    }

    return JSON.stringify({
      state: "MATCH",
      reply:
        "Thank you for sharing. Based on what you've told me, here are a couple of therapists who may be a good fit.",
      matches: catalogIds.slice(0, 2).map((id) => ({
        therapist_id: id,
        rationale:
          "Their background and stated specialties line up with what you described.",
      })),
    });
  },
};

/**
 * The active AI provider. Returns the stub until the OpenAI GPT-5.4 impl is wired
 * here (gated on OPENAI_API_KEY). Kept as a function so the choice is made per
 * call, not frozen at import time.
 */
export function aiProvider(): AiProvider {
  return stubProvider;
}
