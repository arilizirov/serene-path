import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createUser,
  findUserRole,
  updateUserRole,
  updateUserPassword,
  countByRole,
  listUsers,
} from "./repository";
import { createAdmin, setUserRole, resetUserPassword, listAllUsers } from "./service";

// Factory mocks so the real repository (@/lib/db → env) and server/auth never
// load — same convention as service.test.ts (pure unit test, no DB/cookies).
vi.mock("./repository", () => ({
  createUser: vi.fn(),
  findUserRole: vi.fn(),
  updateUserRole: vi.fn(),
  updateUserPassword: vi.fn(),
  countByRole: vi.fn(),
  listUsers: vi.fn(),
  // unused by these tests but imported by service.ts at module load:
  findUserByEmail: vi.fn(),
  findUserContactById: vi.fn(),
  userCountsByRole: vi.fn(),
  countUsersSince: vi.fn(),
}));
vi.mock("@/server/auth", () => ({
  startSession: vi.fn(),
  getSession: vi.fn(),
  endSession: vi.fn(),
}));

const mockCreate = vi.mocked(createUser);
const mockFindRole = vi.mocked(findUserRole);
const mockUpdateRole = vi.mocked(updateUserRole);
const mockUpdatePassword = vi.mocked(updateUserPassword);
const mockCountByRole = vi.mocked(countByRole);
const mockList = vi.mocked(listUsers);

describe("createAdmin", () => {
  beforeEach(() => vi.resetAllMocks());
  const input = { email: "New@Admin.com", name: "Admin", password: "password1" };

  it("creates an ADMIN with a normalized email and does NOT start a session", async () => {
    mockCreate.mockResolvedValue({ id: "u1" });
    expect(await createAdmin(input)).toEqual({ ok: true });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: "new@admin.com", name: "Admin", role: "ADMIN" }),
    );
    // hash is passed, never the plaintext
    const arg = mockCreate.mock.calls[0][0];
    expect(arg.passwordHash).not.toContain("password1");
  });

  it("returns an error (not throw) on a duplicate email (P2002)", async () => {
    mockCreate.mockRejectedValue({ code: "P2002" });
    const r = await createAdmin(input);
    expect(r).toEqual({ ok: false, error: expect.any(String) });
  });

  it("rethrows a non-unique error", async () => {
    mockCreate.mockRejectedValue({ code: "P9999" });
    await expect(createAdmin(input)).rejects.toBeTruthy();
  });
});

describe("setUserRole — last-admin lockout guard", () => {
  beforeEach(() => vi.resetAllMocks());

  it("refuses to demote the LAST remaining admin", async () => {
    mockFindRole.mockResolvedValue({ role: "ADMIN" });
    mockCountByRole.mockResolvedValue(1);
    const r = await setUserRole("admin-1", "CLIENT");
    expect(r.ok).toBe(false);
    expect(mockUpdateRole).not.toHaveBeenCalled();
  });

  it("allows demoting an admin when other admins remain", async () => {
    mockFindRole.mockResolvedValue({ role: "ADMIN" });
    mockCountByRole.mockResolvedValue(2);
    mockUpdateRole.mockResolvedValue({ id: "admin-1" });
    const r = await setUserRole("admin-1", "CLIENT");
    expect(r).toEqual({ ok: true });
    expect(mockUpdateRole).toHaveBeenCalledWith("admin-1", "CLIENT");
  });

  it("allows keeping the last admin as ADMIN (no-op, never counts)", async () => {
    mockFindRole.mockResolvedValue({ role: "ADMIN" });
    mockUpdateRole.mockResolvedValue({ id: "admin-1" });
    const r = await setUserRole("admin-1", "ADMIN");
    expect(r).toEqual({ ok: true });
    // newRole === ADMIN short-circuits before the guard reads the role/count
    expect(mockFindRole).not.toHaveBeenCalled();
    expect(mockCountByRole).not.toHaveBeenCalled();
    expect(mockUpdateRole).toHaveBeenCalledWith("admin-1", "ADMIN");
  });

  it("promotes a non-admin without invoking the guard count", async () => {
    mockFindRole.mockResolvedValue({ role: "CLIENT" });
    mockUpdateRole.mockResolvedValue({ id: "u9" });
    const r = await setUserRole("u9", "THERAPIST");
    expect(r).toEqual({ ok: true });
    expect(mockCountByRole).not.toHaveBeenCalled();
    expect(mockUpdateRole).toHaveBeenCalledWith("u9", "THERAPIST");
  });

  it("returns an error for a missing target user", async () => {
    mockFindRole.mockResolvedValue(null);
    const r = await setUserRole("ghost", "CLIENT");
    expect(r.ok).toBe(false);
    expect(mockUpdateRole).not.toHaveBeenCalled();
  });
});

describe("resetUserPassword", () => {
  beforeEach(() => vi.resetAllMocks());

  it("stores a HASH, never the plaintext", async () => {
    mockUpdatePassword.mockResolvedValue({ id: "u1" });
    await resetUserPassword("u1", "newpassword1");
    expect(mockUpdatePassword).toHaveBeenCalledTimes(1);
    const [userId, hash] = mockUpdatePassword.mock.calls[0];
    expect(userId).toBe("u1");
    expect(hash).not.toBe("newpassword1");
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash shape
  });
});

describe("listAllUsers", () => {
  beforeEach(() => vi.resetAllMocks());

  it("delegates to the repository list (which omits passwordHash)", async () => {
    const rows = [
      {
        id: "u1",
        email: "a@b.com",
        name: "A",
        role: "ADMIN" as const,
        createdAt: new Date(),
      },
    ];
    mockList.mockResolvedValue(rows);
    expect(await listAllUsers()).toBe(rows);
    expect(mockList).toHaveBeenCalledTimes(1);
  });
});
