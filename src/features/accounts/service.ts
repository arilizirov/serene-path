import { redirect } from "next/navigation";
import { getSession, startSession, endSession } from "@/server/auth";
import {
  findUserByEmail,
  createUser,
  findUserRole,
  findUserContactById,
  userCountsByRole,
  countUsersSince,
  listUsers,
  updateUserRole,
  updateUserPassword,
  countByRole,
} from "./repository";
import { verifyPassword, hashPassword } from "./password";
import type { RegisterInput, Role } from "./schema";

// Role lives in ./schema (the import-leaf) so repository.ts can use the type
// without a service↔repository cycle. Re-exported here so existing importers of
// `accounts.Role` (via the index barrel) keep working unchanged.
export type { Role };

/** The principal returned on a successful credential check. */
export type AuthedUser = { id: string; role: Role };

// A valid cost-12 bcrypt hash compared against on the failure path, so a missing
// user / unset password takes the same time as a real check — this closes the
// user-enumeration timing side-channel. The value is irrelevant (the result is
// discarded); it only has to be well-formed so compare does the full work.
const DUMMY_HASH =
  "$2b$12$hPXIxkX7DjuLS62Qgt79d.iQt0NWNYbVun7Wk11GxSEVlppCtRxG6";

/** Canonical email form for storage + lookup. Postgres `@unique` is case-
 *  SENSITIVE, so without this `Alex@B.com` and `alex@b.com` would be two
 *  accounts — and a user could lock themselves out by registering with one
 *  casing and logging in with another. Applied at every email entry point. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Verify an email/password pair. Returns the principal on success, or null on
 * ANY failure (unknown email, no password set, wrong password). Both the return
 * value AND the timing are uniform across failure modes, so a caller cannot tell
 * whether a given email exists.
 */
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<AuthedUser | null> {
  const user = await findUserByEmail(normalizeEmail(email));
  if (!user || !user.passwordHash) {
    await verifyPassword(password, DUMMY_HASH); // equalize timing; discard result
    return null;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  return ok ? { id: user.id, role: user.role } : null;
}

/** The current authenticated principal (from the session cookie), or null. */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const s = await getSession();
  return s ? { id: s.userId, role: s.role } : null;
}

export type UserContact = { email: string; name: string };

/** A user's contact details (email + display name) by id, or null if missing.
 *  For transactional mail (e.g. booking confirmations). */
export async function getUserContact(
  userId: string,
): Promise<UserContact | null> {
  const u = await findUserContactById(userId);
  return u ? { email: u.email, name: u.name ?? "" } : null;
}

/** Verify credentials and, on success, start a session. Returns the authenticated
 *  principal (so the caller can route by role), or null if the credentials fail. */
export async function login(
  email: string,
  password: string,
): Promise<AuthedUser | null> {
  const principal = await verifyCredentials(email, password);
  if (!principal) return null;
  await startSession({ id: principal.id, role: principal.role });
  return principal;
}

/** End the current session (sign out). */
export async function logout(): Promise<void> {
  await endSession();
}

/**
 * Start a session for an already-created user (e.g. immediately after signup).
 * The role is read from the STORED user, never taken from the caller — so this
 * public primitive can't be used to mint an escalated (e.g. ADMIN) session.
 */
export async function startSessionFor(userId: string): Promise<void> {
  const user = await findUserRole(userId);
  if (!user) throw new Error("cannot start a session for a missing user");
  await startSession({ id: userId, role: user.role });
}

export type RegisterResult = { ok: true } | { ok: false; error: string };

/** True for a Prisma unique-constraint violation (P2002). User has exactly one
 *  unique column (email), so any P2002 here is the email collision — revisit
 *  (narrow on e.meta.target) if another @unique is added to User. Duck-typed on
 *  e.code to keep the feature decoupled from the generated client. */
function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
}

/**
 * Register a CLIENT account and start a session. The User.email unique
 * constraint is the authoritative race-safe guard, so we create-then-catch
 * rather than check-then-create (which would have a TOCTOU window).
 *
 * Note: unlike login (which is enumeration-resistant), signup deliberately
 * reveals "already registered" — standard signup UX; don't "fix" to match login.
 */
export async function registerClient(
  input: RegisterInput,
): Promise<RegisterResult> {
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await createUser({
      email: normalizeEmail(input.email),
      name: input.name,
      passwordHash,
    });
    await startSession({ id: user.id, role: "CLIENT" });
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, error: "That email is already registered." };
    }
    throw e;
  }
}

