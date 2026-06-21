import { describe, it, expect } from "vitest";
import { isIsoDate, isoToUtcDate, utcDateToIso } from "./exceptions";

describe("isIsoDate", () => {
  it("accepts a real YYYY-MM-DD date", () => {
    expect(isIsoDate("2026-06-21")).toBe(true);
    expect(isIsoDate("2024-02-29")).toBe(true); // leap day
  });

  it("rejects malformed strings", () => {
    expect(isIsoDate("2026-6-1")).toBe(false); // not zero-padded
    expect(isIsoDate("21/06/2026")).toBe(false);
    expect(isIsoDate("")).toBe(false);
    expect(isIsoDate("2026-06-21T00:00")).toBe(false);
  });

  it("rejects an impossible calendar date", () => {
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2025-02-29")).toBe(false); // not a leap year
  });
});

describe("isoToUtcDate / utcDateToIso", () => {
  it("parses a YYYY-MM-DD to UTC midnight", () => {
    expect(isoToUtcDate("2026-06-21").toISOString()).toBe(
      "2026-06-21T00:00:00.000Z",
    );
  });

  it("round-trips a stored @db.Date back to YYYY-MM-DD", () => {
    const iso = "2026-12-31";
    expect(utcDateToIso(isoToUtcDate(iso))).toBe(iso);
  });
});
