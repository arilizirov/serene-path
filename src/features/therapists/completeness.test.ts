import { describe, it, expect } from "vitest";
import { profileCompleteness } from "./completeness";

const full = {
  title: "Psychologist",
  bio: { en: "a", he: "ב", fr: "c" },
  skills: ["anxiety"],
  modalities: ["individual"],
  languages: ["en"],
  sessionPrice: 300,
};

describe("profileCompleteness", () => {
  it("is 100% + complete for a full profile", () => {
    const c = profileCompleteness(full);
    expect(c.percent).toBe(100);
    expect(c.isComplete).toBe(true);
    expect(c.missing).toEqual([]);
  });

  it("is 0% + all-missing for an empty draft", () => {
    const c = profileCompleteness({
      title: "",
      bio: { en: "", he: "", fr: "" },
      skills: [],
      modalities: [],
      languages: [],
      sessionPrice: 0,
    });
    expect(c.percent).toBe(0);
    expect(c.isComplete).toBe(false);
    expect(c.missing).toHaveLength(6);
  });

  it("flags a bio missing one language (not complete)", () => {
    const c = profileCompleteness({ ...full, bio: { en: "a", he: "", fr: "c" } });
    expect(c.isComplete).toBe(false);
    expect(c.missing).toContain("bio");
  });

  it("flags price 0 and empty skills", () => {
    const c = profileCompleteness({ ...full, sessionPrice: 0, skills: [] });
    expect(c.missing).toEqual(expect.arrayContaining(["price", "skills"]));
    expect(c.percent).toBeLessThan(100);
  });
});
