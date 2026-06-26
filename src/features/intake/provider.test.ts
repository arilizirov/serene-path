import { describe, it, expect, vi, beforeEach } from "vitest";
import { runConversationFlowTurn } from "./conversation-flow";
import { ConversationIntakeProvider, getIntakeProvider } from "./provider";
import type { IntakeTurn } from "./contract";

vi.mock("./conversation-flow", () => ({ runConversationFlowTurn: vi.fn() }));
const mFlow = vi.mocked(runConversationFlowTurn);

const turn: IntakeTurn = {
  sessionId: "s1",
  assistantMessage: "How are you feeling today?",
  state: "GREETING",
  secondaryActions: ["get_help_now"],
  matches: [],
};

beforeEach(() => {
  vi.resetAllMocks();
  mFlow.mockResolvedValue(turn);
  process.env.OPENAI_API_KEY = "k"; // conversation configured by default
});

describe("IntakeProvider seam (single live flow)", () => {
  it("ConversationIntakeProvider delegates to runConversationFlowTurn (key present)", async () => {
    const p = new ConversationIntakeProvider();
    const out = await p.handle({ locale: "en", text: "hi" });
    expect(mFlow).toHaveBeenCalledWith({ locale: "en", text: "hi" });
    expect(out).toBe(turn);
  });

  it("getIntakeProvider returns the live conversation provider", () => {
    expect(getIntakeProvider()).toBeInstanceOf(ConversationIntakeProvider);
  });
});

describe("B2.1 — fail closed with no OPENAI_API_KEY", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("refuses the conversation and returns a static browse + crisis turn (no flow call)", async () => {
    const p = new ConversationIntakeProvider();
    const out = await p.handle({ locale: "en", text: "hi" });
    expect(mFlow).not.toHaveBeenCalled(); // the conversation never runs
    expect(out.state).toBe("CLARIFY");
    expect(out.matches).toEqual([]);
    expect(out.done).toBe(true);
    // Loud, not silent: points at the directory + a human, keeps the crisis net.
    expect(out.secondaryActions).toEqual(
      expect.arrayContaining(["browse_all", "human_followup", "get_help_now"]),
    );
    expect(out.assistantMessage.length).toBeGreaterThan(0);
  });

  it("returns the no-key message in the requested locale", async () => {
    const p = new ConversationIntakeProvider();
    const he = await p.handle({ locale: "he", text: "שלום" });
    // Hebrew message contains Hebrew characters (not the English copy).
    expect(/[֐-׿]/.test(he.assistantMessage)).toBe(true);
    expect(mFlow).not.toHaveBeenCalled();
  });
});
