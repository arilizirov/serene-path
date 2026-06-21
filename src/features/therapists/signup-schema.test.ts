import { describe, it, expect } from "vitest";
import { therapistSignupSchema } from "./schema";

describe("therapistSignupSchema", () => {
  const base = { email: "t@b.com", name: "Dr T", title: "Psychologist" };

  it("accepts a valid therapist signup", () => {
    expect(
      therapistSignupSchema.safeParse({ ...base, password: "password1" }).success,
    ).toBe(true);
  });

  it("rejects a short password", () => {
    expect(
      therapistSignupSchema.safeParse({ ...base, password: "short" }).success,
    ).toBe(false);
  });

  it("rejects a password over 72 bytes", () => {
    expect(
      therapistSignupSchema.safeParse({ ...base, password: "a".repeat(73) })
        .success,
    ).toBe(false);
  });

  it("requires a title", () => {
    expect(
      therapistSignupSchema.safeParse({
        ...base,
        title: "",
        password: "password1",
      }).success,
    ).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(
      therapistSignupSchema.safeParse({
        ...base,
        email: "nope",
        password: "password1",
      }).success,
    ).toBe(false);
  });
});
