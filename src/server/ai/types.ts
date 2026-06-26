// Shared AI-adapter types. Kept in their own file (not index) so the real
// provider can import them without creating an index ↔ provider import cycle.

export type ChatRole = "system" | "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

/**
 * Token counts for one model call (Phase 4 — cost/usage tracking). Mirrors the
 * OpenAI response `usage` shape, mapped into our own names so the seam stays
 * provider-neutral. `null` from a provider means usage was unavailable (e.g. the
 * stub path) and nothing should be recorded.
 */
export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

/** A model completion: the RAW text plus the call's token usage (or null). */
export type Completion = { text: string; usage: TokenUsage | null };

/** Optional per-call controls. `maxCompletionTokens` caps the output (a cost guard
 *  for the conversation turns, which only ever return a short JSON object). */
export type CompleteOptions = { maxCompletionTokens?: number };

export interface AiProvider {
  /**
   * Send the conversation (a system prompt carrying the intake instructions +
   * injected catalog, then the transcript) and return the model's RAW completion
   * text alongside the call's token usage. The text contract is strict JSON per
   * §5 — the caller (intake service) zod-validates it; the adapter does not parse.
   * `usage` is null when the provider can't report it (the dev stub), so callers
   * record cost only when it is present. `opts` is optional and backward-compatible.
   */
  complete(messages: ChatMessage[], opts?: CompleteOptions): Promise<Completion>;
}
