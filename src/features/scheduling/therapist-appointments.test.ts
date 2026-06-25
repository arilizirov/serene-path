import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTherapistAppointmentsByUser } from "./repository";
import { getTherapistAppointments } from "./service";

// Pure unit test: mock the DB layer. The owner-scoping (the row's therapist
// profile must belong to this user) lives in the repository's nested WHERE; here
// we verify the service contract — the view mapping and that it queries for THIS
// session user only, mirroring getMyAppointments on the client side.
vi.mock("@/features/therapists", () => ({
  getSchedulingContext: vi.fn(),
  getBlockedDates: vi.fn(),
  getAvailabilityRules: vi.fn(),
  listTherapistsForAdmin: vi.fn(),
}));
vi.mock("./repository", () => ({
  getBookedSlots: vi.fn(),
  bookSlot: vi.fn(),
  getClientAppointments: vi.fn(),
  getTherapistAppointmentsByUser: vi.fn(),
  cancelOwnAppointment: vi.fn(),
  getAppointmentForParty: vi.fn(),
  listAllAppointments: vi.fn(),
  countAppointments: vi.fn(),
  appointmentCountsByStatus: vi.fn(),
  adminSetAppointmentStatus: vi.fn(),
}));

const mList = vi.mocked(getTherapistAppointmentsByUser);

beforeEach(() => vi.resetAllMocks());

describe("getTherapistAppointments", () => {
  it("maps rows to the cockpit view shape, soonest first", async () => {
    mList.mockResolvedValue([
      {
        id: "a1",
        startUtc: new Date("2030-01-02T09:00:00.000Z"),
        status: "CONFIRMED",
        client: { name: "Dana" },
      },
    ]);
    const out = await getTherapistAppointments("u1");
    expect(out).toEqual([
      {
        id: "a1",
        startIso: "2030-01-02T09:00:00.000Z",
        status: "CONFIRMED",
        clientName: "Dana",
      },
    ]);
    // Queried for THIS session user's (the therapist's) appointments only.
    expect(mList).toHaveBeenCalledWith("u1", expect.any(String));
  });

  it("tolerates a missing client name (renders empty, not null)", async () => {
    mList.mockResolvedValue([
      {
        id: "a2",
        startUtc: new Date("2030-02-02T10:00:00.000Z"),
        status: "PENDING",
        client: { name: null },
      },
    ]);
    const out = await getTherapistAppointments("u1");
    expect(out[0].clientName).toBe("");
  });

  it("honors an explicit fromIso override", async () => {
    mList.mockResolvedValue([]);
    await getTherapistAppointments("u1", { fromIso: "2031-01-01T00:00:00.000Z" });
    expect(mList).toHaveBeenCalledWith("u1", "2031-01-01T00:00:00.000Z");
  });
});
