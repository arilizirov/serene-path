import { describe, it, expect, vi, beforeEach } from "vitest";

// Unit-test the FK-safe CASCADE ORDERING of deleteUserCascade against a mocked
// prisma transaction client. The schema has no onDelete: Cascade, so the order
// (children-first) is the load-bearing correctness — a wrong order would throw a
// foreign-key violation in real Postgres. We record the order of tx calls and
// assert the contract: client appointments → [profile appts → rules → exceptions
// → profile] → user, all inside ONE $transaction.

const calls: string[] = [];

function makeTx() {
  const rec = (name: string) =>
    vi.fn(async () => {
      calls.push(name);
      return { count: 1 };
    });
  return {
    appointment: { deleteMany: vi.fn() }, // replaced per-test (two distinct wheres)
    availabilityRule: { deleteMany: rec("rules") },
    availabilityException: { deleteMany: rec("exceptions") },
    therapistProfile: { delete: rec("profile") },
    user: { delete: rec("user") },
  };
}

let tx: ReturnType<typeof makeTx>;

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: vi.fn(async (fn: (t: unknown) => Promise<unknown>) => fn(tx)),
  },
}));

// Import AFTER the mock is registered.
import { deleteUserCascade } from "./repository";

beforeEach(() => {
  calls.length = 0;
  tx = makeTx();
  // appointment.deleteMany is called twice (clientId, then therapistId); tag each
  // by inspecting the where so we can assert both ran in the right place.
  tx.appointment.deleteMany = vi.fn(async (arg: { where: Record<string, unknown> }) => {
    calls.push("clientId" in arg.where ? "client-appts" : "therapist-appts");
    return { count: 1 };
  });
});

describe("deleteUserCascade — FK-safe ordering", () => {
  it("non-therapist user: deletes client appointments, then the user (no profile cascade)", async () => {
    await deleteUserCascade("u1", null);
    expect(calls).toEqual(["client-appts", "user"]);
  });

  it("therapist user: full children-first cascade before the user", async () => {
    await deleteUserCascade("u2", "profile-1");
    expect(calls).toEqual([
      "client-appts",
      "therapist-appts",
      "rules",
      "exceptions",
      "profile",
      "user",
    ]);
  });

  it("deletes the user LAST in every case (it is FK-referenced by the children)", async () => {
    await deleteUserCascade("u3", "profile-2");
    expect(calls[calls.length - 1]).toBe("user");
  });

  it("scopes the profile delete to the passed profile id", async () => {
    await deleteUserCascade("u4", "profile-7");
    expect(tx.therapistProfile.delete).toHaveBeenCalledWith({
      where: { id: "profile-7" },
    });
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: "u4" } });
  });
});
