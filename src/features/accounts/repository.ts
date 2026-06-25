import { prisma } from "@/lib/db";
import type { Role } from "./schema";

/** A user's auth fields by email, for credential sign-in. */
export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, passwordHash: true },
  });
}

/** A user's role by id — used to mint a session whose role always matches the
 *  stored user (never a caller-supplied role). */
export function findUserRole(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
}

/** A user's contact fields by id — for sending them transactional mail. */
export function findUserContactById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
}

/** Create a user with a password hash and a role (default CLIENT). The DB's email
 *  unique constraint is the authoritative guard against duplicates (the service
 *  catches P2002). The role is supplied by the service, never by untrusted input:
 *  registerClient leaves it CLIENT; createAdmin passes ADMIN — both after the
 *  caller has already established the right to set it. */
export function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  role?: Role;
}) {
  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
      role: input.role ?? "CLIENT",
    },
    select: { id: true },
  });
}

// --- Admin: user & role management (Phase 3) ---------------------------------

/** Every user for the admin users table. Selects identity + role + createdAt ONLY
 *  — passwordHash is NEVER selected, so the hash can't leak through this surface.
 *  Newest-first to match the other admin lists. */
export function listUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Set a user's role. The new role is a typed Role (constrained at the action
 *  boundary), never an arbitrary string written to the DB. */
export function updateUserRole(userId: string, role: Role) {
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true },
  });
}

/** Replace a user's password hash (admin-initiated reset). */
export function updateUserPassword(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: { id: true },
  });
}

/** Count of users holding `role` — used by the last-admin lockout guard. */
export function countByRole(role: Role): Promise<number> {
  return prisma.user.count({ where: { role } });
}

// --- Admin: signup statistics (Phase 2, DB-derived) --------------------------

/** User counts grouped by role — via groupBy, no table load. */
export function userCountsByRole() {
  return prisma.user.groupBy({ by: ["role"], _count: { _all: true } });
}

/** Count of users created on/after `since` — recent-signups metric. */
export function countUsersSince(since: Date): Promise<number> {
  return prisma.user.count({ where: { createdAt: { gte: since } } });
}
