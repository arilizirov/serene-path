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

## Stage 5.1 — therapist self-onboarding / signup (PR #20)
- should-fix — **`startSessionFor(userId, role)` was a public session-minting footgun**: it minted a session with a CALLER-supplied role, so any future caller could `startSessionFor(x, "ADMIN")` (privilege escalation). → **Fixed:** dropped the role param — `startSessionFor(userId)` now reads the role from the STORED user (`findUserRole`), so the session role always matches the actual user and can't be escalated.
- nit — `/dashboard` is gated only at the page (requireRole THERAPIST), not the edge middleware (which covers /admin only). → Acceptable (requireRole fails closed); added a middleware comment that the matcher isn't exhaustive.
- nit — P2002 duck-type rationale lived in another file's comment. → Added a self-contained comment in `therapists/service`.
- confirmed well — **privilege/role airtight**: self-signup hardcodes `role: THERAPIST` + `status: DRAFT` (neither from form input); no self-verify path (status change is ADMIN-only). **No DRAFT leak**: all 3 public reads hard-filter `status: VERIFIED`; unfiltered reads are admin-only behind double gates; a DRAFT has no availability rules so no bookable slot. Atomic nested create (no orphaned user). Email normalized consistently. Boundary clean (app composes accounts+therapists; therapists/service stays accounts-free).

