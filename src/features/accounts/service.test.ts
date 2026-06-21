import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword } from "./password";
import { findUserByEmail } from "./repository";
import { verifyCredentials } from "./service";

// Factory mock so the real repository (and its @/lib/db → env import) never
// loads — keeps this a pure unit test with no DATABASE_URL dependency.
vi.mock("./repository", () => ({ findUserByEmail: vi.fn() }));
const mockFind = vi.mocked(findUserByEmail);

describe("verifyCredentials", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns the principal for a correct password", async () => {
    const passwordHash = await hashPassword("right-pw");
    mockFind.mockResolvedValue({ id: "u1", role: "ADMIN", passwordHash });
    expect(await verifyCredentials("a@b.com", "right-pw")).toEqual({
      id: "u1",
      role: "ADMIN",
    });
  });

  it("returns null for a wrong password", async () => {
    const passwordHash = await hashPassword("right-pw");
    mockFind.mockResolvedValue({ id: "u1", role: "ADMIN", passwordHash });
    expect(await verifyCredentials("a@b.com", "wrong-pw")).toBeNull();
  });

  it("returns null for an unknown email", async () => {
    mockFind.mockResolvedValue(null);
    expect(await verifyCredentials("nobody@b.com", "x")).toBeNull();
  });

  it("returns null when the user has no password set (social-only)", async () => {
    mockFind.mockResolvedValue({ id: "u1", role: "CLIENT", passwordHash: null });
    expect(await verifyCredentials("a@b.com", "x")).toBeNull();
  });
});
