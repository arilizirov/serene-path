import { describe, it, expect } from "vitest";
import { isLocale } from "./index";

describe("isLocale", () => {
  it("accepts the three supported locales", () => {
    expect(isLocale("he")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(true);
  });

  it("rejects unsupported values (case-sensitive, no empties)", () => {
    expect(isLocale("de")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale("EN")).toBe(false);
  });
});
