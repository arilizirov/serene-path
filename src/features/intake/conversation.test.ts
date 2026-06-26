import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiProvider } from "@/server/ai";
import {
  buildConversationPrompt,
  runConversationTurn,
  CONVERSATION_PROMPT_VERSION,
} from "./conversation";
import type { StoredMessage } from "./repository";

vi.mock("@/server/ai", () => ({ aiProvider: vi.fn(), recordUsage: vi.fn() }));
const mAi = vi.mocked(aiProvider);
// {text, usage} completion shape; usage null keeps recordUsage out of the unit path.
const replies = (...raws: string[]) => {
  const complete = vi.fn();
  for (const raw of raws) complete.mockResolvedValueOnce({ text: raw, usage: null });
  mAi.mockReturnValue({ complete });
  return complete;
};

const transcript: StoredMessage[] = [
  { role: "assistant", content: "How are you feeling today?" },
  { role: "user", content: "I'm exhausted, work is crushing me" },
];

beforeEach(() => {
  vi.resetAllMocks();
  process.env.OPENAI_API_KEY = "k";
});

describe("buildConversationPrompt", () => {
  it("pins the reply language to the locale", () => {
    expect(buildConversationPrompt("he")).toContain("ENTIRELY in he");
    expect(buildConversationPrompt("fr")).toContain("ENTIRELY in fr");
  });

  it("carries the fixed extraction vocab (concern + style) so the model maps to it", () => {
    const p = buildConversationPrompt("en");
    for (const c of ["anxiety", "stress_burnout", "relationships", "trauma", "grief", "sleep", "depression", "other"])
      expect(p).toContain(c);
    for (const s of ["practical_tools", "explore_feelings", "mindfulness", "faith_aligned"])
      expect(p).toContain(s);
  });

  it("carries the conversation behaviour rules (probes, single reflection, role boundary, plausibility)", () => {
    const p = buildConversationPrompt("en").toLowerCase();
    expect(p).toContain("don't end every turn with a question");
    expect(p).toContain("once"); // reflect once
    expect(p).toContain("never advise"); // role boundary
    expect(p).toContain("did i get that right"); // confirm phrasing
  });

  it("is a STABLE prefix (no per-call data) so it prompt-caches across turns", () => {
    // Same locale → byte-identical system prompt every call (cacheable prefix).
    expect(buildConversationPrompt("en")).toBe(buildConversationPrompt("en"));
  });

  it("exposes a version for traceability", () => {
    expect(CONVERSATION_PROMPT_VERSION).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe("runConversationTurn — probes (GATHER)", () => {
  it("returns a GATHER probe with no extracted concern/style yet", async () => {
    replies(JSON.stringify({ state: "GATHER", reply: "That sounds heavy — what's been the hardest part?" }));
    const r = await runConversationTurn(transcript, "en");
    expect(r.state).toBe("GATHER");
    expect(r.reply).toContain("hardest");
    expect(r.concern).toBeUndefined();
    expect(r.style).toBeUndefined();
  });
});

describe("runConversationTurn — mirror/confirm (CONFIRM) with extraction", () => {
  it("validates an in-vocab concern + style and returns them", async () => {
    replies(
      JSON.stringify({
        state: "CONFIRM",
        reply: "You've carried a lot. Did I get that right?",
        concern: "stress_burnout",
        style: "practical_tools",
      }),
    );
    const r = await runConversationTurn(transcript, "en");
    expect(r.state).toBe("CONFIRM");
    expect(r.concern).toBe("stress_burnout");
    expect(r.style).toBe("practical_tools");
  });

  it("maps an out-of-vocab concern to undefined (→ caller routes to CLARIFY)", async () => {
    replies(
      JSON.stringify({
        state: "CONFIRM",
        reply: "Did I get that right?",
        concern: "career_confusion", // not in the fixed vocab
        style: "practical_tools",
      }),
    );
    const r = await runConversationTurn(transcript, "en");
    expect(r.state).toBe("CONFIRM");
    expect(r.concern).toBeUndefined();
  });

  it("maps the explicit 'other' concern to undefined (unmappable → no-match path)", async () => {
    replies(
      JSON.stringify({ state: "CONFIRM", reply: "Did I get that right?", concern: "other", style: "mindfulness" }),
    );
    const r = await runConversationTurn(transcript, "en");
    expect(r.concern).toBeUndefined();
    expect(r.style).toBe("mindfulness");
  });

  it("drops an out-of-vocab style but keeps a valid concern", async () => {
    replies(
      JSON.stringify({ state: "CONFIRM", reply: "Did I get that right?", concern: "grief", style: "hypnosis" }),
    );
    const r = await runConversationTurn(transcript, "en");
    expect(r.concern).toBe("grief");
    expect(r.style).toBeUndefined();
  });
});

describe("runConversationTurn — failure-only fallback (never on the happy path)", () => {
  it("retries once on malformed output, then succeeds", async () => {
    const complete = replies("not json", JSON.stringify({ state: "GATHER", reply: "Tell me more about that." }));
    const r = await runConversationTurn(transcript, "en");
    expect(complete).toHaveBeenCalledTimes(2);
    expect(r.state).toBe("GATHER");
    expect(r.reply).toContain("Tell me more");
  });

  it("falls back to a neutral templated GATHER line after two bad outputs", async () => {
    replies("not json", "still not json");
    const r = await runConversationTurn(transcript, "en");
    expect(r.state).toBe("GATHER");
    expect(r.reply.length).toBeGreaterThan(0);
    expect(r.concern).toBeUndefined();
  });

  it("treats a wrong-language reply (Hebrew expected, English given) as a failure → retry", async () => {
    const complete = replies(
      JSON.stringify({ state: "GATHER", reply: "An English reply." }),
      JSON.stringify({ state: "GATHER", reply: "ספר לי עוד על זה." }),
    );
    const r = await runConversationTurn(transcript, "he");
    expect(complete).toHaveBeenCalledTimes(2);
    expect(r.reply).toContain("ספר");
  });

  it("uses the neutral templated line (no model call) when no key is configured", async () => {
    delete process.env.OPENAI_API_KEY;
    const r = await runConversationTurn(transcript, "en");
    expect(r.state).toBe("GATHER");
    expect(mAi).not.toHaveBeenCalled();
  });
});

describe("runConversationTurn — M2 cost guards", () => {
  it("passes a max-completion-tokens cap to the model call", async () => {
    const complete = replies(JSON.stringify({ state: "GATHER", reply: "go on" }));
    await runConversationTurn(transcript, "en");
    expect(complete).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ maxCompletionTokens: expect.any(Number) }),
    );
  });

  it("caps the transcript slice sent to the model (most-recent messages only)", async () => {
    const complete = replies(JSON.stringify({ state: "GATHER", reply: "ok" }));
    // 30 user/assistant messages — far more than the cap.
    const long: StoredMessage[] = Array.from({ length: 30 }, (_, i) => ({
      role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: `m${i}`,
    }));
    await runConversationTurn(long, "en");
    const sent = complete.mock.calls[0][0] as { role: string; content: string }[];
    // 1 system + a capped slice — must be well under (30 + 1).
    expect(sent.length).toBeLessThan(20);
    expect(sent[0].role).toBe("system");
    // The most-recent message must be included; the oldest must be dropped.
    expect(sent.at(-1)?.content).toBe("m29");
    expect(sent.some((m) => m.content === "m0")).toBe(false);
  });

  it("forceConfirm coerces a stubborn GATHER into CONFIRM", async () => {
    replies(JSON.stringify({ state: "GATHER", reply: "one more question?" }));
    const r = await runConversationTurn(transcript, "en", true);
    expect(r.state).toBe("CONFIRM");
  });

  it("forceConfirm appends the confirm-now nudge to the system prompt", async () => {
    const complete = replies(JSON.stringify({ state: "CONFIRM", reply: "got it. Did I get that right?", concern: "anxiety", style: "mindfulness" }));
    await runConversationTurn(transcript, "en", true);
    const sent = complete.mock.calls[0][0] as { role: string; content: string }[];
    expect(sent[0].content).toContain("deliver the CONFIRM message now");
  });
});
