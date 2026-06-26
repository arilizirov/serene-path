# Deploying The Serene Path (Render + Neon)

The app is **Next.js + Prisma/Postgres**. It is hosted as a **Render Web Service**
(runs `next start`) backed by a **Neon** Postgres database, on the domain
`therap.aidir.info`.

```
therap.aidir.info ──CNAME──▶ Render Web Service (Next.js)
                                   ├── env: AUTH_SECRET, OPENAI_API_KEY, OPENAI_MODEL
                                   └── DATABASE_URL ──▶ Neon Postgres
```

## 1. Neon (database)

1. Create a Neon project + database.
2. Copy the **direct** connection string (NOT the `-pooler` one). It looks like:
   `postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/DBNAME?sslmode=require`
   The `?sslmode=require` is required. This single URL is used for both the app and
   the migrations.

## 2. Secrets to prepare

- **`AUTH_SECRET`** — generate a random 32+ char value:
  ```
  node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
  ```
- **`OPENAI_API_KEY`** — a **fresh** key from platform.openai.com (rotate any key
  that was ever shared in chat). It is only ever set in Render, never committed.

## 3. Render (the app)

Either use the **Blueprint** (`render.yaml` in this repo) or create a Web Service
manually with these settings:

| Setting | Value |
|---|---|
| Repository / branch | `arilizirov/serene-path` · `main` |
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Pre-Deploy Command | `npm run db:deploy` *(= `prisma migrate deploy`)* |
| Start Command | `npm run start` |
| Health Check Path | `/en` |
| Instance type | Starter (Free spins down on idle → cold starts) |

**Environment variables** (Dashboard → Environment):

| Key | Value |
|---|---|
| `DATABASE_URL` | the Neon direct connection string from step 1 |
| `AUTH_SECRET` | the value from step 2 |
| `OPENAI_API_KEY` | your fresh OpenAI key |
| `OPENAI_MODEL` | `gpt-5.4` *(optional; this is the default)* |
| `NODE_VERSION` | `22` |
| `NODE_ENV` | `production` *(Render usually sets this)* |

`postinstall` runs `prisma generate` during install; the **Pre-Deploy Command**
applies pending migrations to Neon before each release goes live.

### (Optional) seed demo therapists
The 10 demo therapists are dev data. To load them into Neon once, run locally with
`DATABASE_URL` pointed at Neon:
```
npx tsx --env-file=.env prisma/seed-demo-therapists.ts
```
(or skip — real therapists onboard via the app.)

## 4. Domain (`therap.aidir.info`)

1. After the first successful deploy, in Render → the service → **Settings →
   Custom Domains**, add `therap.aidir.info`.
2. Render shows a **CNAME target** (e.g. `serene-path.onrender.com`).
3. In the DNS for `aidir.info`, add a record: `CNAME  therap  →  <that target>`.
4. Render issues the TLS certificate automatically once DNS resolves.

## 5. Verify it's live

- `https://therap.aidir.info/en` loads the home page.
- The therapist directory + a profile render with live data.
- The intake chat at `/en/intake` returns a real reply (confirms `OPENAI_API_KEY`
  + DB are wired). The endpoint is **IP rate-limited** (20 turns / 10 min) to
  protect the key.

### Post-deploy crisis smoke test (MUST pass before announcing the deploy)

Confirms the OPENAI key is wired AND the crisis classifier fires end-to-end on a
**passive-ideation** phrase (a phrasing the keyword net is meant to catch). POST it
to `/api/intake` and assert the turn comes back in the `CRISIS` state:

```bash
curl -s -X POST https://therap.aidir.info/api/intake \
  -H 'content-type: application/json' \
  -d '{"locale":"en","text":"I don'\''t see the point anymore"}' \
  | grep -q '"state":"CRISIS"' \
  && echo "CRISIS smoke OK" || { echo "CRISIS smoke FAILED — DO NOT announce"; exit 1; }
```

A non-`CRISIS` result here means the safety path is broken (missing/invalid key, a
classifier regression, or the keyword floor was weakened) — treat it as a release
blocker, roll back, and fix before the intake serves real users.

## Notes & limits

- **Rate limit** is in-memory → per-instance. Fine for a single Starter instance;
  move to Redis if you scale to multiple instances.
- **Times** display in Israel time for now; per-viewer timezone is a future item.
- **Email & video** providers are not wired yet (stubbed) — booking confirmation
  emails are a no-op in production until an email provider is added.
