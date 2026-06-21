import { SignJWT, jwtVerify } from "jose";

// No iss/aud claims by design: this is a single-issuer, single-audience app, so
// they'd be premature. Add them only if this secret is ever shared with another
// service.
export type SessionRole = "CLIENT" | "THERAPIST" | "ADMIN";
export type SessionPayload = { sub: string; role: SessionRole };

const ALG = "HS256";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const ROLES: readonly SessionRole[] = ["CLIENT", "THERAPIST", "ADMIN"];

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

/** Sign a session as an HS256 JWT (sub = user id, role claim), 7-day expiry. */
export async function signSession(
  payload: SessionPayload,
  secret: string,
): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + TTL_SECONDS)
    .sign(key(secret));
}

/**
 * Verify + decode a session token. Returns the payload, or null on ANY failure
 * (bad signature, wrong secret, tampered, expired, malformed, or an
 * unrecognized role claim). Edge-safe (Web Crypto via jose).
 */
export async function verifySession(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: [ALG],
    });
    const sub = payload.sub;
    const role = payload.role;
    if (
      typeof sub !== "string" ||
      typeof role !== "string" ||
      !ROLES.includes(role as SessionRole)
    ) {
      return null;
    }
    return { sub, role: role as SessionRole };
  } catch {
    return null;
  }
}
