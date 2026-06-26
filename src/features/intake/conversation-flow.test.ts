import { describe, it, expect, vi, beforeEach } from "vitest";
import { runConversationFlowTurn } from "./conversation-flow";
import {
  createFlowSession,
  getFlowSession,
  saveFlowSession,
  type FlowSession,
} from "./repository";
import { isCrisis, crisisMessage } from "./crisis";
import { runConversationTurn } from "./conversation";
import { pickTherapist } from "./matching";

vi.mock("./repository", () => ({
  createFlowSession: vi.fn(),
  getFlowSession: vi.fn(),
  saveFlowSession: vi.fn(),
}));
vi.mock("./crisis", () => ({ isCrisis: vi.fn(), crisisMessage: vi.fn() }));
vi.mock("./conversation", () => ({ runConversationTurn: vi.fn() }));
vi.mock("./matching", () => ({ pickTherapist: vi.fn() }));

const mCreate = vi.mocked(createFlowSession);
const mGet = vi.mocked(getFlowSession);
const mSave = vi.mocked(saveFlowSession);
const mCrisis = vi.mocked(isCrisis);
const mCrisisMsg = vi.mocked(crisisMessage);
const mConv = vi.mocked(runConversationTurn);
const mPick = vi.mocked(pickTherapist);

const session = (over: Partial<FlowSession> = {}): FlowSession => ({
  id: "s1",
  messages: [],
  phase: null,
  selection: {},
  opener: "",
  ...over,
});

const savedPhase = () => mSave.mock.calls.at(-1)![1].phase;
const savedSelection = () => mSave.mock.calls.at(-1)![1].selection;

beforeEach(() => {
  vi.resetAllMocks();
  mCreate.mockResolvedValue(session({ id: "s-new" }));
  mSave.mockResolvedValue();
  mCrisis.mockResolvedValue(false);
  mCrisisMsg.mockReturnValue("CRISIS-RESOURCES-101");
});

describe("conversation flow — greeting + opener", () => {
  it("a bare start shows the static greeting + open question (no model call)", async () => {
    mGet.mockResolvedValue(null);
    const r = await runConversationFlowTurn({ locale: "en" });
    expect(r.state).toBe("GREETING");
    expect(r.assistantMessage).toMatch(/glad you're here/i);
    expect(r.assistantMessage).toMatch(/how are you feeling/i);
    expect(mConv).not.toHaveBeenCalled();
    // get_help_now persists on the greeting turn too.
    expect(r.secondaryActions).toContain("get_help_now");
  });

  it("the first free-text opener runs a probe (GATHER) and stores the opener", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "opener" }));
    mConv.mockResolvedValue({ state: "GATHER", reply: "What's been the hardest part?" });
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", text: "work is crushing me" });
    expect(r.state).toBe("GATHER");
    expect(r.assistantMessage).toContain("hardest");
    expect(savedPhase()).toBe("gather");
    expect(mConv).toHaveBeenCalledOnce();
  });
});

describe("conversation flow — crisis on every free-text turn", () => {
  it("a crisis opener halts to CRISIS, matches [], NO model/matcher call", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "opener" }));
    mCrisis.mockResolvedValue(true);
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", text: "I want to die" });
    expect(r.state).toBe("CRISIS");
    expect(r.assistantMessage).toBe("CRISIS-RESOURCES-101");
    expect(r.matches).toEqual([]);
    expect(mConv).not.toHaveBeenCalled();
    expect(mPick).not.toHaveBeenCalled();
    expect(r.secondaryActions).toContain("get_help_now");
  });

  it("a crisis mid-conversation (gather) free-text turn ALSO halts to CRISIS", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "gather", opener: "stress" }));
    mCrisis.mockResolvedValue(true);
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", text: "I can't go on" });
    expect(r.state).toBe("CRISIS");
    expect(mConv).not.toHaveBeenCalled();
  });

  it("get_help_now action → CRISIS on any turn (independent of the classifier)", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "gather" }));
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", action: "get_help_now" });
    expect(r.state).toBe("CRISIS");
    expect(mCrisis).not.toHaveBeenCalled(); // it's not even classifier-gated
    expect(r.matches).toEqual([]);
  });
});