/**
 * Server-side guard: require the current user to hold `role`, else redirect to
 * the localized login. Defense in depth ALONGSIDE the middleware gate — the
 * middleware matcher can drift, so each protected route re-checks here too.
 */
export async function requireRole(
  role: Role,
  locale: string,
): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== role) {
    redirect(`/${locale}/login`);
  }
  return user;
}

// --- Admin: signup statistics (Phase 2, DB-derived) --------------------------

/** Signup metrics for the admin stats page: user counts by role + recent signups.
 *  All derived from the DB via groupBy/count (no table load). */
export type SignupStats = {
  byRole: Record<string, number>;
  recent: number; // users created in the last `recentDays`
  recentDays: number;
};

/** Default lookback window for the "recent signups" metric. */
const RECENT_SIGNUP_DAYS = 30;

export async function getSignupStats(
  recentDays: number = RECENT_SIGNUP_DAYS,
): Promise<SignupStats> {
  const since = new Date(Date.now() - recentDays * 86_400_000);
  const [roleRows, recent] = await Promise.all([
    userCountsByRole(),
    countUsersSince(since),
  ]);
  return {
    byRole: Object.fromEntries(roleRows.map((r) => [r.role, r._count._all])),
    recent,
    recentDays,
  };
}

// --- Admin: user & role management (Phase 3) ---------------------------------
//
// These are the SERVICE-side primitives behind the admin users area. They carry
// the security-critical invariants (the last-admin lockout guard, the create-
// then-catch P2002 duplicate path, password-strength enforcement) so the rules
// hold no matter which caller invokes them. They do NOT perform authorization —
// that is the action boundary's job (requireRole("ADMIN") as the first statement
// of every admin action); these run only after that gate has passed.

/** A user row for the admin users table. Never includes passwordHash (the repo
 *  `listUsers` select omits it), so the hash cannot leak through this surface. */
export type AdminUser = {
  id: string;
  email: string;
  name: string | null; // User.name is nullable in the schema; the UI renders a dash
  role: Role;
  createdAt: Date;
};

/** Every user, newest-first, for the admin users table. */
export function listAllUsers(): Promise<AdminUser[]> {
  return listUsers();
}

/**
 * Create an ADMIN account. Mirrors registerClient's create-then-catch shape: the
 * User.email unique constraint is the authoritative race-safe guard, so we create
 * then catch P2002 rather than check-then-create (no TOCTOU window). Unlike
 * registerClient this does NOT start a session — an admin is provisioning ANOTHER
 * account, not signing themselves in. Password is hashed here; strength is
 * enforced at the action boundary via createAdminSchema.
 */
export async function createAdmin(input: {
  email: string;
  name: string;
  password: string;
}): Promise<RegisterResult> {
  const passwordHash = await hashPassword(input.password);
  try {
    await createUser({
      email: normalizeEmail(input.email),
      name: input.name,
      passwordHash,
      role: "ADMIN",
    });
    return { ok: true };
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, error: "That email is already registered." };
    }
    throw e;
  }
}

export type SetRoleResult = { ok: true } | { ok: false; error: string };

/**
 * Change a user's role, with the LAST-ADMIN LOCKOUT GUARD: if the target user is
 * currently an ADMIN, the new role is non-ADMIN, and they are the ONLY remaining
 * ADMIN, the change is refused — otherwise the platform could be left with zero
 * admins and no way back into this area. A no-op (newRole === current ADMIN) is
 * allowed. The guard reads the live admin count + the target's current role, so
 * it holds regardless of what the caller believes the state to be.
 */
export async function setUserRole(
  userId: string,
  newRole: Role,
): Promise<SetRoleResult> {
  if (newRole !== "ADMIN") {
    const current = await findUserRole(userId);
    if (!current) return { ok: false, error: "User not found." };
    if (current.role === "ADMIN") {
      const admins = await countByRole("ADMIN");
      if (admins <= 1) {
        return {
          ok: false,
          error: "Cannot remove the last remaining administrator.",
        };
      }
    }
  }
  await updateUserRole(userId, newRole);
  return { ok: true };
}

/**
 * Admin-initiated password reset: hash the new password and replace the stored
 * hash. The plaintext is never logged or returned. Strength is enforced at the
 * action boundary via passwordSchema (the same rule registration uses), so this
 * primitive trusts that its input already meets the byte-length cap.
 */
export async function resetUserPassword(
  userId: string,
  password: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);
  await updateUserPassword(userId, passwordHash);
}
