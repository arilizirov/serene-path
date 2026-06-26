import { describe, it, expect } from "vitest";
import { intakeRequestSchema, chipIntakeRequestSchema, modelOutputSchema } from "./schema";

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

describe("chipIntakeRequestSchema (accepts both flow shapes)", () => {
  it("accepts the chip shape (text / choice / action) with an optional provider", () => {
    expect(chipIntakeRequestSchema.safeParse({ locale: "en" }).success).toBe(true);
    expect(chipIntakeRequestSchema.safeParse({ locale: "en", choice: "anxiety" }).success).toBe(true);
    expect(
      chipIntakeRequestSchema.safeParse({ locale: "he", text: "hi", provider: "chip" }).success,
    ).toBe(true);
  });

  it("accepts the AI conversational shape (message / engine) under provider 'api'", () => {
    expect(
      chipIntakeRequestSchema.safeParse({
        locale: "en",
        message: "I feel low",
        provider: "api",
        engine: "ai",
      }).success,
    ).toBe(true);
  });

  it("rejects a bad locale, a bad provider, and an oversized message", () => {
    expect(chipIntakeRequestSchema.safeParse({ locale: "de" }).success).toBe(false);
    expect(chipIntakeRequestSchema.safeParse({ locale: "en", provider: "nope" }).success).toBe(false);
    expect(
      chipIntakeRequestSchema.safeParse({ locale: "en", message: "x".repeat(4001) }).success,
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
