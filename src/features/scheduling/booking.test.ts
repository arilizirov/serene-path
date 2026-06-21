import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSchedulingContext, getBlockedDates } from "@/features/therapists";
import { getBookedSlots, bookSlot } from "./repository";
import { createBooking, getBookableSlots } from "./service";

// Mock the cross-feature + DB deps so this is a pure unit test of the money
// path. getBookableSlots itself runs for real over the mocked inputs.
vi.mock("@/features/therapists", () => ({
  getSchedulingContext: vi.fn(),
  getBlockedDates: vi.fn(),
}));
vi.mock("./repository", () => ({ getBookedSlots: vi.fn(), bookSlot: vi.fn() }));

const mCtx = vi.mocked(getSchedulingContext);
const mBlocked = vi.mocked(getBlockedDates);
const mBooked = vi.mocked(getBookedSlots);
const mBook = vi.mocked(bookSlot);

const HORIZON = () => new Date(Date.now() + 60 * 86_400_000).toISOString();

async function aFutureSlot(): Promise<string> {
  // Rules every day 09:00–17:00 → many future slots; pick one comfortably ahead.
  const slots = await getBookableSlots("t1", new Date().toISOString(), HORIZON());
  return slots[5];
}

describe("createBooking", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mCtx.mockResolvedValue({
      timezone: "Asia/Jerusalem",
      rules: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        start: "09:00",
        end: "17:00",
      })),
    });
    mBlocked.mockResolvedValue([]);
    mBooked.mockResolvedValue([]);
    mBook.mockResolvedValue("booked");
  });

  it("books a currently-available slot", async () => {
    const slot = await aFutureSlot();
    expect(await createBooking("t1", "c1", slot)).toEqual({ ok: true });
    expect(mBook).toHaveBeenCalledOnce();
  });

  it("rejects a past / unavailable time WITHOUT booking", async () => {
    const r = await createBooking("t1", "c1", "2020-01-01T10:00:00.000Z");
    expect(r.ok).toBe(false);
    expect(mBook).not.toHaveBeenCalled();
  });

  it("returns a failure when the slot was grabbed concurrently (taken)", async () => {
    const slot = await aFutureSlot();
    mBook.mockResolvedValue("taken");
    expect((await createBooking("t1", "c1", slot)).ok).toBe(false);
  });

  it("rejects an unparseable time", async () => {
    const r = await createBooking("t1", "c1", "not-a-date");
    expect(r.ok).toBe(false);
    expect(mBook).not.toHaveBeenCalled();
  });
});
