import OpenAI from "openai";
import type { ChatMessage } from "./types";

// The real intake/matching model (the owner's choice: OpenAI GPT-5.4), living
// behind the AiProvider seam. This is the ONLY file that imports the OpenAI SDK;
// it's lazy-loaded (only when OPENAI_API_KEY is set), so the stub path never
// pulls the dependency in.

let client: OpenAI | null = null;

/**
 * Send the conversation to the model and return its RAW completion text. JSON
 * mode constrains the output to a single object; the §5 system prompt pins the
 * exact shape. The caller (intake service) zod-validates — we don't parse here.
 * Deliberately minimal params (no temperature/max_tokens) for broad model
 * compatibility; the model id is configurable via OPENAI_MODEL.
 */
export async function runOpenAi(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  client ??= new OpenAI({ apiKey });
  const res = await client.chat.completions.create({
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    response_format: { type: "json_object" },
  });
  return res.choices[0]?.message?.content ?? "";
}
