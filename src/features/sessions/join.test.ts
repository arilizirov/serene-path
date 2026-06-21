import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAppointmentForParty } from "@/features/scheduling";
import { issueRoomCredentials } from "@/server/video";
import { joinSession } from "./service";

// Mock the cross-feature + adapter deps so this is a pure unit test of the two
// gates (ownership + time). "now" is real; appointment times are set relative to
// it so each branch is deterministic.
vi.mock("@/features/scheduling", () => ({ getAppointmentForParty: vi.fn() }));
vi.mock("@/server/video", () => ({ issueRoomCredentials: vi.fn() }));

const mAppt = vi.mocked(getAppointmentForParty);
const mIssue = vi.mocked(issueRoomCredentials);

const iso = (msFromNow: number) => new Date(Date.now() + msFromNow).toISOString();
const MIN = 60_000;

beforeEach(() => {
  vi.resetAllMocks();
  mIssue.mockResolvedValue({
    provider: "stub",
    roomName: "appt-a1",
    token: "stub-token.appt-a1.c1.CLIENT",
    identity: "c1",
    role: "CLIENT",
  });
});

describe("joinSession", () => {
  it("denies (not_found) when the appointment isn't the user's", async () => {
    mAppt.mockResolvedValue(null);
    expect(await joinSession("a1", "intruder")).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(mIssue).not.toHaveBeenCalled();
  });

  it("denies (too_early) well before the start", async () => {
    mAppt.mockResolvedValue({
      id: "a1",
      startIso: iso(60 * MIN), // starts in an hour
      endIso: iso(120 * MIN),
      party: "CLIENT",
    });
    expect((await joinSession("a1", "c1")).ok).toBe(false);
    expect(mIssue).not.toHaveBeenCalled();
  });

  it("denies (ended) after the end", async () => {
    mAppt.mockResolvedValue({
      id: "a1",
      startIso: iso(-120 * MIN),
      endIso: iso(-60 * MIN), // ended an hour ago
      party: "CLIENT",
    });
    expect(await joinSession("a1", "c1")).toEqual({
      ok: false,
      reason: "ended",
    });
    expect(mIssue).not.toHaveBeenCalled();
  });

  it("issues credentials inside the window, passing through the party", async () => {
    mAppt.mockResolvedValue({
      id: "a1",
      startIso: iso(-5 * MIN), // started 5 min ago
      endIso: iso(55 * MIN), // ends in 55 min
      party: "THERAPIST",
    });
    const r = await joinSession("a1", "t1");
    expect(r.ok).toBe(true);
    expect(mIssue).toHaveBeenCalledWith("a1", "t1", "THERAPIST");
  });

  it("allows joining within the early window (8 min before start)", async () => {
    mAppt.mockResolvedValue({
      id: "a1",
      startIso: iso(8 * MIN), // starts in 8 min (< 10 early)
      endIso: iso(68 * MIN),
      party: "CLIENT",
    });
    expect((await joinSession("a1", "c1")).ok).toBe(true);
  });
});
