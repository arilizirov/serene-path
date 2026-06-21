import { describe, it, expect } from "vitest";
import { intakeRequestSchema, modelOutputSchema } from "./schema";

describe("intakeRequestSchema", () => {
  it("accepts a valid request and an optional sessionId", () => {
    expect(intakeRequestSchema.safeParse({ message: "hi", locale: "he" }).success).toBe(true);
    expect(
      intakeRequestSchema.safeParse({ sessionId: "s1", message: "hi", locale: "fr" }).success,
    ).toBe(true);
  });

  it("rejects an empty message, a bad locale, and an oversized message", () => {
    expect(intakeRequestSchema.safeParse({ message: "", locale: "he" }).success).toBe(false);
    expect(intakeRequestSchema.safeParse({ message: "hi", locale: "de" }).success).toBe(false);
    expect(
      intakeRequestSchema.safeParse({ message: "x".repeat(4001), locale: "en" }).success,
    ).toBe(false);
  });
});

describe("modelOutputSchema (untrusted model output)", () => {
  it("validates the §5 shape and defaults missing matches to []", () => {
    const parsed = modelOutputSchema.parse({ state: "MIRROR", reply: "ok" });
    expect(parsed.matches).toEqual([]);
  });

  it("accepts matches with therapist_id + rationale", () => {
    const r = modelOutputSchema.safeParse({
      state: "MATCH",
      reply: "here",
      matches: [{ therapist_id: "t1", rationale: "fits" }],
    });
    expect(r.success).toBe(true);
  });

  it("rejects an unknown state, an empty reply, and malformed matches", () => {
    expect(modelOutputSchema.safeParse({ state: "WAT", reply: "x" }).success).toBe(false);
    expect(modelOutputSchema.safeParse({ state: "MIRROR", reply: "" }).success).toBe(false);
    expect(
      modelOutputSchema.safeParse({
        state: "MATCH",
        reply: "x",
        matches: [{ therapist_id: "t1" }],
      }).success,
    ).toBe(false);
  });
});
