import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMatchingCatalog } from "@/features/therapists";
import { getNextAvailable } from "@/features/scheduling";
import { createSession, getSession, saveSession } from "./repository";
import { runIntakeTurn } from "./service";

// Mock the deps so this isolates the scripted phase machine.
vi.mock("@/features/therapists", () => ({ getMatchingCatalog: vi.fn() }));
vi.mock("@/features/scheduling", () => ({ getNextAvailable: vi.fn() }));
vi.mock("./repository", () => ({
  createSession: vi.fn(),
  getSession: vi.fn(),
  saveSession: vi.fn(),
}));

const mCatalog = vi.mocked(getMatchingCatalog);
const mNext = vi.mocked(getNextAvailable);
const mCreate = vi.mocked(createSession);
const mGet = vi.mocked(getSession);
const mSave = vi.mocked(saveSession);

function sessionAt(phase: string, userMsgs: string[] = []) {
  const messages = userMsgs.flatMap((m) => [
    { role: "user" as const, content: m },
    { role: "assistant" as const, content: "…" },
  ]);
  return { id: "s1", state: "GATHER" as const, messages, phase };
}
const savedPhase = () => mSave.mock.calls[0][1].phase;

beforeEach(() => {
  vi.resetAllMocks();
  mCatalog.mockResolvedValue([
    { id: "t1", name: "Dr. A", title: "Anxiety specialist", bio: "I work with anxiety and panic.", skills: ["anxiety", "panic"], languages: ["en"] },
  ]);
  mNext.mockResolvedValue("2030-01-01T09:00:00.000Z");
  mCreate.mockResolvedValue({ id: "s-new", state: "GREETING", messages: [], phase: null });
  mSave.mockResolvedValue();
});

describe("scripted runIntakeTurn", () => {
  it("a fresh session's first message → probe1 (GATHER), saves phase g2", async () => {
    mGet.mockResolvedValue(null);
    const r = await runIntakeTurn({ message: "I feel anxious", locale: "en" });
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
    expect(mNext).toHaveBeenCalledWith("t1", expect.any(String));
    expect(r.assistantMessage).toContain("Dr. A");
  });

  it("confirm + 'yes' but nothing scores → CLARIFY, no match", async () => {
    mCatalog.mockResolvedValue([
      { id: "t9", name: "Z", title: "Couples", bio: "couples work", skills: ["couples"], languages: ["en"] },
    ]);
    mGet.mockResolvedValue(sessionAt("confirm", ["grief and loss", "a death", "months"]));
    const r = await runIntakeTurn({ message: "yes", locale: "en", sessionId: "s1" });
    expect(r.state).toBe("CLARIFY");
    expect(r.matches).toEqual([]);
  });
});
