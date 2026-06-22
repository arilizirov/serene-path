// In-memory rate limiter for the anonymous, paid /api/intake endpoint — guards the
// OpenAI key from being drained. Two gates: a per-client-IP limit (fairness) and a
// GLOBAL backstop — a hard ceiling on total paid calls per window that holds even
// if the client IP can't be fully trusted (see clientIp). In-memory => per-instance
// (fine for one Render web service; swap the store for Redis if it scales out).

const WINDOW_MS = 10 * 60_000; // 10-minute window
const MAX_PER_IP = 20; // per IP / window — generous for a real conversation
const MAX_GLOBAL = 200; // ALL clients / window — wallet backstop, IP-trust-independent
const MAX_KEYS = 10_000; // memory bound on the per-IP map

const hits = new Map<string, number[]>();
let globalHits: number[] = [];

export type RateResult = { ok: true } | { ok: false; retryAfterSec: number };

const retryAfter = (oldest: number, now: number) =>
  Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));

/** Record one request for `key` at `now` (ms); allow unless the per-IP OR the
 *  global window is full. A rejected request is NOT counted (no self-extending lockout). */
export function rateLimit(key: string, now: number): RateResult {
  const cutoff = now - WINDOW_MS;

  // Global backstop first: a hard cap on total paid calls, regardless of IP.
  globalHits = globalHits.filter((t) => t > cutoff);
  if (globalHits.length >= MAX_GLOBAL) {
    return { ok: false, retryAfterSec: retryAfter(globalHits[0]!, now) };
  }

  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= MAX_PER_IP) {
    hits.set(key, recent);
    return { ok: false, retryAfterSec: retryAfter(recent[0]!, now) };
  }

  recent.push(now);
  hits.set(key, recent);
  globalHits.push(now);

  // Opportunistic cleanup so the per-IP map can't grow unbounded.
  if (hits.size > MAX_KEYS) {
    for (const [k, v] of hits) {
      const fresh = v.filter((t) => t > cutoff);
      if (fresh.length === 0) hits.delete(k);
      else hits.set(k, fresh);
    }
  }
  return { ok: true };
}

/**
 * Best-effort client IP. Prefers `x-real-ip` (set by the platform proxy), then the
 * RIGHT-most `x-forwarded-for` hop — the entry the trusted proxy appended. The
 * LEFT-most XFF entries are client-supplied and spoofable, so taking `[0]` would
 * let an attacker rotate a fake IP per request and bypass the per-IP limit. Falls
 * back to "unknown" (the global backstop still bounds spend for that bucket).
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1]!;
  }
  return "unknown";
}

/** Test-only: clear all counters between cases. */
export function __resetRateLimit(): void {
  hits.clear();
  globalHits = [];
}
