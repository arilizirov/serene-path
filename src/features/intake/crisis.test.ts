import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiProvider } from "@/server/ai";
import { looksLikeCrisis, isCrisis, crisisMessage } from "./crisis";

vi.mock("@/server/ai", () => ({ aiProvider: vi.fn(), recordUsage: vi.fn() }));
const mAi = vi.mocked(aiProvider);
// {text, usage} completion shape; usage null → recordUsage stays out of the unit path.
const classifies = (crisis: boolean) =>
  mAi.mockReturnValue({
    complete: vi.fn().mockResolvedValue({ text: JSON.stringify({ crisis }), usage: null }),
  });

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

  it("imminent self-harm phrasing fires on the keyword net (no model needed)", () => {
    expect(looksLikeCrisis("I'm going to kill myself tonight", "en")).toBe(true);
    expect(looksLikeCrisis("I have a plan to end my life", "en")).toBe(true);
  });

  it("ambiguous distress is escalated to the high-recall classifier, not silently passed", async () => {
    process.env.OPENAI_API_KEY = "k";
    // The keyword net does not fire; the model is consulted (high recall) and decides.
    classifies(true);
    expect(await isCrisis("I can't go on like this anymore", "en")).toBe(true);
  });

  it("an abuse disclosure is routed to the model classifier (keyword net does not fire)", async () => {
    process.env.OPENAI_API_KEY = "k";
    // Abuse disclosure isn't a self-harm keyword; the classifier gets to weigh in.
    classifies(true);
    expect(await isCrisis("my partner hits me and I'm scared to go home", "en")).toBe(true);
  });

  it("a clear joke / hyperbole does not fire the keyword net", () => {
    expect(looksLikeCrisis("this commute is killing me lol", "en")).toBe(false);
    expect(looksLikeCrisis("I could kill for a coffee right now", "en")).toBe(false);
  });

  it("B2.2: passive-ideation stems trip the keyword net WITHOUT a model, in each locale", () => {
    // No key set (beforeEach deletes it) → looksLikeCrisis is the only line of defense.
    expect(looksLikeCrisis("honestly I don't see the point anymore", "en")).toBe(true);
    expect(looksLikeCrisis("I can't go on like this", "en")).toBe(true);
    expect(looksLikeCrisis("what's the point anymore", "en")).toBe(true);
    expect(looksLikeCrisis("אין לי טעם להמשיך", "he")).toBe(true);
    expect(looksLikeCrisis("אני לא יכול להמשיך ככה", "he")).toBe(true);
    expect(looksLikeCrisis("à quoi bon continuer", "fr")).toBe(true);
    expect(looksLikeCrisis("je n'en peux plus", "fr")).toBe(true);
  });

  it("B2.2: abuse stems trip the keyword net in each locale", () => {
    expect(looksLikeCrisis("my partner hits me and I'm scared to go home", "en")).toBe(true);
    expect(looksLikeCrisis("בן הזוג שלי מכה אותי", "he")).toBe(true);
    expect(looksLikeCrisis("il me frappe tous les jours", "fr")).toBe(true);
  });

  it("B2.2: the new stems fire end-to-end via isCrisis with NO key (keyword-only)", async () => {
    // Fail-closed safety: even without the model, passive ideation reaches CRISIS.
    expect(await isCrisis("I don't see the point anymore", "en")).toBe(true);
  });

  it("provides confirmed crisis lines per locale", () => {
    expect(crisisMessage("en")).toContain("101");
    expect(crisisMessage("he")).toContain("1201");
    expect(crisisMessage("fr")).toContain("ERAN");
  });
});
