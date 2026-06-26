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

// --- Admin: GDPR user erasure (Phase 5) --------------------------------------

/** A user's role + owned therapist-profile id (if any) — the shape deleteUser
 *  needs to decide which child rows to cascade. Null if the user doesn't exist. */
export function findUserForDeletion(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, therapist: { select: { id: true } } },
  });
}

/**
 * Hard-delete a user and every row that FKs to them, FK-safe and atomic.
 *
 * The schema has NO `onDelete: Cascade`, so the children must be removed
 * children-first inside one $transaction or the final User delete would hit a
 * foreign-key violation. References to a User / their TherapistProfile:
 *   - Appointment.clientId     → User.id            (the user's bookings as a client)
 *   - TherapistProfile.userId  → User.id            (1:1, only if they are a therapist)
 *   - Appointment.therapistId  → TherapistProfile.id
 *   - AvailabilityRule.therapistId / AvailabilityException.therapistId
 *       → TherapistProfile.id
 * IntakeSession.userId is a nullable String with NO FK relation, so it never
 * blocks the delete and is intentionally left untouched (today every session is
 * anonymous; see repository getSession). `profileId` is passed only when the user
 * owns a TherapistProfile.
 *
 * Order (children-first): client appointments → [therapist profile's appointments
 * → availability rules → availability exceptions → the profile] → the user.
 * No-op safety is the caller's job (it checks existence before calling); a
 * deleteMany-based cascade is itself idempotent on absent children.
 */
export async function deleteUserCascade(
  userId: string,
  profileId: string | null,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Appointments the user booked as a CLIENT.
    await tx.appointment.deleteMany({ where: { clientId: userId } });

    // 2. If the user owns a therapist profile, cascade that profile's children
    //    (mirrors therapists.deleteTherapist): appointments → rules → exceptions
    //    → the profile itself, before deleting the user it FKs to.
    if (profileId) {
      await tx.appointment.deleteMany({ where: { therapistId: profileId } });
      await tx.availabilityRule.deleteMany({ where: { therapistId: profileId } });
      await tx.availabilityException.deleteMany({
        where: { therapistId: profileId },
      });
      await tx.therapistProfile.delete({ where: { id: profileId } });
    }

    // 3. Finally the user (now free of every FK reference).
    await tx.user.delete({ where: { id: userId } });
  });
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

/** createdAt for every user created on/after `since`, oldest-first — the raw
 *  timestamps the service buckets into a per-day signups series. Selects ONLY
 *  createdAt (no identity/hash leak through this read). */
export function listUserSignupDates(since: Date): Promise<{ createdAt: Date }[]> {
  return prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}
