# Hawk Log — independent-review findings

A running log of what the independent reviewer (the kit's `REVIEWER.md` persona,
run in an isolated context on each stage's diff) caught, and how it was resolved.
The `debt-hawk` subagent isn't dispatchable in the build runtime, so each entry
is a `general-purpose` agent instructed to adopt the `REVIEWER.md` persona,
read-only. Newest last.

Severity: **must-fix** (correctness/security boundary) · **should-fix** · **nit**.

---

## Stage 1.x — blocked-date editing (PR #15)
- **must-fix — IDOR on delete** (`therapists/repository.ts`): `removeAvailabilityException(id)` deleted by raw primary key; an admin could delete another therapist's row once auth lands. → **Fixed:** scoped to `deleteMany({ id, therapistId })`; DB-proven (wrong id = no-op, right id deletes).
- should-fix — dedupe had no DB unique constraint (race window). → Documented as a deliberate trade (a `@@unique` would clash with deferred partial-day blocks).
- nit — `isoToUtcDate` precondition implicit. → Documented in jsdoc.
- confirmed fine — silent-ignore on bad date (constrained by `<input type=date>`); `redirect` + `force-dynamic` refresh works.

## Stage 4.1 — credential core (PR #16)
- should-fix — **user-enumeration timing leak** (`accounts/service.ts`): unknown-email / no-password paths skipped bcrypt; only real users paid the ~250ms compare. → **Fixed:** dummy bcrypt compare on the failure path (constant-time); comment corrected (it had oversold the guarantee).
- should-fix — `verifyPassword` threw on a malformed stored hash (→ 500). → **Fixed:** try/catch → `false` (fail-closed).
- should-fix — bcrypt 72-byte truncation (multi-byte he/fr) uncapped. → Documented; length cap to be enforced in the login/validation slice.
- should-fix — `verifyCredentials` itself untested. → **Fixed:** +4 mocked unit tests (correct / wrong / unknown / no-password).
- design-flag — "who owns User": `therapists` creates it, `accounts` reads it. → To resolve when registration lands (likely `accounts` becomes owner).
- nit — `Role` union re-declared by hand (drift risk vs schema). → Kept (matches the decouple-from-ORM convention); "keep in sync" comment added.

## Stage 4.2a — session/AuthProvider core (signed-JWT cookie)
- should-fix — **edge-safety trap** (`server/auth/index.ts` → `lib/env`): `readSessionToken` (meant for edge middleware) called `getEnv()`, which validates the WHOLE schema by passing all of `process.env` — the Edge runtime can't statically inline that, so AUTH_SECRET could be `undefined` → 500 on every request once 4.2b wires middleware; also coupled the auth path to `DATABASE_URL`. → **Fixed:** narrow `authSecret()` reads `process.env.AUTH_SECRET` statically (edge-inlinable); dropped `getEnv()` from `server/auth`.
- should-fix — **weak secret floor**: `AUTH_SECRET` min was 16 (a weak HS256 key). → **Fixed:** raised to **32** in `lib/env` + the `authSecret()` guard; message says it must be random.
- should-fix — **regression gap**: token tests didn't pin the alg-confusion / expiry defenses (suite would pass even if `algorithms:["HS256"]` were dropped). → **Fixed:** added **alg:none/unsigned** and **expired-token** tests.
- note (for 4.2b) — **CSRF**: cookie session relies on `sameSite=lax`; Next server actions have built-in origin checks, but any custom POST route handler for a mutation needs explicit CSRF/origin validation. Keeping mutations on server actions. `lax` (not `strict`) is correct for the post-login return-to-page redirect.
- note (future) — stateless JWT: logout is cookie-delete only; a captured token stays valid until the 7-day expiry (no revocation/rotation). Acceptable now; a token-version claim or denylist is the home for "log out all devices" / admin-compromise later.
- nit — no `iss`/`aud` claims. → Correct to omit for a single-issuer app; documented so nobody "adds them for completeness."
- confirmed well — `algorithms:["HS256"]` closes alg-confusion, role claim whitelist-validated, fails-closed everywhere, dynamic `next/headers` import keeps the edge read path clean.

## Stage 4.2b — route protection + login UI (PR #18)
- **MUST-FIX — admin mutation Server Actions were NOT protected** (`therapists/actions.ts`: saveTherapistAction, saveAvailabilityAction, setStatusAction, addBlockedDateAction, removeBlockedDateAction). Next compiles `"use server"` actions to independent POST endpoints dispatched by action-ID *before/independent of* page+layout render — so the middleware (gates page paths) and the admin layout's `requireRole` (runs at render) do **not** gate them. Any authenticated non-admin (or anyone with the action ID) could invoke them directly to mutate therapist data / flip verification / block dates. → **Fixed:** `await requireRole("ADMIN", locale)` is now the first line of every mutating action (the action is the real trust boundary; layout/middleware are defense-in-depth). Required a sanctioned boundary edge `therapists → accounts` (ADR in boundaries.yaml). Live-smoke confirmed the admin page still renders through the new server→accounts-barrel import (no use-client error).
- **MUST-FIX — open-redirect via backslash** (`accounts/actions.ts` safeNext): `/^\/(?!\/)/` accepted `/\evil.com`, which browsers normalize to `//evil.com` → external redirect. → **Fixed:** `/^\/(?![/\\])/` rejects `/` and `\` as the second char.
- should-fix — middleware `ADMIN_PATH` hardcoded `(en|he|fr)` (drift vs `LOCALES` → a new locale silently un-gated at the edge). → **Fixed:** derived from `routing.locales`.
- should-fix — seed could create a known-credential admin in prod. → **Fixed:** throws if `NODE_ENV=production` and `SEED_ADMIN_PASSWORD` unset.
- confirmed fine — middleware regex is case-sensitive (`/en/Admin` 404s, no bypass), trailing slash handled, no path-traversal bypass; logout is a server-action POST (Next origin-checked) so no CSRF logout; `requireRole` fails closed.
- proven live — no-cookie→307 /login, CLIENT-token→307 /login, ADMIN-token→200.

## Stage 4.3 — client registration (PR #19)
- should-fix — **email never normalized** (`accounts/service.ts` / `repository.ts`): Postgres `@unique` is case-sensitive, so `Alex@B.com` vs `alex@b.com` would create duplicate accounts, and a user could lock themselves out (register one casing, login another — `findUserByEmail` is also case-sensitive). The P2002 duplicate-guard the whole story rests on wouldn't fire. → **Fixed:** `normalizeEmail` (trim + lowercase) applied in both `registerClient` (before create) and `verifyCredentials` (before lookup); +a normalization test.
- should-fix — **`registerClient` shipped untested** (the stage's headline behavior). → **Fixed:** +3 mocked tests (success→{ok:true}+session started+normalized email; P2002→{ok:false} no session; non-P2002→rethrows).
- nit — `isUniqueViolation` catches any P2002 (fine while User has one unique col). → Documented the single-unique-column assumption.
- nit — register leaks email existence ("already registered") vs login's enumeration-resistance. → Documented as a deliberate, standard signup tradeoff.
- confirmed well — **privilege airtight**: `createUser` hardcodes `role: CLIENT`, form sends only name/email/password, server re-validates — no mass-assignment to role. Create-then-catch closes the TOCTOU window. Byte-cap via TextEncoder exactly matches bcrypt's 72-byte truncation. Auto-login mints a fresh token (no fixation).
