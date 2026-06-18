import { describe, it, expect } from "vitest";
import { parseEnv } from "./index";

describe("parseEnv", () => {
  it("accepts a valid environment and defaults NODE_ENV to development", () => {
    const env = parseEnv({ DATABASE_URL: "postgresql://u@localhost:5544/db" });
    expect(env.DATABASE_URL).toContain("postgresql://");
    expect(env.NODE_ENV).toBe("development");
  });

  it("throws, naming the offending variable, when DATABASE_URL is missing", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });
});
