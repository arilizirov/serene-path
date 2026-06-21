import { describe, it, expect } from "vitest";
import { buildSystemPrompt, PROMPT_VERSION } from "./prompt";
import type { CatalogEntry } from "@/features/therapists";

const catalog: CatalogEntry[] = [
  { id: "t1", title: "Psychologist", bio: "Works with anxiety.", skills: ["anxiety"], languages: ["he"] },
  { id: "t2", title: "Counsellor", bio: "Couples therapy.", skills: ["couples"], languages: ["en"] },
];

describe("buildSystemPrompt", () => {
  it("injects the catalog (ids the model may recommend)", () => {
    const p = buildSystemPrompt(catalog, "he");
    expect(p).toContain('"id":"t1"');
    expect(p).toContain('"id":"t2"');
    expect(p).toContain("Works with anxiety.");
  });

  it("pins the reply language to the locale", () => {
    expect(buildSystemPrompt(catalog, "he")).toContain("Hebrew");
    expect(buildSystemPrompt(catalog, "fr")).toContain("French");
    // unknown locale falls back to English, never throws
    expect(buildSystemPrompt(catalog, "xx")).toContain("English");
  });

  it("instructs JSON-only output and forbids inventing ids/prices/times", () => {
    const p = buildSystemPrompt(catalog, "en");
    expect(p).toContain("ONLY a single JSON object");
    expect(p.toLowerCase()).toContain("never invent");
  });

  it("exposes a prompt version for traceability", () => {
    expect(PROMPT_VERSION).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
