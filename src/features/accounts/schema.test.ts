import { describe, it, expect } from "vitest";
import { registerSchema } from "./schema";

describe("registerSchema", () => {
  const base = { email: "a@b.com", name: "Alex" };

  it("accepts a valid registration", () => {
    expect(
      registerSchema.safeParse({ ...base, password: "password1" }).success,
    ).toBe(true);
  });

  it("rejects a short password", () => {
    expect(registerSchema.safeParse({ ...base, password: "short" }).success).toBe(
      false,
    );
  });

  it("rejects a password longer than 72 bytes (bcrypt cap)", () => {
    expect(
      registerSchema.safeParse({ ...base, password: "a".repeat(73) }).success,
    ).toBe(false);
  });

  it("counts BYTES not chars — 40×'é' (2 bytes each = 80) is too long", () => {
    expect(
      registerSchema.safeParse({ ...base, password: "é".repeat(40) }).success,
    ).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(
      registerSchema.safeParse({ email: "nope", name: "A", password: "password1" })
        .success,
    ).toBe(false);
  });
});
