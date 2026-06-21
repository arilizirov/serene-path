import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getClientAppointments,
  cancelOwnAppointment,
} from "./repository";
import { getMyAppointments, cancelAppointment } from "./service";

// Mock the DB layer so this is a pure unit test. The owner-scoping + future-only
// policy live in cancelOwnAppointment's scoped SQL (proven via a real-DB check);
// here we verify the service contract: count -> boolean, and the view mapping.
vi.mock("@/features/therapists", () => ({
  getSchedulingContext: vi.fn(),
  getBlockedDates: vi.fn(),
}));
vi.mock("./repository", () => ({
  getBookedSlots: vi.fn(),
  bookSlot: vi.fn(),
  getClientAppointments: vi.fn(),
  cancelOwnAppointment: vi.fn(),
}));

const mList = vi.mocked(getClientAppointments);
const mCancel = vi.mocked(cancelOwnAppointment);

beforeEach(() => vi.resetAllMocks());

describe("getMyAppointments", () => {
  it("maps rows to the page view shape", async () => {
    mList.mockResolvedValue([
      {
        id: "a1",
        startUtc: new Date("2030-01-02T09:00:00.000Z"),
        status: "PENDING",
        therapist: { title: "Psychologist", user: { name: "Dr. Cohen" } },
      },
    ]);
    const out = await getMyAppointments("c1");
    expect(out).toEqual([
      {
        id: "a1",
        startIso: "2030-01-02T09:00:00.000Z",
        status: "PENDING",
        therapistName: "Dr. Cohen",
        therapistTitle: "Psychologist",
      },
    ]);
    // Queried for THIS user's appointments only.
    expect(mList).toHaveBeenCalledWith("c1", expect.any(String));
  });
});

describe("cancelAppointment", () => {
  it("returns true when a row was cancelled", async () => {
    mCancel.mockResolvedValue(1);
    expect(await cancelAppointment("a1", "c1")).toBe(true);
    expect(mCancel).toHaveBeenCalledWith("a1", "c1", expect.any(String));
  });

  it("returns false when nothing was cancelled (not yours / past / gone)", async () => {
    mCancel.mockResolvedValue(0);
    expect(await cancelAppointment("a1", "intruder")).toBe(false);
  });
});
