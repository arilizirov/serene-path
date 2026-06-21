import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";
import { signSession, verifySession } from "./session-token";

const SECRET = "test-secret-at-least-32-bytes-long-aaaaaa";

describe("session token", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession({ sub: "u1", role: "ADMIN" }, SECRET);
    expect(await verifySession(token, SECRET)).toEqual({ sub: "u1", role: "ADMIN" });
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSession({ sub: "u1", role: "ADMIN" }, SECRET);
    expect(
      await verifySession(token, "another-secret-also-32-bytes-bbbbbbbbb"),
    ).toBeNull();
  });

  it("rejects a tampered token", async () => {
    const token = await signSession({ sub: "u1", role: "CLIENT" }, SECRET);
    expect(await verifySession(token.slice(0, -3) + "AAA", SECRET)).toBeNull();
  });

  it("rejects garbage and empty input", async () => {
    expect(await verifySession("not.a.jwt", SECRET)).toBeNull();
    expect(await verifySession("", SECRET)).toBeNull();
  });

  it("rejects an unknown role claim", async () => {
    // A token whose role isn't one of the known roles must not verify.
    const token = await signSession(
      { sub: "u1", role: "SUPERUSER" as never },
      SECRET,
    );
    expect(await verifySession(token, SECRET)).toBeNull();
  });

  it("rejects an alg:none / unsigned token (closes alg-confusion)", async () => {
    const enc = (o: object) =>
      Buffer.from(JSON.stringify(o)).toString("base64url");
    const forged = `${enc({ alg: "none", typ: "JWT" })}.${enc({ sub: "u1", role: "ADMIN" })}.`;
    expect(await verifySession(forged, SECRET)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const expired = await new SignJWT({ role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySession(expired, SECRET)).toBeNull();
  });
});