## Stage 5.2 — therapist dashboard / owner-scoped self-edit (PR #21)
- should-fix (UX) — **editable-but-ignored email field**: dashboard (and admin-edit) showed an editable email that `updateProfileByUserId` never writes — Save silently reloads the old value, and clearing it fails validation on an unchangeable field. → **Fixed:** email is `readOnly` in edit mode (still submitted so validation passes; editable only on admin-create where it's actually used).
- nit — `requestVerificationAction` is a silent no-op on incomplete/non-DRAFT (the SAFE outcome for a direct POST). → Left as-is (the gate is correct + unbypassable).
- **confirmed AIRTIGHT (the critical property) — owner-scoping**: the hawk traced every write path. `saveMyProfileAction`/`requestVerificationAction` resolve the target ONLY from `requireRole("THERAPIST").id` (session) — neither reads `formData.get("id")`, and `formDataToTherapistInput` excludes `id`, so the form's still-emitted hidden `id` is **inert**. Repo uses `where:{userId}` throughout. **No IDOR.** No status-escalation: `status` isn't in the schema/form/update; the only therapist transition is `updateMany where:{userId,status:DRAFT}→PENDING` (owner-scoped + state-guarded → no self-VERIFY, re-request is a no-op). Completeness gate server-enforced (not UI-only). Form refactor safe (admin call sites use the default action, still ADMIN-guarded). Proven live vs dev DB: A edited+verified, B untouched.

## Stage 5.3 — therapist own-availability editing (PR #22)
- **VERDICT: clean** (no must-fix). Owner-scoping confirmed: `saveMyAvailabilityAction` resolves the profile id from `requireRole("THERAPIST")`+`getMyProfileForEdit(session userId)`, never the editor's hidden `therapistId` (inert) → no IDOR. Admin flow unchanged (AvailabilityEditor defaults to the ADMIN-gated action). Validation/null-handling sound.
- nit (PRE-EXISTING, deferred to Stage 6) — `availabilityRulesSchema` doesn't reject **overlapping/duplicate weekly slots** (same gap in the admin action). Doesn't matter until booking expands rules into slots → **address in Stage 6** (de-dup/merge or reject overlaps before slot computation).

## Stage 6.1 — booking slot engine + Appointment model (PR #23)
- **must-fix (latent, manifests in 6.2)** — the `status != CANCELLED` read filter offers a cancelled slot as bookable, but `@@unique([therapistId,startUtc])` (no status component) still occupies the key → a plain insert in 6.2 would **P2002 on a slot the calendar showed as free**. → **Resolved by design + documented:** the Stage-6.2 booking path MUST upsert/revive the cancelled row at that key (update→PENDING+new client), not plain-insert. Documented in the schema model comment + `getBookedSlots` jsdoc; read side is correct under that design.
- should-fix — **zero DST-transition test coverage** on a DST-zone time engine (all tests were June IDT). → **Fixed:** added a spring-forward test (Israel 2026-03-27) pinning that post-transition slots get the correct +3 UTC offset and the non-existent 02:00 is dropped (no duplicate, no crash). Also **resolves the deferred overlapping-rules gap** — generateSlots de-dups via a Set.
- nit — `SESSION_MINUTES=60` hardcoded in service; 6.2 must derive `endUtc` from the SAME constant so slot length and stored duration can't drift. Noted for 6.2.
- confirmed CLEAN (the scary ones, all verified end-to-end) — **booked-slot format match** is exact (JS `toISOString()` vs luxon `toISO()` both `…000Z`, re-normalized) → no silent double-booking; **window off-by-one** correct (09:00–11:00/60 → 09:00,10:00 only); **blocked-date match** sound (local calendar date). Proven live: 27 slots → book → 26 → cancel → 27.

## Stage 6.2 — atomic booking (the money path) (PR #24)
- should-fix — **money path shipped untested** (`bookSlot`/`createBooking`/`bookSlotAction` had zero coverage; only the pure slot engine was tested). → **Fixed:** +4 mocked `createBooking` unit tests (available→book, past/unavailable→reject-without-booking, concurrent-taken→fail, invalid-date→reject). Atomicity itself proven live (needs a real DB).
- nit — booking allows any authenticated user (no `role==="CLIENT"` gate). Left open (a therapist may also book as a client); noted.
- nit — 14d calendar window vs 60d booking-validation horizon drift. → Added a comment tying them (60 ≥ 14 so every shown slot re-validates; harmless).
- **confirmed SAFE end-to-end (correctness + security critical), all traced by the hawk:** (1) **no double-booking** — status-scoped `updateMany`(CANCELLED) then `create`+catch-P2002; the `@@unique` serializes concurrent free-slot bookings (1 wins), revive races resolve to one winner, and an ACTIVE appointment is NEVER overwritten (UPDATE scoped to CANCELLED). No `$transaction` needed. (2) **no IDOR** — `clientId` from the SESSION (`getCurrentUser`), never the form. (3) **no re-validation bypass** — `createBooking` rejects any `startUtc` not in `getBookableSlots`; format round-trip is byte-exact so no good slot blocked / no bad value matches; the unique constraint closes the TOCTOU gap. (4) **no open-redirect** (`next` server-built + `safeNext`-guarded). (5) **no reflected XSS** (React-escaped, fixed strings). (6) `endUtc` derived from the same `SESSION_MINUTES` (no drift). Proven live: **2 concurrent bookings → exactly 1 wins, 1 row**; past-time rejected; cancel→rebook revives (no dup).

## Stage 6.3 — appointment lifecycle: owner-scoped cancel + "my appointments" (PR #25)
- nit — Cancel button renders on every listed row regardless of status; a future-but-COMPLETED row could show a button that no-ops into `?error=1`. Harmless (server re-checks atomically; the list only shows non-cancelled upcoming rows). Left as-is.
- nit — null therapist `name` rendered as an empty span. → **Fixed:** page falls back to the title (`therapistName || therapistTitle`).
- **VERDICT clean, no must-fix** — an authz-on-mutation change, scrutinized hard. Hawk traced + confirmed SAFE: (1) **no IDOR** — `cancelOwnAppointment` scopes the `updateMany` WHERE to `OR:[{clientId:userId},{therapist:{userId}}]` (verified `TherapistProfile.userId @unique`, so the relation filter resolves to exactly the therapist party); the actor `userId` ALWAYS comes from the SESSION (`getCurrentUser`→cookie), the form's `appointmentId` is the only client value and is itself scoped → a forged id matches 0 rows → `false` → a generic `?error=1` (no existence oracle). (2) **policy airtight, no TOCTOU** — `status notIn[CANCELLED,COMPLETED]` + `startUtc>now` are predicates in the SAME atomic `updateMany` (no read-then-write gap). (3) **auth-gating sound** — page + action both `redirect()` (typed `never`, throws) when `user` null, so the `user.id` deref is correctly narrowed non-null. (4) **no info leak** — `getClientAppointments` filters `clientId:userId`, excludes CANCELLED, selects only display fields. (5) **boundaries legal** — scheduling imports only `@/features/therapists`; boundaries.yaml not widened. **Proven live on a real DB:** intruder-cancel→false (row stays PENDING); owner-cancel→true (CANCELLED); therapist-party-cancel→true; past-cancel→false (policy); per-user list isolation (B sees 0, cancelled excluded). +3 unit tests.
