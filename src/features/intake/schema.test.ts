import { describe, it, expect } from "vitest";
import { intakeTurnRequestSchema, modelOutputSchema } from "./schema";

describe("intakeTurnRequestSchema (one turn of the live conversation flow)", () => {
  it("accepts a bare {locale} (starts the flow), text, choice, and action turns", () => {
    expect(intakeTurnRequestSchema.safeParse({ locale: "en" }).success).toBe(true);
    expect(intakeTurnRequestSchema.safeParse({ locale: "he", text: "I feel low" }).success).toBe(true);
    expect(intakeTurnRequestSchema.safeParse({ locale: "fr", choice: "yes" }).success).toBe(true);
    expect(
      intakeTurnRequestSchema.safeParse({ locale: "en", action: "get_help_now", sessionId: "s1" }).success,
    ).toBe(true);
  });

  it("rejects a bad locale, an unknown action, and an oversized text", () => {
    expect(intakeTurnRequestSchema.safeParse({ locale: "de" }).success).toBe(false);
    expect(intakeTurnRequestSchema.safeParse({ locale: "en", action: "nope" }).success).toBe(false);
    expect(
      intakeTurnRequestSchema.safeParse({ locale: "en", text: "x".repeat(4001) }).success,
    ).toBe(false);
  });
});

// modelOutputSchema validates the (retained) AI-engine's untrusted output (§5).
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
