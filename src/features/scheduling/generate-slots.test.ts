import { describe, it, expect } from "vitest";
import { generateSlots, type SlotRule } from "./generate-slots";

// Asia/Jerusalem is IDT (+3) in June 2026; 2026-06-22 is a Monday.
const TZ = "Asia/Jerusalem";
const WEEK_FROM = "2026-06-22T00:00:00Z";
const WEEK_TO = "2026-06-29T00:00:00Z";
const monRule: SlotRule = { weekday: 1, start: "09:00", end: "11:00" }; // 09:00,10:00 local = 06:00,07:00Z

describe("generateSlots", () => {
  it("expands a weekly rule into discrete UTC slots within the window", () => {
    const slots = generateSlots([monRule], [], [], TZ, WEEK_FROM, WEEK_TO, 60);
    expect(slots).toEqual([
      "2026-06-22T06:00:00.000Z",
      "2026-06-22T07:00:00.000Z",
    ]);
  });

  it("drops a blocked date entirely", () => {
    const slots = generateSlots(
      [monRule],
      ["2026-06-22"],
      [],
      TZ,
      WEEK_FROM,
      WEEK_TO,
      60,
    );
    expect(slots).toEqual([]);
  });

  it("removes a slot that is already booked", () => {
    const slots = generateSlots(
      [monRule],
      [],
      ["2026-06-22T06:00:00.000Z"],
      TZ,
      WEEK_FROM,
      WEEK_TO,
      60,
    );
    expect(slots).toEqual(["2026-06-22T07:00:00.000Z"]);
  });

  it("de-duplicates overlapping rules", () => {
    const slots = generateSlots(
      [monRule, { weekday: 1, start: "10:00", end: "12:00" }],
      [],
      [],
      TZ,
      WEEK_FROM,
      WEEK_TO,
      60,
    );
    expect(slots).toEqual([
      "2026-06-22T06:00:00.000Z", // 09:00 local
      "2026-06-22T07:00:00.000Z", // 10:00 local (once, not duplicated)
      "2026-06-22T08:00:00.000Z", // 11:00 local
    ]);
  });

  it("handles the spring-forward DST transition (Israel 2026-03-27)", () => {
    // 02:00→03:00 local is skipped. A Fri 01:00–05:00 rule, 60-min: the
    // non-existent 02:00 is dropped; 03:00/04:00 local (now +3) map to the
    // correct UTC instants 00:00Z/01:00Z (01:00 local is +2 = 23:00Z prev day,
    // before `from`, so excluded). Pins that the post-transition offset applies.
    const slots = generateSlots(
      [{ weekday: 5, start: "01:00", end: "05:00" }],
      [],
      [],
      TZ,
      "2026-03-27T00:00:00Z",
      "2026-03-28T00:00:00Z",
      60,
    );
    expect(slots).toEqual([
      "2026-03-27T00:00:00.000Z",
      "2026-03-27T01:00:00.000Z",
    ]);
  });

  it("excludes slots before `from` (past slots)", () => {
    const slots = generateSlots(
      [monRule],
      [],
      [],
      TZ,
      "2026-06-22T06:30:00Z", // after the 06:00 slot
      WEEK_TO,
      60,
    );
    expect(slots).toEqual(["2026-06-22T07:00:00.000Z"]);
  });
});
