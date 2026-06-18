# STACK.md — current decisions (the freshness layer)

The brains carry *timeless judgment* (when distribution earns its cost, how to
migrate a contract safely). That doesn't expire. **Current practice** does —
which library, which version, today's idiom. This file holds the current,
project-specific decisions. Keep it short and current; fix it here when a
choice goes stale. For genuinely time-sensitive facts (a library's exact
current API, whether something is deprecated), **fetch live docs at task time**
rather than trust frozen text.

> SUPERVISION: version numbers below were read from the npm registry via
> `npm view <pkg> version` on **2026-06-18** (the same source `npm install`
> resolves against). They are proposals to verify, not eternal truth. Exact
> pins live in the committed `package-lock.json` once Stage 0 installs them.

## Project
- **The Serene Path** — trilingual (he/en/fr) therapist–patient matching
  platform: AI intake chat → bio-grounded match → book → pay → video session,
  all on-platform. Authoritative descriptions: `APP_SPEC.md` (what/how) and
  `BUILD_PLAN.md` (staged sequencing). Build stages in order.

## Languages & runtimes
- **TypeScript 6.0.x** on **Node 20 LTS** (single repo, single language).
- Node version is pinned via `.nvmrc` + `engines.node` and the lockfile is
  committed — this avoids the version drift that broke the prototype
  (BUILD_PLAN Stage 0 "Pin early").

## Frameworks & key libraries (versions @ 2026-06-18)
- **Next.js 16.2.x** (App Router) — `react` / `react-dom` **19.2.x**.
- **Tailwind CSS 4.3.x** — note: v4 is **CSS-first** (`@theme` in the global
  stylesheet, no `tailwind.config.js` by default). The Material You tokens (§7)
  are ported as CSS custom properties / `@theme` tokens; components use the
  semantic token names, never raw hex.
- **shadcn/ui** — components added via the `shadcn` CLI, then **restyled to the
  ported tokens** (not default shadcn theming). Presentational primitives live
  in `src/components/ui` (deliberately not a boundary module).
- **next-intl 4.13.x** — i18n with `[locale]` path segment; middleware
  negotiates locale (cookie → Accept-Language → default `en`); `<html lang dir>`
  set per locale (Hebrew → `rtl`); catalogs in `messages/{en,he,fr}.json`
  namespaced by feature. Use **logical CSS properties** (`*-inline-start/end`,
  `text-start`) so layout mirrors. Currency default **ILS**; dates/numbers via
  `Intl`/next-intl, locale + timezone aware.
- **Prisma 7.8.x** (`prisma` + `@prisma/client`) over **PostgreSQL**. Schema is
  the source of truth (APP_SPEC §8). Ids = cuid; instants stored **UTC**; money
  as `Decimal`; localized text as `{ en, he, fr }` JSON.
- **zod 4.4.x** — validate every boundary: route handlers, server actions, AND
  the LLM's JSON output (APP_SPEC §11, §5).
- **@anthropic-ai/sdk 0.105.x** — Anthropic Claude API, **server-side only**,
  **streaming**. Model id is chosen at Stage 3; default to a current Claude
  model (e.g. `claude-sonnet-4-6` for cost/latency on intake; revisit per
  quality). The intake system prompt lives in **one versioned module**. The
  model never invents times/prices/identities — the server resolves those
  (APP_SPEC §5). Before any Anthropic-touching task, consult the `claude-api`
  skill for current model ids / SDK usage rather than relying on memory.
- **vitest 4.1.x** — unit/integration test runner (TDD red→green). Playwright
  (`@playwright/test` 1.61.x) reserved for end-to-end if/when needed.
- **eslint 10.x** — lint.

## Data
- PostgreSQL + Prisma migrations. One feature owns its own tables and is the
  only module with a `repository.ts` touching them (APP_SPEC §4). Tables for
  later stages (Payment → Stage 8, Review → Stage 9) are added when that stage
  begins, keeping the §8 shapes.
