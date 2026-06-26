import { describe, it, expect, vi, beforeEach } from "vitest";
import { runChipTurn } from "./chip-flow";
import { runIntakeTurn } from "./service";
import { ChipIntakeProvider, ApiIntakeProvider, getIntakeProvider } from "./provider";
import type { IntakeTurn } from "./contract";

vi.mock("./chip-flow", () => ({ runChipTurn: vi.fn() }));
vi.mock("./service", () => ({ runIntakeTurn: vi.fn() }));
// provider.ts now imports crisisMessage from ./crisis (real, owner-verified copy).
// crisis.ts pulls in @/server/ai (→ DB/env); stub that boundary so the real crisis
// resources still load in the unit test without touching the database.
vi.mock("@/server/ai", () => ({ aiProvider: vi.fn(), recordUsage: vi.fn() }));

const mChip = vi.mocked(runChipTurn);
const mApi = vi.mocked(runIntakeTurn);

const chipTurn: IntakeTurn = {
  sessionId: "s1",
  assistantMessage: "hello",
  state: "GATHER",
  options: ["anxiety"],
  secondaryActions: ["get_help_now"],
  matches: [],
};

beforeEach(() => {
  vi.resetAllMocks();
  mChip.mockResolvedValue(chipTurn);
});

describe("IntakeProvider seam", () => {
  it("ChipIntakeProvider delegates to runChipTurn and returns the IntakeTurn", async () => {
    const p = new ChipIntakeProvider();
    const out = await p.handle({ locale: "en", text: "hi" });
    expect(mChip).toHaveBeenCalledWith({ locale: "en", text: "hi" });
    expect(out).toBe(chipTurn);
  });

  it("ApiIntakeProvider adapts the AI IntakeResponse to the IntakeTurn contract", async () => {
    mApi.mockResolvedValue({
      sessionId: "s2",
      assistantMessage: "mirror",
      state: "MATCH",
      matches: [{ therapistId: "t1", rationale: "fits", nextAvailable: "2030-01-01T09:00:00.000Z" }],
      options: ["yes", "not_quite"],
      engine: "ai",
    });
    const p = new ApiIntakeProvider();
    const out = await p.handle({ locale: "en", message: "I feel low" });
    // The AI flow speaks `message` (its native field), so the provider forwards it.
    expect(mApi).toHaveBeenCalledWith(expect.objectContaining({ message: "I feel low", locale: "en" }));
    expect(out.state).toBe("MATCH");
    expect(out.matches[0]).toMatchObject({
      therapistId: "t1",
      rationale: "fits",
      nextAvailable: "2030-01-01T09:00:00.000Z",
    });
    // The contract requires a rationaleSource even when the AI flow lacks one.
    expect(out.matches[0].rationaleSource).toMatchObject({ field: "bio" });
    // get_help_now is the persistent safety net on the API flow too.
    expect(out.secondaryActions).toContain("get_help_now");
  });

  it("getIntakeProvider selects chip vs api by name; default = chip (the spec flow)", () => {
    expect(getIntakeProvider("chip")).toBeInstanceOf(ChipIntakeProvider);
    expect(getIntakeProvider("api")).toBeInstanceOf(ApiIntakeProvider);
    expect(getIntakeProvider()).toBeInstanceOf(ChipIntakeProvider);
  });

  // B4: get_help_now on the API provider must short-circuit to a CRISIS turn — it
  // must NOT fall through to runIntakeTurn (which reads `message`, not `action`, so
  // the action would be dropped into empty text and never surface the resources).
  it("ApiIntakeProvider short-circuits get_help_now to CRISIS without an AI turn", async () => {
    const p = new ApiIntakeProvider();
    const out = await p.handle({ locale: "en", action: "get_help_now", sessionId: "s9" });
    expect(out.state).toBe("CRISIS");
    expect(out.matches).toEqual([]);
    expect(out.assistantMessage).toContain("101"); // owner-verified crisis resources
    expect(out.secondaryActions).toContain("get_help_now");
    // The AI conversational flow is never invoked for a crisis action.
    expect(mApi).not.toHaveBeenCalled();
  });

  it("get_help_now CRISIS turn is localized (he)", async () => {
    const p = new ApiIntakeProvider();
    const out = await p.handle({ locale: "he", action: "get_help_now" });
    expect(out.state).toBe("CRISIS");
    expect(out.assistantMessage).toContain("ער"); // ER"AN — the Hebrew resources
    expect(mApi).not.toHaveBeenCalled();
  });
});
