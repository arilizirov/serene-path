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

export type {
  ChatRole,
  ChatMessage,
  AiProvider,
  TokenUsage,
  Completion,
  CompleteOptions,
} from "./types";
import type { AiProvider } from "./types";

// Phase 4 — API cost & usage tracking: fire-and-forget recording of paid model
// calls, plus the admin reads the costs dashboard renders. Re-exported here so
// the seam (`@/server/ai`) is the one public surface callers and the admin use.
export { recordUsage, estimateCostUsd, PRICING } from "./usage";
export type { CallType } from "./usage";
export { getCostStats, recentCalls } from "./usage-reads";
export type { CostStats, RecentCall, CostWindow } from "./usage-reads";

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
  // The stub ignores opts (no real model to cap); the signature stays compatible.
  async complete(messages) {
    const system = messages.find((m) => m.role === "system")?.content ?? "";
    const userTurns = messages.filter((m) => m.role === "user").length;
    const catalogIds = [...system.matchAll(ID_IN_SYSTEM)].map((m) => m[1]);

    // The stub is unpaid, so it reports no usage (usage: null) — callers record
    // nothing on this path. Only the real provider carries token usage.
    if (userTurns <= 1) {
      return {
        text: JSON.stringify({
          state: "MIRROR",
          reply:
            "If I understand correctly, you're going through something that's weighing on you. Did I get that right?",
          matches: [],
        }),
        usage: null,
      };
    }

    if (catalogIds.length === 0) {
      return {
        text: JSON.stringify({
          state: "CLARIFY",
          reply:
            "I don't have someone who's a genuine fit for this yet. Could you tell me a bit more about what you're looking for?",
          matches: [],
        }),
        usage: null,
      };
    }

    return {
      text: JSON.stringify({
        state: "MATCH",
        reply:
          "Thank you for sharing. Based on what you've told me, here are a couple of therapists who may be a good fit.",
        matches: catalogIds.slice(0, 2).map((id) => ({
          therapist_id: id,
          rationale:
            "Their background and stated specialties line up with what you described.",
        })),
      }),
      usage: null,
    };
  },
};

/**
 * The active AI provider, chosen per call (not frozen at import): the real model
 * when OPENAI_API_KEY is set, otherwise the deterministic stub. The OpenAI SDK is
 * lazy-imported only on the real path, so the stub stays dependency-free.
 */
export function aiProvider(): AiProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return stubProvider;
  const model = process.env.OPENAI_MODEL || "gpt-5.4";
  return {
    async complete(messages, opts) {
      const { runOpenAi } = await import("./openai-provider");
      return runOpenAi(apiKey, model, messages, opts);
    },
  };
}
