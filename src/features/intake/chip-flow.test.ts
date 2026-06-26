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
/** The MOST RECENT saveFlowSession payload — for multi-step tests that call
 *  runChipTurn several times without a mock reset between steps. */
const lastSaved = () => mSave.mock.calls[mSave.mock.calls.length - 1][1];

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

  it("something_else with EMPTY text re-asks without firing the paid model calls", async () => {
    mGet.mockResolvedValue(at("something_else"));
    const r = await runChipTurn({ locale: "en", sessionId: "s1", text: "   " });
    expect(r.state).toBe("GATHER");
    expect(saved().phase).toBe("something_else");
    expect(mIsCrisis).not.toHaveBeenCalled();
    expect(mExtract).not.toHaveBeenCalled();
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

  it("language chip → CONFIRM with yes / not_quite (gender is asked later, in the fit form)", async () => {
    mGet.mockResolvedValue(at("language", { concern: "anxiety", style: "practical_tools" }));
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "en" });
    expect(r.state).toBe("CONFIRM");
    expect(r.options).toEqual(["yes", "not_quite"]);
    expect(saved().phase).toBe("confirm");
    expect(saved().selection.language).toBe("en");
  });

  it("not_quite at confirm → re-ask concern, selection cleared", async () => {
    mGet.mockResolvedValue(at("confirm", { concern: "anxiety", style: "practical_tools", language: "en" }));
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "not_quite" });
    expect(r.state).toBe("GATHER");
    expect(r.options).toContain("anxiety");
    expect(saved().phase).toBe("concern");
    expect(saved().selection.concern).toBeUndefined();
  });

  it("confirm 'yes' → fit-form transition gate (sure / skip), NOT match yet", async () => {
    mGet.mockResolvedValue(at("confirm", { concern: "anxiety", style: "practical_tools", language: "en" }));
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "yes" });
    expect(r.state).toBe("GATHER");
    expect(r.options).toEqual(["sure", "skip"]);
    expect(saved().phase).toBe("fit_gate");
    expect(mPick).not.toHaveBeenCalled();
  });

  it("fit gate 'skip' → match on what we have (no penalty)", async () => {
    mGet.mockResolvedValue(at("fit_gate", { concern: "anxiety", style: "practical_tools", language: "en" }));
    mPick.mockResolvedValue({
      match: { therapistId: "t1", rationale: "r", rationaleSource: { field: "bio", matchedTerm: "anxiety", quote: "q" }, nextAvailable: null },
      assistantMessage: "Dr. A fits.",
    });
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "skip" });
    expect(r.state).toBe("PRESENT_OPTIONS");
    expect(mPick).toHaveBeenCalled();
  });

  it("fit gate 'sure' → ask therapist gender", async () => {
    mGet.mockResolvedValue(at("fit_gate", { concern: "anxiety", style: "practical_tools", language: "en" }));
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "sure" });
    expect(r.state).toBe("GATHER");
    expect(r.options).toEqual(expect.arrayContaining(["no_preference", "female", "male"]));
    expect(saved().phase).toBe("fit_gender");
  });

  it("fit form walks gender → religion → availability → fee → match", async () => {
    mPick.mockResolvedValue({
      match: { therapistId: "t1", rationale: "r", rationaleSource: { field: "bio", matchedTerm: "anxiety", quote: "q" }, nextAvailable: null },
      assistantMessage: "Dr. A fits.",
    });

    mGet.mockResolvedValue(at("fit_gender", { concern: "anxiety" }));
    let r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "female" });
    expect(lastSaved().selection.therapistGender).toBe("female");
    expect(lastSaved().phase).toBe("fit_religion");
    expect(r.options).toEqual(expect.arrayContaining(["secular", "dati", "haredi"]));

    mGet.mockResolvedValue(at("fit_religion", { concern: "anxiety", therapistGender: "female" }));
    r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "dati" });
    expect(lastSaved().selection.therapistReligion).toBe("dati");
    expect(lastSaved().phase).toBe("fit_availability");
    expect(r.options).toEqual(expect.arrayContaining(["evenings", "flexible"]));

    mGet.mockResolvedValue(at("fit_availability", { concern: "anxiety", therapistGender: "female", therapistReligion: "dati" }));
    r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "evenings" });
    expect(lastSaved().selection.availability).toBe("evenings");
    expect(lastSaved().phase).toBe("fit_fee");
    expect(r.options).toEqual(expect.arrayContaining(["standard", "sliding_scale", "insurance", "soldier_subsidy"]));

    mGet.mockResolvedValue(at("fit_fee", { concern: "anxiety", therapistGender: "female", therapistReligion: "dati", availability: "evenings" }));
    r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "sliding_scale" });
    expect(lastSaved().selection.fee).toBe("sliding_scale");
    expect(r.state).toBe("PRESENT_OPTIONS");
    expect(mPick).toHaveBeenCalled();
  });

  it("a crisis term typed during something_else still halts to CRISIS", async () => {
    mGet.mockResolvedValue(at("something_else"));
    mIsCrisis.mockResolvedValue(true);
    const r = await runChipTurn({ locale: "en", sessionId: "s1", text: "I want to end it all" });
    expect(r.state).toBe("CRISIS");
    expect(r.matches).toEqual([]);
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

  it("fit fee answered, with a fit → PRESENT_OPTIONS + one match (done)", async () => {
    mGet.mockResolvedValue(at("fit_fee", { concern: "anxiety", style: "practical_tools", language: "en", therapistGender: "no_preference", therapistReligion: "no_preference", availability: "flexible" }));
    mPick.mockResolvedValue({
      match: { therapistId: "t1", rationale: "r", rationaleSource: { field: "bio", matchedTerm: "anxiety", quote: "q" }, nextAvailable: "2030-01-01T09:00:00.000Z" },
      assistantMessage: "Dr. A fits.",
    });
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "standard" });
    expect(r.state).toBe("PRESENT_OPTIONS");
    expect(r.matches.map((m) => m.therapistId)).toEqual(["t1"]);
    expect(r.done).toBe(true);
  });

  it("fit gate skipped with no fit → CLARIFY, no match", async () => {
    mGet.mockResolvedValue(at("fit_gate", { concern: "grief", language: "en" }));
    mPick.mockResolvedValue(null);
    const r = await runChipTurn({ locale: "en", sessionId: "s1", choice: "skip" });
    expect(r.state).toBe("CLARIFY");
    expect(r.matches).toEqual([]);
  });
});
