import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMatchingCatalog } from "@/features/therapists";
import { getNextAvailable } from "@/features/scheduling";
import { aiProvider } from "@/server/ai";
import { createSession, getSession, saveSession } from "./repository";
import { runIntakeTurn } from "./service";

vi.mock("@/features/therapists", () => ({ getMatchingCatalog: vi.fn() }));
vi.mock("@/features/scheduling", () => ({ getNextAvailable: vi.fn() }));
vi.mock("@/server/ai", () => ({ aiProvider: vi.fn(), recordUsage: vi.fn() }));
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

function sessionAt(phase: string, userMsgs: string[] = []) {
  const messages = userMsgs.flatMap((m) => [
    { role: "user" as const, content: m },
    { role: "assistant" as const, content: "…" },
  ]);
  return { id: "s1", state: "GATHER" as const, messages, phase, engine: null };
}
const savedPhase = () => mSave.mock.calls[0][1].phase;
// Mocks now resolve the {text, usage} completion shape; usage null keeps
// recordUsage out of the unit path (the real provider would carry usage).
const aiReplies = (raw: string) =>
  mAi.mockReturnValue({ complete: vi.fn().mockResolvedValue({ text: raw, usage: null }) });

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.OPENAI_API_KEY; // default → scripted unless a test opts into AI
  mCatalog.mockResolvedValue([
    { id: "t1", name: "Dr. A", title: "Anxiety specialist", bio: "I work with anxiety and panic.", skills: ["anxiety", "panic"], languages: ["en"] },
  ]);
  mNext.mockResolvedValue("2030-01-01T09:00:00.000Z");
  mCreate.mockResolvedValue({ id: "s-new", state: "GREETING", messages: [], phase: null, engine: null });
  mSave.mockResolvedValue();
});

describe("scripted engine", () => {
  it("a fresh session's first message → probe1 (GATHER), saves phase g2", async () => {
    mGet.mockResolvedValue(null);
    const r = await runIntakeTurn({ message: "I feel anxious", locale: "en" });
    expect(r.engine).toBe("scripted");
    expect(r.state).toBe("GATHER");
    expect(r.sessionId).toBe("s-new");
    expect(savedPhase()).toBe("g2");
  });

  it("g2 → probe2", async () => {
    mGet.mockResolvedValue(sessionAt("g2", ["anxious"]));
    const r = await runIntakeTurn({ message: "work", locale: "en", sessionId: "s1" });
    expect(r.state).toBe("GATHER");
    expect(savedPhase()).toBe("g3");
  });

  it("g3 → mirror + CONFIRM with Yes/Not-quite chips", async () => {
    mGet.mockResolvedValue(sessionAt("g3", ["anxious", "work"]));
    const r = await runIntakeTurn({ message: "a few weeks", locale: "en", sessionId: "s1" });
    expect(r.state).toBe("CONFIRM");
    expect(r.options).toEqual(["Yes, that's right", "Not quite"]);
    expect(savedPhase()).toBe("confirm");
  });

  it("confirm + 'Not quite' → regather (no match)", async () => {
    mGet.mockResolvedValue(sessionAt("confirm", ["anxious", "work", "weeks"]));
    const r = await runIntakeTurn({ message: "Not quite", locale: "en", sessionId: "s1" });
    expect(r.state).toBe("GATHER");
    expect(r.matches).toEqual([]);
    expect(savedPhase()).toBe("regather");
  });

  it("confirm + 'yes' → MATCH a catalog therapist with a server-resolved slot", async () => {
    mGet.mockResolvedValue(sessionAt("confirm", ["anxiety and panic", "work", "weeks"]));
    const r = await runIntakeTurn({ message: "Yes, that's right", locale: "en", sessionId: "s1" });
    expect(r.state).toBe("PRESENT_OPTIONS");
    expect(r.matches.map((m) => m.therapistId)).toEqual(["t1"]);
    expect(r.matches[0].nextAvailable).toBe("2030-01-01T09:00:00.000Z");
    expect(r.assistantMessage).toContain("Dr. A");
  });

  it("stays scripted even if a request asks for ai when no key is configured", async () => {
    mGet.mockResolvedValue(sessionAt("g1", []));
    const r = await runIntakeTurn({ message: "hi", locale: "en", sessionId: "s1", engine: "ai" });
    expect(r.engine).toBe("scripted");
    expect(mAi).not.toHaveBeenCalled();
  });
});

describe("ai engine (key present) — enforces §5 on untrusted output", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
    mGet.mockResolvedValue({ id: "s1", state: "GATHER", messages: [], phase: null, engine: null });
  });

  it("accepts a catalog match and resolves the slot server-side", async () => {
    aiReplies(JSON.stringify({ state: "MATCH", reply: "Dr. A fits.", matches: [{ therapist_id: "t1", rationale: "anxiety fit" }] }));
    const r = await runIntakeTurn({ message: "panic", locale: "en", sessionId: "s1", engine: "ai" });
    expect(r.engine).toBe("ai");
    expect(r.matches.map((m) => m.therapistId)).toEqual(["t1"]);
    expect(r.matches[0].nextAvailable).toBe("2030-01-01T09:00:00.000Z");
    expect(mNext).toHaveBeenCalledWith("t1", expect.any(String));
  });

  it("drops a hallucinated (non-catalog) id and downgrades the empty MATCH to CLARIFY", async () => {
    aiReplies(JSON.stringify({ state: "MATCH", reply: "x", matches: [{ therapist_id: "ghost", rationale: "y" }] }));
    const r = await runIntakeTurn({ message: "panic", locale: "en", sessionId: "s1", engine: "ai" });
    expect(r.matches).toEqual([]);
    expect(r.state).toBe("CLARIFY");
  });

  it("drops matches when state is not MATCH/PRESENT_OPTIONS", async () => {
    aiReplies(JSON.stringify({ state: "GATHER", reply: "tell me more", matches: [{ therapist_id: "t1", rationale: "z" }] }));
    const r = await runIntakeTurn({ message: "panic", locale: "en", sessionId: "s1", engine: "ai" });
    expect(r.matches).toEqual([]);
  });

  it("falls back to a safe CLARIFY on unparseable output", async () => {
    aiReplies("not json at all");
    const r = await runIntakeTurn({ message: "panic", locale: "en", sessionId: "s1", engine: "ai" });
    expect(r.state).toBe("CLARIFY");
    expect(r.matches).toEqual([]);
  });
});
