import { describe, it, expect } from "vitest";
import { parseEnv } from "./index";

describe("parseEnv", () => {
  const valid = {
    DATABASE_URL: "postgresql://u@localhost:5544/db",
    AUTH_SECRET: "a-sufficiently-long-random-secret-0123456789",
  };

  it("accepts a valid environment and defaults NODE_ENV to development", () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toContain("postgresql://");
    expect(env.NODE_ENV).toBe("development");
  });

  it("throws, naming the offending variable, when DATABASE_URL is missing", () => {
    expect(() => parseEnv({ AUTH_SECRET: valid.AUTH_SECRET })).toThrow(
      /DATABASE_URL/,
    );
  });

  it("throws when AUTH_SECRET is missing or too short", () => {
    expect(() => parseEnv({ DATABASE_URL: valid.DATABASE_URL })).toThrow(
      /AUTH_SECRET/,
    );
    expect(() =>
      parseEnv({ DATABASE_URL: valid.DATABASE_URL, AUTH_SECRET: "short" }),
    ).toThrow(/AUTH_SECRET/);
  });
});
