import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiProvider } from "@/server/ai";
import { buildConfirmMessage, templatedConfirm } from "./confirm";
import type { IntakeSelection } from "./contract";

vi.mock("@/server/ai", () => ({ aiProvider: vi.fn() }));
const mAi = vi.mocked(aiProvider);
const replies = (raw: string) => mAi.mockReturnValue({ complete: vi.fn().mockResolvedValue(raw) });

const sel: IntakeSelection = {
  concern: "anxiety",
  style: "practical_tools",
  language: "en",
  genderPreference: "no_preference",
};

beforeEach(() => {
  vi.resetAllMocks();
  process.env.OPENAI_API_KEY = "k";
});

describe("buildConfirmMessage", () => {
  it("returns the model's warm reply when valid", async () => {
    replies(JSON.stringify({ reply: "You've shown real strength. That weight makes sense. Did I get that right?" }));
    const r = await buildConfirmMessage("work is crushing me", sel, "en");
    expect(r).toContain("Did I get that right?");
  });

  it("falls back to the templated confirm after two bad outputs", async () => {
    replies("not json at all");
    const r = await buildConfirmMessage("x", sel, "en");
    expect(r).toBe(templatedConfirm("en", sel));
  });

  it("uses the templated confirm (no model call) when no key is set", async () => {
    delete process.env.OPENAI_API_KEY;
    const r = await buildConfirmMessage("x", sel, "en");
    expect(r).toBe(templatedConfirm("en", sel));
    expect(mAi).not.toHaveBeenCalled();
  });

  it("rejects a non-Hebrew reply for locale 'he' and falls back", async () => {
    replies(JSON.stringify({ reply: "An English-only reply with no Hebrew letters." }));
    const r = await buildConfirmMessage("x", sel, "he");
    expect(r).toBe(templatedConfirm("he", sel));
  });
});
