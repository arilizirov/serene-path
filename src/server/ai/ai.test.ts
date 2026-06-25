import { describe, it, expect, beforeAll, vi } from "vitest";

// ./index re-exports the Phase 4 usage helpers, which import @/lib/db (Prisma →
// env). Stub that leaf so the stub-provider test stays DB/env-free (the stub
// path records nothing anyway). Same convention as the intake unit tests.
vi.mock("@/lib/db", () => ({ prisma: {} }));

import { aiProvider, type ChatMessage } from "./index";

// These exercise the STUB path, so guarantee no real key leaks in from the env.
beforeAll(() => {
  delete process.env.OPENAI_API_KEY;
});

// The stub is the dev/runtime provider until the real model is wired; its job is
// to emit strict JSON in the §5 model-output shape and drive the state machine.
const sys = (catalogIds: string[]): ChatMessage => ({
  role: "system",
  content: `Catalog: ${JSON.stringify(catalogIds.map((id) => ({ id })))}`,
});
const user = (content: string): ChatMessage => ({ role: "user", content });

async function run(messages: ChatMessage[]) {
  const { text, usage } = await aiProvider().complete(messages);
  // Stub path reports no usage (unpaid) — callers record nothing.
  expect(usage).toBeNull();
  return JSON.parse(text) as {
    state: string;
    reply: string;
    matches: { therapist_id: string; rationale: string }[];
  };
}

describe("ai stub provider", () => {
  it("returns valid JSON with the required fields", async () => {
    const out = await run([sys(["t1"]), user("hi")]);
    expect(typeof out.reply).toBe("string");
    expect(Array.isArray(out.matches)).toBe(true);
    expect(typeof out.state).toBe("string");
  });

  it("mirrors (no matches) on the first user turn", async () => {
    const out = await run([sys(["t1", "t2"]), user("I feel anxious")]);
    expect(out.state).toBe("MIRROR");
    expect(out.matches).toHaveLength(0);
  });

  it("matches catalog therapists on a later turn", async () => {
    const out = await run([
      sys(["t1", "t2", "t3"]),
      user("I feel anxious"),
      { role: "assistant", content: "..." },
      user("yes that's right"),
    ]);
    expect(out.state).toBe("MATCH");
    expect(out.matches.map((m) => m.therapist_id)).toEqual(["t1", "t2"]);
    expect(out.matches[0].rationale.length).toBeGreaterThan(0);
  });

  it("clarifies (no fit) when the catalog is empty", async () => {
    const out = await run([sys([]), user("x"), { role: "assistant", content: "y" }, user("z")]);
    expect(out.state).toBe("CLARIFY");
    expect(out.matches).toHaveLength(0);
  });
});
