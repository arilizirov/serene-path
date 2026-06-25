import { describe, it, expect } from "vitest";
import { parseSelectedIds, MAX_SELECTED_IDS } from "./select-ids";

describe("parseSelectedIds", () => {
  it("splits a comma-separated list into trimmed ids", () => {
    const r = parseSelectedIds("a, b ,c");
    expect(r).toEqual({ ok: true, ids: ["a", "b", "c"] });
  });

  it("drops empty segments and dedupes, preserving first-seen order", () => {
    const r = parseSelectedIds("a,,b,a, ,c,b");
    expect(r).toEqual({ ok: true, ids: ["a", "b", "c"] });
  });

  it("rejects an empty / whitespace-only / absent selection", () => {
    for (const raw of ["", "   ", ",, ,", null, undefined]) {
      const r = parseSelectedIds(raw);
      expect(r.ok).toBe(false);
    }
  });

  it("accepts a selection exactly at the cap", () => {
    const ids = Array.from({ length: MAX_SELECTED_IDS }, (_, i) => `id${i}`);
    const r = parseSelectedIds(ids.join(","));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ids).toHaveLength(MAX_SELECTED_IDS);
  });

  it("rejects a selection over the cap (no unbounded query)", () => {
    const ids = Array.from({ length: MAX_SELECTED_IDS + 1 }, (_, i) => `id${i}`);
    const r = parseSelectedIds(ids.join(","));
    expect(r.ok).toBe(false);
  });
});
