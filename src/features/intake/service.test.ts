import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMatchingCatalog } from "@/features/therapists";
import { getNextAvailable } from "@/features/scheduling";
import { aiProvider } from "@/server/ai";
import { createSession, getSession, saveSession } from "./repository";
import { runIntakeTurn } from "./service";

// Mock every dependency so this isolates the service's server-side enforcement of
// UNTRUSTED model output. We drive the model's response per test.
vi.mock("@/features/therapists", () => ({ getMatchingCatalog: vi.fn() }));
vi.mock("@/features/scheduling", () => ({ getNextAvailable: vi.fn() }));
vi.mock("@/server/ai", () => ({ aiProvider: vi.fn() }));
vi.mock("./repository", () => ({
  createSession: vi.fn(),
  getSession: vi.fn(),
  saveSession: vi.fn(),
}));

const mCatalog = vi.mocked(getMatchingCatalog);
const mNext = vi.mocked(getNextAvailable);
const mAi = vi.mocked(aiProvider);
const mCreate = vi.mocked(createSession);
const mGet = vi.mocked(getSession);
const mSave = vi.mocked(saveSession);

/** Make the model return exactly this JSON for the turn. */
function modelReturns(obj: unknown) {
  mAi.mockReturnValue({ complete: vi.fn().mockResolvedValue(JSON.stringify(obj)) });
}
function modelReturnsRaw(raw: string) {
  mAi.mockReturnValue({ complete: vi.fn().mockResolvedValue(raw) });
}

beforeEach(() => {
  vi.resetAllMocks();
  mCatalog.mockResolvedValue([
    { id: "t1", title: "Psy", bio: "anxiety", skills: ["anxiety"], languages: ["en"] },
    { id: "t2", title: "Couns", bio: "couples", skills: ["couples"], languages: ["en"] },
  ]);
  mNext.mockResolvedValue("2030-01-01T09:00:00.000Z");
  mCreate.mockResolvedValue({ id: "s-new", state: "GREETING", messages: [] });
  mGet.mockResolvedValue({ id: "s1", state: "GATHER", messages: [{ role: "user", content: "hi" }] });
  mSave.mockResolvedValue();
});

const turn = (over: Partial<{ sessionId: string; message: string }> = {}) =>
  runIntakeTurn({ message: "I feel anxious", locale: "en", ...over });

describe("runIntakeTurn — server-side enforcement", () => {
  it("drops hallucinated therapist ids (not in the catalog)", async () => {
    modelReturns({
      state: "MATCH",
      reply: "here",
      matches: [
        { therapist_id: "t1", rationale: "fits" },
        { therapist_id: "ghost", rationale: "made up" },
      ],
    });
    const r = await turn({ sessionId: "s1" });
    expect(r.matches.map((m) => m.therapistId)).toEqual(["t1"]);
  });

  it("server-resolves nextAvailable (never the model's value)", async () => {
    modelReturns({ state: "MATCH", reply: "x", matches: [{ therapist_id: "t1", rationale: "r" }] });
    const r = await turn({ sessionId: "s1" });
    expect(mNext).toHaveBeenCalledWith("t1", expect.any(String));
    expect(r.matches[0].nextAvailable).toBe("2030-01-01T09:00:00.000Z");
  });

  it("ignores matches outside MATCH/PRESENT_OPTIONS", async () => {
    modelReturns({ state: "MIRROR", reply: "x", matches: [{ therapist_id: "t1", rationale: "r" }] });
    const r = await turn({ sessionId: "s1" });
    expect(r.matches).toEqual([]);
    expect(mNext).not.toHaveBeenCalled();
  });

  it("collapses duplicate ids", async () => {
    modelReturns({
      state: "PRESENT_OPTIONS",
      reply: "x",
      matches: [
        { therapist_id: "t1", rationale: "a" },
        { therapist_id: "t1", rationale: "b" },
      ],
    });
    const r = await turn({ sessionId: "s1" });
    expect(r.matches).toHaveLength(1);
  });

  it("falls back to a safe CLARIFY when the model output is unparseable", async () => {
    modelReturnsRaw("totally not json");
    const r = await turn({ sessionId: "s1" });
    expect(r.state).toBe("CLARIFY");
    expect(r.matches).toEqual([]);
    expect(r.assistantMessage.length).toBeGreaterThan(0);
    expect(mSave).toHaveBeenCalled(); // turn still persisted
  });

  it("tolerates a JSON object wrapped in prose / code fences", async () => {
    modelReturnsRaw('```json\n{"state":"MATCH","reply":"ok","matches":[{"therapist_id":"t2","rationale":"r"}]}\n```');
    const r = await turn({ sessionId: "s1" });
    expect(r.matches.map((m) => m.therapistId)).toEqual(["t2"]);
  });

  it("creates a new session when none is supplied, and persists the transcript", async () => {
    modelReturns({ state: "GATHER", reply: "tell me more", matches: [] });
    const r = await turn();
    expect(r.sessionId).toBe("s-new");
    expect(mCreate).toHaveBeenCalled();
    // saved transcript ends with the assistant reply we returned
    const saved = mSave.mock.calls[0][1];
    expect(saved.messages.at(-1)).toEqual({ role: "assistant", content: "tell me more" });
    expect(saved.messages.some((m) => m.role === "user" && m.content === "I feel anxious")).toBe(true);
  });
});
