import { describe, it, expect } from "vitest";
import { detectConcerns, pickMatch } from "./concerns";
import type { CatalogEntry } from "@/features/therapists";

const cat: CatalogEntry[] = [
  { id: "t1", name: "Dr. A", title: "Anxiety specialist", bio: "I work with anxiety and panic. I use CBT.", skills: ["anxiety", "panic"], languages: ["en", "he"] },
  { id: "t2", name: "B", title: "Couples therapist", bio: "I help couples rebuild trust.", skills: ["couples", "relationship"], languages: ["en"] },
];

describe("detectConcerns", () => {
  it("tags concerns by keyword, in TAGS order", () => {
    expect(detectConcerns("I have panic attacks and can't sleep")).toEqual(["anxiety", "sleep"]);
    expect(detectConcerns("my marriage is falling apart")).toEqual(["relationships"]);
    expect(detectConcerns("just tired")).toEqual([]);
  });
});

describe("pickMatch", () => {
  it("returns the best-scoring therapist with a bio snippet for the concern", () => {
    const m = pickMatch(cat, ["anxiety"], "panic attacks every morning", "en");
    expect(m?.id).toBe("t1");
    expect(m?.concept).toBe("anxiety");
    expect(m?.snippet.toLowerCase()).toContain("anxiety");
  });

  it("returns null when nothing scores", () => {
    expect(pickMatch(cat, ["grief"], "i lost someone", "en")).toBeNull();
  });

  it("prefers therapists who speak the locale, else falls back", () => {
    // 'he' is only spoken by t1; a couples concern still resolves within the he pool.
    const he = pickMatch(cat, ["anxiety"], "anxious", "he");
    expect(he?.id).toBe("t1");
    // 'fr' spoken by none → falls back to the full pool rather than returning null.
    const fr = pickMatch(cat, ["anxiety"], "anxious panic", "fr");
    expect(fr?.id).toBe("t1");
  });

  it("does not match on a bio coincidence — requires a real specialty", () => {
    const child: CatalogEntry[] = [
      { id: "c1", name: "C", title: "Child & family therapist", bio: "Parents often arrive exhausted.", skills: ["play therapy", "children"], languages: ["en"] },
    ];
    // "exhausted" is a stress-burnout keyword, but only in the bio (not a specialty).
    expect(pickMatch(child, ["stress-burnout"], "burnt out from work", "en")).toBeNull();
  });

  it("ranks a real specialist above a bio mention", () => {
    const pool: CatalogEntry[] = [
      { id: "spec", name: "S", title: "Burnout & stress specialist", bio: "Workplace stress and burnout recovery.", skills: ["burnout", "stress"], languages: ["en"] },
      { id: "child", name: "C", title: "Child therapist", bio: "Parents arrive exhausted.", skills: ["children"], languages: ["en"] },
    ];
    expect(pickMatch(pool, ["stress-burnout"], "exhausted and overwhelmed", "en")?.id).toBe("spec");
  });
});