describe("conversation flow — gather → confirm with extraction", () => {
  it("model GATHER → another probe stays in gather", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "gather", opener: "x", messages: [{ role: "user", content: "x" }] }));
    mConv.mockResolvedValue({ state: "GATHER", reply: "How long has it felt this way?" });
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", text: "a few weeks" });
    expect(r.state).toBe("GATHER");
    expect(savedPhase()).toBe("gather");
  });

  it("model CONFIRM → CONFIRM state with [yes/not_quite] chips, stores extracted concern/style", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "gather", opener: "x", messages: [{ role: "user", content: "x" }] }));
    mConv.mockResolvedValue({
      state: "CONFIRM",
      reply: "You've carried a lot. Did I get that right?",
      concern: "stress_burnout",
      style: "practical_tools",
    });
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", text: "yeah it's the job" });
    expect(r.state).toBe("CONFIRM");
    expect(r.options).toEqual(["yes", "not_quite"]);
    expect(savedPhase()).toBe("confirm");
    expect(savedSelection()).toMatchObject({ concern: "stress_burnout", style: "practical_tools" });
  });

  it("an unmappable concern at CONFIRM still confirms, but stores no concern (→ CLARIFY at match)", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "gather", opener: "x", messages: [{ role: "user", content: "x" }] }));
    mConv.mockResolvedValue({ state: "CONFIRM", reply: "Did I get that right?", concern: undefined, style: "mindfulness" });
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", text: "hard to say" });
    expect(r.state).toBe("CONFIRM");
    expect(savedSelection().concern).toBeUndefined();
    expect(savedSelection().style).toBe("mindfulness");
  });
});

describe("conversation flow — confirm loop", () => {
  it("'not_quite' re-gathers once (asks what to adjust), does NOT re-run match", async () => {
    mGet.mockResolvedValue(
      session({ id: "s1", phase: "confirm", opener: "x", selection: { concern: "anxiety", style: "practical_tools" } }),
    );
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", choice: "not_quite" });
    expect(r.state).toBe("GATHER");
    expect(savedPhase()).toBe("reconfirm");
    expect(mPick).not.toHaveBeenCalled();
  });

  it("after 'not_quite', the next free text re-confirms ONCE (state CONFIRM)", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "reconfirm", opener: "x", messages: [{ role: "user", content: "x" }] }));
    mConv.mockResolvedValue({ state: "CONFIRM", reply: "So it's more about X. Did I get that right?", concern: "grief", style: "explore_feelings" });
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", text: "it's actually grief" });
    expect(r.state).toBe("CONFIRM");
    expect(savedPhase()).toBe("confirm");
  });

  it("'yes' at confirm → fit-form transition gate (NOT a match yet)", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "confirm", opener: "x", selection: { concern: "anxiety" } }));
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", choice: "yes" });
    expect(r.state).toBe("GATHER");
    expect(r.options).toEqual(["sure", "skip"]);
    expect(savedPhase()).toBe("fit_gate");
    expect(mPick).not.toHaveBeenCalled();
  });

  it("M1(a): typed free text at confirm (no choice) does NOT advance — re-prompts the confirm chips", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "confirm", opener: "x", selection: { concern: "anxiety" } }));
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", text: "well, maybe" });
    expect(r.state).toBe("CONFIRM");
    expect(r.options).toEqual(["yes", "not_quite"]);
    expect(savedPhase()).toBe("confirm"); // stays at confirm, does NOT reach fit_gate
    expect(mPick).not.toHaveBeenCalled();
    expect(mConv).not.toHaveBeenCalled(); // no model call on a confirm-phase re-prompt
  });

  it("M1(a): an unknown chip at confirm does NOT advance — re-prompts the confirm chips", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "confirm", opener: "x", selection: { concern: "anxiety" } }));
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", choice: "sure" });
    expect(r.state).toBe("CONFIRM");
    expect(savedPhase()).toBe("confirm");
  });

  it("M1(b): typed crisis text AT CONFIRM halts to CRISIS (phase-independent check)", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "confirm", opener: "x", selection: { concern: "anxiety" } }));
    mCrisis.mockResolvedValue(true);
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", text: "I want to die" });
    expect(r.state).toBe("CRISIS");
    expect(r.matches).toEqual([]);
    expect(mPick).not.toHaveBeenCalled();
    expect(mConv).not.toHaveBeenCalled();
  });
});

