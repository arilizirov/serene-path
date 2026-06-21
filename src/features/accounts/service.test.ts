import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword } from "./password";
import { findUserByEmail, createUser } from "./repository";
import { startSession } from "@/server/auth";
import { verifyCredentials, registerClient } from "./service";

// Factory mocks so the real repository (@/lib/db → env) and server/auth never
// load — keeps this a pure unit test with no DATABASE_URL/cookie dependency.
vi.mock("./repository", () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
}));
vi.mock("@/server/auth", () => ({
  startSession: vi.fn(),
  getSession: vi.fn(),
  endSession: vi.fn(),
}));

const mockFind = vi.mocked(findUserByEmail);
const mockCreate = vi.mocked(createUser);
const mockStart = vi.mocked(startSession);

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

  it("normalizes the email before lookup", async () => {
    mockFind.mockResolvedValue(null);
    await verifyCredentials("  Alex@B.com ", "x");
    expect(mockFind).toHaveBeenCalledWith("alex@b.com");
  });
});

describe("registerClient", () => {
  beforeEach(() => vi.resetAllMocks());
  const input = { email: "New@B.com", name: "New", password: "password1" };

  it("creates a CLIENT with a normalized email and starts a session", async () => {
    mockCreate.mockResolvedValue({ id: "u1" });
    expect(await registerClient(input)).toEqual({ ok: true });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: "new@b.com", name: "New" }),
    );
    expect(mockStart).toHaveBeenCalledWith({ id: "u1", role: "CLIENT" });
  });

  it("returns an error (not throw) on a duplicate email (P2002)", async () => {
    mockCreate.mockRejectedValue({ code: "P2002" });
    const r = await registerClient(input);
    expect(r.ok).toBe(false);
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("rethrows a non-unique error", async () => {
    mockCreate.mockRejectedValue({ code: "P9999" });
    await expect(registerClient(input)).rejects.toBeTruthy();
  });
});
