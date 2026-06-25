import { describe, it, expect, vi } from "vitest";

// The markdown builders are pure, but importing ./service pulls in its module
// graph (therapists → Prisma → env). Stub those leaves so this unit test runs
// without a DB/env — same shape as service.test.ts.
vi.mock("@/features/therapists", () => ({ getMatchingCatalog: vi.fn() }));
vi.mock("@/features/scheduling", () => ({ getNextAvailable: vi.fn() }));
vi.mock("@/server/ai", () => ({ aiProvider: vi.fn() }));
vi.mock("./repository", () => ({}));

import { conversationToMarkdown, conversationsToMarkdown } from "./service";
import type { FullSession } from "./repository";

function session(over: Partial<FullSession> = {}): FullSession {
  return {
    id: "ckxyz123abcdef",
    createdAt: new Date("2030-01-01T08:00:00.000Z"),
    updatedAt: new Date("2030-01-01T09:30:00.000Z"),
    state: "PRESENT_OPTIONS",
    engine: "scripted",
    messages: [
      { role: "user", content: "I feel anxious." },
      { role: "assistant", content: "Tell me more." },
    ],
    matched: ["t1", "t2"],
    ...over,
  };
}

describe("conversationToMarkdown", () => {
  it("emits YAML frontmatter with id/created/finished/state/engine/matched/turns", () => {
    const md = conversationToMarkdown(session());
    expect(md).toContain("---\n");
    expect(md).toContain("id: ckxyz123abcdef");
    expect(md).toContain("created: 2030-01-01T08:00:00.000Z");
    expect(md).toContain("finished: 2030-01-01T09:30:00.000Z");
    expect(md).toContain("state: PRESENT_OPTIONS");
    expect(md).toContain("engine: scripted");
    expect(md).toContain("matched: 2");
    expect(md).toContain("turns: 2");
  });

  it("renders the transcript as labelled User/Assistant blocks", () => {
    const md = conversationToMarkdown(session());
    expect(md).toContain("**User:**\n\nI feel anxious.");
    expect(md).toContain("**Assistant:**\n\nTell me more.");
  });

  it("falls back to engine 'unknown' when none was recorded", () => {
    expect(conversationToMarkdown(session({ engine: null }))).toContain(
      "engine: unknown",
    );
  });
});

describe("conversationsToMarkdown", () => {
  it("joins multiple conversations with a horizontal rule", () => {
    const md = conversationsToMarkdown([
      session({ id: "a" }),
      session({ id: "b" }),
    ]);
    expect(md).toContain("\n\n---\n\n");
    expect(md).toContain("id: a");
    expect(md).toContain("id: b");
  });

  it("returns an empty string for no sessions", () => {
    expect(conversationsToMarkdown([])).toBe("");
  });
});
