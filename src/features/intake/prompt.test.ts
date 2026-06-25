import { describe, it, expect } from "vitest";
import { buildSystemPrompt, PROMPT_VERSION } from "./prompt";
import type { CatalogEntry } from "@/features/therapists";

const catalog: CatalogEntry[] = [
  { id: "t1", name: "Dr. A", title: "Psychologist", bio: "Works with anxiety.", skills: ["anxiety"], languages: ["he"] },
  { id: "t2", name: "B", title: "Counsellor", bio: "Couples therapy.", skills: ["couples"], languages: ["en"] },
];

describe("buildSystemPrompt", () => {
  it("injects the catalog (ids + bios the model may recommend)", () => {
    const p = buildSystemPrompt(catalog, "he");
    expect(p).toContain('"id":"t1"');
    expect(p).toContain('"id":"t2"');
    expect(p).toContain("Works with anxiety.");
  });

  it("pins the reply language to the locale", () => {
    expect(buildSystemPrompt(catalog, "he")).toContain("Reply only in he");
    expect(buildSystemPrompt(catalog, "fr")).toContain("Reply only in fr");
  });

  it("lays out the conversation framework (gather → mirror → confirm → match)", () => {
    const p = buildSystemPrompt(catalog, "en");
    for (const step of ["GATHER", "MIRROR", "CONFIRM", "MATCH"]) expect(p).toContain(step);
  });

  it("instructs JSON-only output and forbids inventing therapists/prices/times", () => {
    const p = buildSystemPrompt(catalog, "en");
    expect(p).toContain("ONLY this JSON");
    expect(p.toLowerCase()).toContain("never invent");
  });

  it("carries the safety rules (passive ideation check + bypass resistance)", () => {
    const p = buildSystemPrompt(catalog, "en").toLowerCase();
    expect(p).toContain("safety");
    expect(p).toContain("passive ideation");
    expect(p).toContain("self-harm");
    expect(p).toContain("bypass");
  });

  it("exposes a prompt version for traceability", () => {
    expect(PROMPT_VERSION).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
