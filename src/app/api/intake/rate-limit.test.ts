import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, clientIp, __resetRateLimit } from "./rate-limit";

beforeEach(() => __resetRateLimit());

describe("rateLimit", () => {
  it("allows up to the per-IP cap, then blocks with a retry-after", () => {
    const now = 1_000_000;
    for (let i = 0; i < 20; i++) expect(rateLimit("ip", now).ok).toBe(true);
    const blocked = rateLimit("ip", now);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("lets requests through again once the window slides past old hits", () => {
    const start = 5_000_000;
    for (let i = 0; i < 20; i++) rateLimit("ip", start);
    expect(rateLimit("ip", start).ok).toBe(false);
    // 10 minutes + 1s later, the original hits have aged out
    expect(rateLimit("ip", start + 10 * 60_000 + 1000).ok).toBe(true);
  });

  it("tracks IPs independently", () => {
    const now = 9_000_000;
    for (let i = 0; i < 20; i++) rateLimit("a", now);
    expect(rateLimit("a", now).ok).toBe(false);
    expect(rateLimit("b", now).ok).toBe(true); // b unaffected
  });

  it("enforces a global backstop across all IPs (wallet ceiling)", () => {
    const now = 2_000_000;
    let allowed = 0;
    // Each request from a fresh IP (well under the per-IP cap) — only the global cap bites.
    for (let i = 0; i < 210; i++) if (rateLimit(`ip${i}`, now).ok) allowed++;
    expect(allowed).toBe(200); // hard ceiling holds despite every IP being unique
    expect(rateLimit("brand-new-ip", now).ok).toBe(false); // a spoofed fresh IP is still blocked
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://x/api/intake", { headers });

  it("prefers x-real-ip (platform-set, not client-spoofable)", () => {
    expect(
      clientIp(req({ "x-real-ip": "198.51.100.2", "x-forwarded-for": "1.1.1.1" })),
    ).toBe("198.51.100.2");
  });

  it("uses the RIGHT-most x-forwarded-for hop, ignoring spoofed left entries", () => {
    // The client forged "9.9.9.9" on the left; the trusted proxy appended the real IP on the right.
    expect(clientIp(req({ "x-forwarded-for": "9.9.9.9, 203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("falls back to 'unknown' when no proxy headers are present", () => {
    expect(clientIp(req({}))).toBe("unknown");
  });
});
