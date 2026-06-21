import { redirect } from "next/navigation";
import { getSession, startSession, endSession } from "@/server/auth";
import { findUserByEmail } from "./repository";
import { verifyPassword } from "./password";

// Keep in sync with the Role enum in prisma/schema.prisma (CLIENT/THERAPIST/
// ADMIN). Re-declared rather than imported from the generated client to keep
// the feature decoupled from the ORM, matching the convention used elsewhere.
export type Role = "CLIENT" | "THERAPIST" | "ADMIN";

/** The principal returned on a successful credential check. */
export type AuthedUser = { id: string; role: Role };

// A valid cost-12 bcrypt hash compared against on the failure path, so a missing
// user / unset password takes the same time as a real check — this closes the
// user-enumeration timing side-channel. The value is irrelevant (the result is
// discarded); it only has to be well-formed so compare does the full work.
const DUMMY_HASH =
  "$2b$12$hPXIxkX7DjuLS62Qgt79d.iQt0NWNYbVun7Wk11GxSEVlppCtRxG6";

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
  const user = await findUserByEmail(email);
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

/** Verify credentials and, on success, start a session. Returns whether it worked. */
export async function login(email: string, password: string): Promise<boolean> {
  const principal = await verifyCredentials(email, password);
  if (!principal) return false;
  await startSession({ id: principal.id, role: principal.role });
  return true;
}

/** End the current session (sign out). */
export async function logout(): Promise<void> {
  await endSession();
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
