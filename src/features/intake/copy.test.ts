import { describe, it, expect } from "vitest";
import { copy, confirmOptions, isConfirmNo, mirrorMessage, buildRationale, matchMessage } from "./copy";
import type { Locale } from "./types";

const LOCALES: Locale[] = ["en", "he", "fr"];

describe("scripted copy", () => {
  it("has the full string set in every locale", () => {
    for (const l of LOCALES) {
      const c = copy(l);
      for (const k of ["probe1", "probe2", "confirmYes", "confirmNo", "notQuite", "noMatch", "support", "respect"] as const) {
        expect(c[k], `${l}.${k}`).toBeTruthy();
      }
      expect(Object.keys(c.concerns).length).toBeGreaterThanOrEqual(7);
      expect(confirmOptions(l)).toHaveLength(2);
    }
  });

  it("detects the 'not quite' answer via chip text or a typed negation", () => {
    expect(isConfirmNo("en", "Not quite")).toBe(true);
    expect(isConfirmNo("en", "no, it's more about work")).toBe(true);
    expect(isConfirmNo("he", "לא בדיוק")).toBe(true);
    expect(isConfirmNo("fr", "Pas tout à fait")).toBe(true);
    expect(isConfirmNo("en", "yes that's right")).toBe(false);
  });

  it("mirror weaves the localized concern labels in; fallback when none", () => {
    expect(mirrorMessage("en", ["stress-burnout", "sleep"])).toContain("stress and burnout");
    expect(mirrorMessage("en", [])).toContain("a great deal right now");
  });

  it("match message names the therapist and includes the rationale + opening", () => {
    const rationale = buildRationale("en", "anxiety", "I work with anxiety");
    const msg = matchMessage("en", "Dr. Maya", rationale, "2030-01-07T09:00:00.000Z");
    expect(msg).toContain("Dr. Maya");
    expect(msg).toContain("anxiety");
    expect(msg.toLowerCase()).toContain("opening");
  });
});
