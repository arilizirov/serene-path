import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("s3cret-pw");
    expect(await verifyPassword("s3cret-pw", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("s3cret-pw");
    expect(await verifyPassword("wrong-pw", hash)).toBe(false);
  });

  it("salts: same input yields different hashes, never the plaintext", async () => {
    const a = await hashPassword("same-input");
    const b = await hashPassword("same-input");
    expect(a).not.toBe(b);
    expect(a).not.toContain("same-input");
  });
});
