import bcrypt from "bcryptjs";

// bcrypt work factor. 12 is a reasonable 2026 default for interactive logins.
const ROUNDS = 12;

// NOTE: bcrypt truncates input at 72 BYTES (multi-byte UTF-8 counts per byte —
// relevant for he/fr users). The registration/login slice must cap password
// length (zod max) so two long passwords can't collide on a 72-byte prefix.

/** Hash a plaintext password with bcrypt (a fresh random salt per call). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

/**
 * Verify a plaintext password against a stored bcrypt hash. Fail-closed: a
 * malformed/garbage hash returns false rather than throwing — an auth check
 * should deny on bad stored data, not crash with a 500.
 */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
