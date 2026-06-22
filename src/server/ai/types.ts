// Shared AI-adapter types. Kept in their own file (not index) so the real
// provider can import them without creating an index ↔ provider import cycle.

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
