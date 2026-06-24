import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiProvider } from "@/server/ai";
import { looksLikeCrisis, isCrisis, crisisMessage } from "./crisis";

vi.mock("@/server/ai", () => ({ aiProvider: vi.fn() }));
const mAi = vi.mocked(aiProvider);
const classifies = (crisis: boolean) =>
  mAi.mockReturnValue({ complete: vi.fn().mockResolvedValue(JSON.stringify({ crisis })) });

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.OPENAI_API_KEY;
});

describe("crisis detection", () => {
  it("keyword net catches explicit self-harm across locales", () => {
    expect(looksLikeCrisis("honestly I want to die", "en")).toBe(true);
    expect(looksLikeCrisis("אני רוצה להתאבד", "he")).toBe(true);
    expect(looksLikeCrisis("je veux en finir", "fr")).toBe(true);
  });

  it("keyword net does NOT fire on ordinary distress or figures of speech", () => {
    expect(looksLikeCrisis("this deadline is killing my motivation", "en")).toBe(false);
    expect(looksLikeCrisis("I'm exhausted and stressed at work", "en")).toBe(false);
  });

  it("isCrisis short-circuits true on a keyword hit", async () => {
    process.env.OPENAI_API_KEY = "k";
    classifies(false);
    expect(await isCrisis("I want to die", "en")).toBe(true);
  });

  it("isCrisis escalates to the model for phrasings the keywords miss (passive ideation)", async () => {
    process.env.OPENAI_API_KEY = "k";
    classifies(true);
    expect(await isCrisis("everyone would be better off without me", "en")).toBe(true);
  });

  it("isCrisis is keyword-only (no model) when no key is configured", async () => {
    expect(await isCrisis("everyone would be better off without me", "en")).toBe(false);
  });

  it("provides confirmed crisis lines per locale", () => {
    expect(crisisMessage("en")).toContain("101");
    expect(crisisMessage("he")).toContain("1201");
    expect(crisisMessage("fr")).toContain("ERAN");
  });
});
