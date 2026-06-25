import { describe, it, expect, vi, beforeEach } from "vitest";

// Unit-test the Phase 5 manual-deletion repository helpers against a mocked prisma
// client. IntakeSession has no child rows (userId is a nullable String, no FK), so
// a plain deleteMany is FK-safe — the correctness here is the PURGE CUTOFF math and
// that deleteSession uses deleteMany (so a missing id is a no-op, not a throw).

// vi.mock is hoisted above the file body, so the mock fn is created via vi.hoisted
// (which runs first) to avoid a temporal-dead-zone reference error.
const { deleteMany } = vi.hoisted(() => ({
  deleteMany: vi.fn(
    (_arg: { where: Record<string, unknown> }): Promise<{ count: number }> =>
      Promise.resolve({ count: 3 }),
  ),
}));

vi.mock("@/lib/db", () => ({
  prisma: { intakeSession: { deleteMany } },
}));

// Import AFTER the mock is registered.
import { deleteSession, purgeSessionsOlderThan } from "./repository";

beforeEach(() => {
  vi.clearAllMocks();
  deleteMany.mockResolvedValue({ count: 3 });
});

describe("deleteSession", () => {
  it("uses deleteMany scoped to the id (missing id → no-op, not a throw)", async () => {
    await deleteSession("sess-1");
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: "sess-1" } });
  });
});

describe("purgeSessionsOlderThan", () => {
  it("deletes sessions strictly older than the cutoff (now - days)", async () => {
    const now = new Date("2026-06-25T12:00:00.000Z");
    await purgeSessionsOlderThan(30, now);

    const arg = deleteMany.mock.calls[0][0] as {
      where: { updatedAt: { lt: Date } };
    };
    const cutoff = arg.where.updatedAt.lt;
    // 30 days before noon on 2026-06-25 → 2026-05-26T12:00:00Z.
    expect(cutoff.toISOString()).toBe("2026-05-26T12:00:00.000Z");
  });

  it("returns the number of rows deleted", async () => {
    deleteMany.mockResolvedValue({ count: 7 });
    const n = await purgeSessionsOlderThan(90, new Date());
    expect(n).toBe(7);
  });

  it("a larger window pushes the cutoff further back (deletes fewer/older rows)", async () => {
    const now = new Date("2026-06-25T00:00:00.000Z");
    await purgeSessionsOlderThan(1, now);
    await purgeSessionsOlderThan(365, now);

    const cutoff1 = (
      deleteMany.mock.calls[0][0] as { where: { updatedAt: { lt: Date } } }
    ).where.updatedAt.lt;
    const cutoff365 = (
      deleteMany.mock.calls[1][0] as { where: { updatedAt: { lt: Date } } }
    ).where.updatedAt.lt;
    expect(cutoff365.getTime()).toBeLessThan(cutoff1.getTime());
  });
});
