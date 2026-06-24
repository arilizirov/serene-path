import { aiProvider, type ChatMessage } from "@/server/ai";
import { CONCERN_IDS, type ConcernId, type LanguageId } from "./contract";

// The `something_else` escape valve (INTAKE_BUILD_SPEC §Escape hatch): the one place
// that may use a model call to map free text to a concern, then rejoin the chip flow.
// "When unsure, hand off, never guess" — anything that doesn't clearly fit becomes
// `something_else`, which won't reach matching and routes to the no-match escape.

const CONCERNS = CONCERN_IDS.filter((c) => c !== "something_else");

const PROMPT = `Map the user's description of what they're going through to EXACTLY ONE of these concern ids: ${CONCERNS.join(", ")}. If none clearly fits, use "something_else". The text may be in Hebrew, English, or French. Output ONLY JSON: {"concern":"<id>"}.`;

export async function extractConcern(text: string, _locale: LanguageId): Promise<ConcernId> {
  if (!process.env.OPENAI_API_KEY) return "something_else";
  const chat: ChatMessage[] = [
    { role: "system", content: PROMPT },
    { role: "user", content: text },
  ];
  try {
    const raw = await aiProvider().complete(chat);
    const block = raw.match(/\{[\s\S]*\}/);
    if (block) {
      const concern = (JSON.parse(block[0]) as { concern?: unknown }).concern;
      if (typeof concern === "string" && (CONCERN_IDS as readonly string[]).includes(concern)) {
        return concern as ConcernId;
      }
    }
  } catch {
    /* fall through to the safe default */
  }
  return "something_else";
}
