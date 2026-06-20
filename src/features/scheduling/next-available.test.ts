import { describe, it, expect } from "vitest";
import { computeNextAvailable } from "./next-available";

// June 2026, Asia/Jerusalem is on IDT (UTC+3). 2026-06-22 is a Monday.
const TZ = "Asia/Jerusalem";
// 2026-06-22T05:00:00Z === Monday 08:00 local.
const MON_0800_LOCAL = "2026-06-22T05:00:00Z";

describe("computeNextAvailable", () => {
  it("returns null when there are no rules", () => {
    expect(computeNextAvailable([], TZ, MON_0800_LOCAL)).toBeNull();
  });

  it("finds a slot later the same day and returns it in UTC", () => {
    // Monday 09:00 local = 06:00 UTC, same day.
    const next = computeNextAvailable(
      [{ weekday: 1, start: "09:00", end: "10:00" }],
      TZ,
      MON_0800_LOCAL,
    );
    expect(next).toBe("2026-06-22T06:00:00.000Z");
  });

  it("rolls a same-weekday slot whose time already passed to next week", () => {
    // Monday 07:00 local is before 08:00 now → next Monday 07:00 local = 04:00 UTC.
    const next = computeNextAvailable(
      [{ weekday: 1, start: "07:00", end: "08:00" }],
      TZ,
      MON_0800_LOCAL,
    );
    expect(next).toBe("2026-06-29T04:00:00.000Z");
  });

  it("maps weekday 0 to Sunday", () => {
    // Next Sunday after Mon 2026-06-22 is 2026-06-28; 10:00 local = 07:00 UTC.
    const next = computeNextAvailable(
      [{ weekday: 0, start: "10:00", end: "11:00" }],
      TZ,
      MON_0800_LOCAL,
    );
    expect(next).toBe("2026-06-28T07:00:00.000Z");
  });

  it("returns the earliest slot across multiple rules", () => {
    const next = computeNextAvailable(
      [
        { weekday: 0, start: "14:00", end: "15:00" }, // next Sunday
        { weekday: 1, start: "09:00", end: "10:00" }, // today, sooner
      ],
      TZ,
      MON_0800_LOCAL,
    );
    expect(next).toBe("2026-06-22T06:00:00.000Z");
  });

  it("returns null for an unparseable start time", () => {
    expect(
      computeNextAvailable(
        [{ weekday: 1, start: "nonsense", end: "10:00" }],
        TZ,
        MON_0800_LOCAL,
      ),
    ).toBeNull();
  });
});