describe("conversation flow — M2 gather cap", () => {
  it("forces CONFIRM after the user-turn cap (forceConfirm=true on the model call)", async () => {
    // 3 prior user turns already stored; this incoming opener-answer is the 4th → cap.
    mGet.mockResolvedValue(
      session({
        id: "s1",
        phase: "gather",
        opener: "x",
        messages: [
          { role: "user", content: "u1" },
          { role: "assistant", content: "a1" },
          { role: "user", content: "u2" },
          { role: "assistant", content: "a2" },
          { role: "user", content: "u3" },
          { role: "assistant", content: "a3" },
        ],
      }),
    );
    mConv.mockResolvedValue({ state: "CONFIRM", reply: "Did I get that right?", concern: "anxiety", style: "mindfulness" });
    await runConversationFlowTurn({ sessionId: "s1", locale: "en", text: "u4" });
    // 4th user turn → forceConfirm must be true (3rd positional arg).
    expect(mConv).toHaveBeenCalledWith(expect.anything(), "en", true);
  });

  it("does NOT force confirm before the cap (forceConfirm=false)", async () => {
    mGet.mockResolvedValue(
      session({ id: "s1", phase: "gather", opener: "x", messages: [{ role: "user", content: "u1" }, { role: "assistant", content: "a1" }] }),
    );
    mConv.mockResolvedValue({ state: "GATHER", reply: "tell me more" });
    await runConversationFlowTurn({ sessionId: "s1", locale: "en", text: "u2" });
    expect(mConv).toHaveBeenCalledWith(expect.anything(), "en", false);
  });
});

describe("conversation flow — fit form → deterministic match", () => {
  const matchable = session({
    id: "s1",
    phase: "fit_fee",
    opener: "x",
    selection: { concern: "anxiety", style: "practical_tools", availability: "evenings", therapistGender: "female", therapistReligion: "secular" },
  });

  it("the final fit tap runs the deterministic matcher → PRESENT_OPTIONS", async () => {
    mGet.mockResolvedValue(matchable);
    mPick.mockResolvedValue({
      assistantMessage: "Dr. A looks like a great fit.",
      match: { therapistId: "a", rationale: "fits", rationaleSource: { field: "bio", matchedTerm: "anxiety", quote: "anxiety" }, nextAvailable: null },
    });
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", choice: "standard" });
    expect(r.state).toBe("PRESENT_OPTIONS");
    expect(r.matches.map((m) => m.therapistId)).toEqual(["a"]);
    expect(r.done).toBe(true);
    // language hard filter = the active UI locale (not asked).
    expect(mPick).toHaveBeenCalledWith(expect.objectContaining({ language: "en", fee: "standard" }), "en");
  });

  it("no genuine fit → CLARIFY (honest no-match)", async () => {
    mGet.mockResolvedValue(matchable);
    mPick.mockResolvedValue(null);
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", choice: "standard" });
    expect(r.state).toBe("CLARIFY");
    expect(r.matches).toEqual([]);
  });

  it("'skip' at the gate matches on what we have (no penalty)", async () => {
    mGet.mockResolvedValue(session({ id: "s1", phase: "fit_gate", opener: "x", selection: { concern: "anxiety", style: "practical_tools" } }));
    mPick.mockResolvedValue({
      assistantMessage: "Dr. A looks like a great fit.",
      match: { therapistId: "a", rationale: "fits", rationaleSource: { field: "bio", matchedTerm: "anxiety", quote: "anxiety" }, nextAvailable: null },
    });
    const r = await runConversationFlowTurn({ sessionId: "s1", locale: "en", choice: "skip" });
    expect(r.state).toBe("PRESENT_OPTIONS");
    expect(mPick).toHaveBeenCalledWith(expect.objectContaining({ language: "en" }), "en");
  });
});