- Booking is inserted **atomically** so two clients can't take one slot;
  conflicts return a clear error and the slot is re-offered (APP_SPEC §9).

## Auth / security  (auth provider is an OPEN decision — APP_SPEC §12.1, Stage 4)
- Accessed through the platform's own **`AuthProvider`** interface; the vendor
  SDK lives only in `src/server/auth`. Candidates: **Clerk** (`@clerk/nextjs`
  7.5.x, managed) or **Auth.js / NextAuth** (note: `next-auth` 4.24.x is the v4
  line; the App Router path is Auth.js v5 / `@auth/*` — verify at Stage 4).
- Payments (`PaymentProvider`, Stage 8) and Video (`VideoProvider`, Stage 7)
  follow the same pattern: own interface, vendor SDK only inside the adapter,
  stubbed until the decision is locked.
- Typed, validated **env at boot** (`src/lib/env`, zod) — fail fast on a missing
  required var. `.env.example` documents every variable; secrets never
  committed and never reach the client.
- Error responses use `{ error: { code, message } }`; domain errors map to HTTP
  status; no stack traces or secrets leak to the client (`src/lib/errors`).
- **Sensitive data** (mental-health info + video): encrypt in transit/at rest,
  minimize what's stored, scope access by role, audit access to
  sessions/appointments. **Compliance regime (IL Privacy Protection Law / GDPR
  / medical confidentiality) must be confirmed before launch** — APP_SPEC §11,
  §12.5. Flag, not legal advice.
- Security reflexes (always): authz on every endpoint; never trust input
  (validate at the boundary); no secrets in code; parameterized queries only
  (Prisma — never string-built SQL); don't log sensitive data.

## Conventions specific to this repo
- **Structure follows APP_SPEC §4, not the generic bigbrain generator.** The
  generator stamps `src/domains/<name>/{contracts,model,service,repo}`; this app
  uses the spec's Next.js vertical slices instead:
  ```
  src/app/[locale]/   routing + thin glue (parse → call service → render); api/ route handlers
  src/features/<area>/ ui/  actions.ts  service.ts  repository.ts  schema.ts  types.ts  index.ts
  src/components/ui/  shadcn primitives (presentational)
  src/lib/            i18n, db, env, errors, utils  (cross-cutting = shared kernel)
  src/server/         server-only vendor adapters (anthropic, auth, payment, video, email)
  ```
  Because the generator's layout doesn't fit, feature skeletons are created to
  match this shape and registered by hand in `boundaries.yaml` (which PHASE 1
  authored). BoundaryGuard is structure-agnostic and enforces these paths.
- **One-directional flow:** route/action → service → repository → DB. Components
  are presentational and call actions; they never query the DB.
- **Cross-feature use goes through `index.ts` only** (a module's public
  surface) or through `lib`. This is mechanically enforced — see
  `boundaries.yaml`. An edge that isn't listed there fails the build; widening a
  boundary is its own PR with an ADR naming the present-day force.
- Times stored in **UTC**, rendered per the user's locale/timezone.

## Known danger zones
- **Node/tooling version drift** broke the earlier prototype — keep `.nvmrc`,
  `engines`, and the lockfile authoritative and committed.
- **Tailwind v4 CSS-first** theming differs from v3 (`tailwind.config.js`);
  porting the Material You token set goes in CSS `@theme`, and shadcn must be
  wired for v4. Verify shadcn ↔ Tailwind v4 compatibility at Stage 0.
- **RTL Hebrew**: physical CSS (`ml/mr`, `left/right`) leaks LTR assumptions;
  use logical properties throughout. Pair a Hebrew-capable font with Manrope /
  Public Sans (§7).
- **LLM output is untrusted input**: zod-validate the model JSON, drop unknown
  therapist ids, force `matches` non-empty only in MATCH/PRESENT_OPTIONS, and
  always server-resolve `nextAvailable` (APP_SPEC §5).
- **Three vendor decisions unresolved** (auth/payments/video, §12) — stay behind
  the interfaces; don't let a vendor SDK leak out of `src/server/<area>`.
