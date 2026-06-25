import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiProvider } from "@/server/ai";
import { extractConcern } from "./extract";

vi.mock("@/server/ai", () => ({ aiProvider: vi.fn(), recordUsage: vi.fn() }));
const mAi = vi.mocked(aiProvider);
// {text, usage} completion shape; usage null → recordUsage stays out of the unit path.
const returns = (raw: string) =>
  mAi.mockReturnValue({ complete: vi.fn().mockResolvedValue({ text: raw, usage: null }) });

beforeEach(() => {
  vi.resetAllMocks();
  process.env.OPENAI_API_KEY = "k";
});

describe("extractConcern", () => {
  it("maps free text to a catalog concern id", async () => {
    returns(JSON.stringify({ concern: "trauma" }));
    expect(await extractConcern("a car crash keeps replaying", "en")).toBe("trauma");
  });

  it("returns something_else for an invalid concern id", async () => {
    returns(JSON.stringify({ concern: "bogus_id" }));
    expect(await extractConcern("hmm", "en")).toBe("something_else");
  });

  it("returns something_else on malformed output", async () => {
    returns("not json");
    expect(await extractConcern("hmm", "en")).toBe("something_else");
  });

  it("returns something_else (no model call) when no key is set", async () => {
    delete process.env.OPENAI_API_KEY;
    expect(await extractConcern("hmm", "en")).toBe("something_else");
  });
});
