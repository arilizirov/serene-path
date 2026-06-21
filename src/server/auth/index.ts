// AuthProvider adapter (APP_SPEC §10). The session mechanism — a signed JWT in
// an httpOnly cookie — lives ONLY here; features and routes go through this
// public surface, never the crypto directly. Swapping to Auth.js/Clerk later is
// a change confined to this folder.
import { signSession, verifySession, type SessionRole } from "./session-token";

/** Cookie name for the signed session JWT. */
export const SESSION_COOKIE = "sp_session";

export type Session = { userId: string; role: SessionRole };

const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Read AUTH_SECRET via a STATIC process.env reference so the Edge runtime
 * (middleware → readSessionToken) inlines it. getEnv() validates the whole
 * schema by passing all of process.env, which the edge can't statically
 * analyze and which would also couple this path to DATABASE_URL — so we
 * deliberately read the one var we need here. The strong floor is enforced
 * both here and in lib/env (the Node boot path).
 */
function authSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short (need >= 32 chars)");
  }
  return s;
}

/**
 * Verify a session from a raw cookie value — edge/middleware-safe (no
 * next/headers, no full-env validation). Returns the session or null.
 */
export async function readSessionToken(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) return null;
  const payload = await verifySession(token, authSecret());
  return payload ? { userId: payload.sub, role: payload.role } : null;
}

/** The current session from the server-component/action cookie store, or null. */
export async function getSession(): Promise<Session | null> {
  const { cookies } = await import("next/headers");
  return readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Issue a session cookie for a user (httpOnly, secure in prod, sameSite=lax). */
export async function startSession(user: {
  id: string;
  role: SessionRole;
}): Promise<void> {
  const token = await signSession({ sub: user.id, role: user.role }, authSecret());
  const { cookies } = await import("next/headers");
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Clear the session cookie (sign out). */
export async function endSession(): Promise<void> {
  const { cookies } = await import("next/headers");
  (await cookies()).delete(SESSION_COOKIE);
}
