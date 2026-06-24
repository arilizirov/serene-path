import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFlowSession, getFlowSession, saveFlowSession } from "./repository";
import { buildConfirmMessage } from "./confirm";
import { pickTherapist } from "./matching";
import { isCrisis, crisisMessage } from "./crisis";
import { extractConcern } from "./extract";
import { runChipTurn } from "./chip-flow";
import type { IntakeSelection } from "./contract";

vi.mock("./repository", () => ({
  createFlowSession: vi.fn(),
  getFlowSession: vi.fn(),
  saveFlowSession: vi.fn(),
}));
vi.mock("./confirm", () => ({ buildConfirmMessage: vi.fn() }));
vi.mock("./matching", () => ({ pickTherapist: vi.fn() }));
vi.mock("./crisis", () => ({ isCrisis: vi.fn(), crisisMessage: vi.fn() }));
vi.mock("./extract", () => ({ extractConcern: vi.fn() }));
const mCreate = vi.mocked(createFlowSession);
const mGet = vi.mocked(getFlowSession);
const mSave = vi.mocked(saveFlowSession);
const mConfirm = vi.mocked(buildConfirmMessage);
const mPick = vi.mocked(pickTherapist);
const mIsCrisis = vi.mocked(isCrisis);
const mCrisisMsg = vi.mocked(crisisMessage);
const mExtract = vi.mocked(extractConcern);

const at = (phase: string, selection: IntakeSelection = {}, opener = "i feel low") => ({
  id: "s1",
  messages: [],
  phase,
  selection,
  opener,
});
const saved = () => mSave.mock.calls[0][1];

beforeEach(() => {
  vi.resetAllMocks();
  mCreate.mockResolvedValue({ id: "s-new", messages: [], phase: null, selection: {}, opener: "" });
  mSave.mockResolvedValue();
  mConfirm.mockResolvedValue("CONFIRM_MSG");
  mPick.mockResolvedValue(null);
  mIsCrisis.mockResolvedValue(false);
  mCrisisMsg.mockReturnValue("CRISIS_MSG");
  mExtract.mockResolvedValue("something_else");
});

describe("chip flow", () => {
  it("opener free text → concern chips (GATHER), with the safety net present", async () => {
    mGet.mockResolvedValue(null);
    const r = await runChipTurn({ locale: "en", text: "work has been crushing me" });
    expect(r.state).toBe("GATHER");
    expect(r.options).toContain("anxiety");
    expect(r.secondaryActions).toContain("get_help_now");
    expect(saved().phase).toBe("concern");
  });

  it("crisis detected in the opener → CRISIS, no matches, halts", async () => {
    mGet.mockResolvedValue(null);
    mIsCrisis.mockResolvedValue(true);
    const r = await runChipTurn({ locale: "en", text: "honestly I just want to die" });
    expect(r.state).toBe("CRISIS");
    expect(r.matches).toEqual([]);
    expect(saved().phase).toBe("crisis");
  });

  it("something_else free text → concern extracted, advances to style", async () => {
    mGet.mockResolvedValue(at("something_else"));
    mExtract.mockResolvedValue("trauma");
    const r = await runChipTurn({ locale: "en", sessionId: "s1", text: "a car accident keeps replaying" });
    expect(saved().selection.concern).toBe("trauma");
    expect(saved().phase).toBe("style");
    expect(r.options).toEqual(expect.arrayContaining(["practical_tools"]));
  });

  it("concern chip → style chips", async () => {
    mGet.mockResolvedValue(at("concern"));
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "anxiety" });
    expect(r.options).toEqual(expect.arrayContaining(["practical_tools"]));
    expect(saved().phase).toBe("style");
    expect(saved().selection.concern).toBe("anxiety");
  });

  it("something_else opens free text", async () => {
    mGet.mockResolvedValue(at("concern"));
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "something_else" });
    expect(r.state).toBe("GATHER");
    expect(saved().phase).toBe("something_else");
  });

  it("gender chip → CONFIRM with yes / not_quite", async () => {
    mGet.mockResolvedValue(at("gender", { concern: "anxiety", style: "practical_tools", language: "en" }));
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "no_preference" });
    expect(r.state).toBe("CONFIRM");
    expect(r.options).toEqual(["yes", "not_quite"]);
    expect(saved().phase).toBe("confirm");
  });

  it("not_quite at confirm → re-ask concern, selection cleared", async () => {
    mGet.mockResolvedValue(at("confirm", { concern: "anxiety", style: "practical_tools", language: "en", genderPreference: "no_preference" }));
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "not_quite" });
    expect(r.state).toBe("GATHER");
    expect(r.options).toContain("anxiety");
    expect(saved().phase).toBe("concern");
    expect(saved().selection.concern).toBeUndefined();
  });

  it("get_help_now → CRISIS resources on any turn", async () => {
    mGet.mockResolvedValue(at("style", { concern: "anxiety" }));
    const r = await runChipTurn({ locale: "en", sessionId: "s1", action: "get_help_now" });
    expect(r.state).toBe("CRISIS");
  });

  it("an invalid chip choice re-asks the same step", async () => {
    mGet.mockResolvedValue(at("style", { concern: "anxiety" }));
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "bogus" });
    expect(saved().phase).toBe("style");
    expect(r.options).toEqual(expect.arrayContaining(["practical_tools"]));
  });

  it("confirm 'yes' with a fit → PRESENT_OPTIONS + one match (done)", async () => {
    mGet.mockResolvedValue(at("confirm", { concern: "anxiety", style: "practical_tools", language: "en", genderPreference: "no_preference" }));
    mPick.mockResolvedValue({
      match: { therapistId: "t1", rationale: "r", rationaleSource: { field: "bio", matchedTerm: "anxiety", quote: "q" }, nextAvailable: "2030-01-01T09:00:00.000Z" },
      assistantMessage: "Dr. A fits.",
    });
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "yes" });
    expect(r.state).toBe("PRESENT_OPTIONS");
    expect(r.matches.map((m) => m.therapistId)).toEqual(["t1"]);
    expect(r.done).toBe(true);
  });

  it("confirm 'yes' with no fit → CLARIFY, no match", async () => {
    mGet.mockResolvedValue(at("confirm", { concern: "grief", language: "en" }));
    mPick.mockResolvedValue(null);
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "yes" });
    expect(r.state).toBe("CLARIFY");
    expect(r.matches).toEqual([]);
  });
});
