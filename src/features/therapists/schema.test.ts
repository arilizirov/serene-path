import { describe, it, expect } from "vitest";
import { therapistInputSchema, therapistStatusSchema } from "./schema";

const valid = {
  email: "therapist@example.com",
  name: "Test Therapist",
  title: "Clinical Psychologist",
  bio: { en: "English bio.", he: "ביוגרפיה.", fr: "Bio française." },
  skills: ["anxiety"],
  modalities: ["individual"],
  languages: ["he", "en"],
  credentials: "Ph.D.",
  sessionPrice: 300,
};

describe("therapistInputSchema", () => {
  it("accepts a complete, valid therapist input", () => {
    expect(therapistInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a blank bio in any locale (all three are required)", () => {
    const r = therapistInputSchema.safeParse({ ...valid, bio: { en: "x", he: "", fr: "y" } });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(therapistInputSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an empty skills list", () => {
    expect(therapistInputSchema.safeParse({ ...valid, skills: [] }).success).toBe(false);
  });

  it("rejects a non-positive session price", () => {
    expect(therapistInputSchema.safeParse({ ...valid, sessionPrice: 0 }).success).toBe(false);
  });

  it("coerces a numeric-string price (form fields arrive as strings)", () => {
    const r = therapistInputSchema.safeParse({ ...valid, sessionPrice: "320" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.sessionPrice).toBe(320);
  });
});

describe("therapistStatusSchema", () => {
  it("accepts the four lifecycle statuses", () => {
    for (const s of ["DRAFT", "PENDING", "VERIFIED", "SUSPENDED"]) {
      expect(therapistStatusSchema.safeParse(s).success).toBe(true);
    }
  });

  it("rejects an unknown status", () => {
    expect(therapistStatusSchema.safeParse("ACTIVE").success).toBe(false);
  });
});
