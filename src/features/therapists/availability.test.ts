import { describe, it, expect } from "vitest";
import { hhmmToMinutes, minutesToHhmm } from "./availability";

describe("hhmmToMinutes", () => {
  it("converts HH:MM to minutes from midnight", () => {
    expect(hhmmToMinutes("00:00")).toBe(0);
    expect(hhmmToMinutes("09:30")).toBe(570);
    expect(hhmmToMinutes("23:45")).toBe(1425);
  });
});

describe("minutesToHhmm", () => {
  it("converts minutes from midnight to zero-padded HH:MM", () => {
    expect(minutesToHhmm(0)).toBe("00:00");
    expect(minutesToHhmm(570)).toBe("09:30");
    expect(minutesToHhmm(1410)).toBe("23:30");
  });
});

describe("round-trip", () => {
  it("is stable across HH:MM → minutes → HH:MM", () => {
    for (const t of ["08:00", "12:15", "23:45"]) {
      expect(minutesToHhmm(hhmmToMinutes(t))).toBe(t);
    }
  });
});
