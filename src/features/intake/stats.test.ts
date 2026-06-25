import { describe, it, expect } from "vitest";
import { engineOf, tallyEngines, matchRate } from "./stats";

describe("engineOf", () => {
  it("reads an explicit engine", () => {
    expect(engineOf({ engine: "ai" })).toBe("ai");
    expect(engineOf({ engine: "scripted" })).toBe("scripted");
  });

  it("treats a flow blob as the scripted engine", () => {
    expect(engineOf({ flow: { phase: "GREETING" } })).toBe("scripted");
  });

  it("returns null when no engine was ever chosen", () => {
    expect(engineOf(null)).toBeNull();
    expect(engineOf({})).toBeNull();
    expect(engineOf(undefined)).toBeNull();
  });
});

describe("tallyEngines", () => {
  it("buckets each session and always sums to the total", () => {
    const rows = [
      { constraints: { engine: "ai" } },
      { constraints: { engine: "ai" } },
      { constraints: { flow: {} } },
      { constraints: { engine: "scripted" } },
      { constraints: null },
      { constraints: {} },
    ];
    const t = tallyEngines(rows);
    expect(t).toEqual({ ai: 2, scripted: 2, none: 2 });
    expect(t.ai + t.scripted + t.none).toBe(rows.length);
  });

  it("is zero across the board for no sessions", () => {
    expect(tallyEngines([])).toEqual({ ai: 0, scripted: 0, none: 0 });
  });
});

describe("matchRate", () => {
  it("computes matched / total", () => {
    expect(matchRate(3, 12)).toBe(0.25);
    expect(matchRate(1, 2)).toBe(0.5);
  });

  it("is 0 (never NaN) when there are no sessions", () => {
    expect(matchRate(0, 0)).toBe(0);
  });

  it("is 0 when nothing matched", () => {
    expect(matchRate(0, 5)).toBe(0);
  });
});
