# OPERATING.md — the complete system & how to run it

This kit makes an AI coding agent behave like a disciplined senior engineer, and
backs the parts that matter with checks the agent **cannot talk past**. Read
this to understand the whole system and how to operate it.

---

## 1. The pieces (one line each)

**Judgment (what the agent reads to reason):**
- `AGENTS.md` — read first every task; defines THE CYCLE, habits, gates, routing.
- `bigbrainSoftwareArchitectureJudgmentRouter/` — software judgment, book-derived; classify → route → few relevant rules. Includes the vertical-slice rule (`rules/11`).
- `bigbrainDataArchitectureJudgmentRouter/` — same, for schema/pipeline/data work.
- `docs/STACK.md` — the freshness layer: current versions/conventions (you keep it current). Timeless judgment lives in the brains; current facts live here or in live docs the agent fetches.

**Doing (runnable tools):**
- `bootstrap.py` — run once per repo; does all setup a script can.
- `bigbrainGenerator/new_domain.py` — stamps a correct domain + registers it in the boundary policy.
- `bigbrain_verify.py` — ONE command for the whole check cycle (typecheck + lint + test + boundaries).
- `bigbrainBoundaryGuard/` — the policy (`boundaries.yaml`) + dispatcher that enforces module boundaries via dependency-cruiser / import-linter / tach.
- `bigbrainReviewer/` — an LLM critic that pushes back on PR diffs (advisory).

**Enforcing (lives outside the agent):**
- `.github/workflows/boundaries.yml` — required check: boundaries.
- `.github/workflows/gates.yml` — required checks: verify + small-PR limit (stacked-PR proxy).
- `.github/workflows/review.yml` — advisory: posts the critic's findings.
- `BRANCH_PROTECTION.md` — the git-host settings + token scoping that make the above bind.

---

## 2. The three tiers of discipline (know which is which)

| Tier | What | Strength | Examples |
|------|------|----------|----------|
| **Surfaced** | Agent self-reports | only as strong as a human reading the reply | the cycle, TDD ordering, the "prove it" template |
| **Soft** | A second intelligence | stronger, still fallible/gameable | the LLM critic |
| **Hard** | Mechanical, unreachable by the agent | a guarantee | boundaries, small-PR limit, branch protection (+ coverage floor *once you arm it*) |

The agent is an *untrusted committer*: reliable ~95% of the time, which is fine
for low stakes and not fine for the things you enforce. Hard tier turns the 95%
into 100% for exactly those things. **Authority comes from a trust asymmetry, not
from intelligence** — the hard tier is dumb and unpersuadable on purpose, which
is why no agent (not even a second one) can be the hard tier.

---

## 3. One-time setup (per repo)

```bash
# copy the kit into your repo root, then:
python bootstrap.py --protect
```

`bootstrap.py` installs deps, writes `boundaries.yaml` and `docs/STACK.md` (never
overwrites), tells you which validators to install, and — with `--protect`, if
your `gh` CLI has repo admin — sets branch protection. Then finish the
**irreducible residue** it prints (these live outside the files by design):

1. Edit `boundaries.yaml` so the domains match your app; fill in `docs/STACK.md`.
2. Install validators: `npm i -D dependency-cruiser` (TS) and/or `pip install import-linter` (Python); `pip install pyyaml`.
3. Make `boundaries`, `verify`, `pr-size` **required** checks on `main`; block direct pushes.
4. Scope the **agent's token**: Contents + PR write only, **no Administration** — so the agent can't disable the wall. *Do this as a human; never let the agent set its own permissions.*
5. Optional: add the `ANTHROPIC_API_KEY` repo secret to turn on the critic.

Full detail: `BRANCH_PROTECTION.md`.

---

## 4. The per-task loop (every change)

Point Codex / Claude Code / your agent at the repo. `AGENTS.md` drives it through:

1. **Orient** — read `docs/STACK.md` + the relevant brain.
2. **Plan** — small stages; for new work, plan the **first vertical slice**. One stage = one small PR.
3. **Generate** — new domain? use the generator (born correct + registered). Then fill it **vertically**.
4. **TDD** — failing test first (red) → minimum code (green) → refactor green. One behavior at a time.
5. **Verify** — `python bigbrain_verify.py`. All green or it isn't done.
6. **Prove it** — the agent shows red→green and states what it did NOT build.
7. **PR → review** — open the small PR; the critic comments; address must-fix; the hard checks gate the merge.

You run nothing manually in steady state except reviewing PRs.

---

## 5. The per-feature loop (something new)

1. **Generator** stamps the domain skeleton (the horizontal shape).
2. **First vertical slice** — wire ONE thin behavior through every real layer (UI → service → DB → test → deploy). No stubs, no gold-plating. Ship it. This proves the shape and becomes the template.
3. **Then breadth** — each additional behavior/screen is its own vertical slice = its own small PR, stacked. Extract shared pieces only when duplication is real.
4. A horizontal-scoped goal (e.g. "redo the whole UI") is still delivered as vertical slices — one shippable screen first.

---

## 6. Daily commands

```bash
python bigbrain_verify.py                         # run the full cycle
python bigbrain_verify.py --only test             # one step
python bigbrain_verify.py --min-coverage 80       # enforce a coverage floor (TDD proxy)
python bigbrainBoundaryGuard/check_boundaries.py check     # boundaries only
python bigbrainBoundaryGuard/check_boundaries.py explain   # see the resolved policy
python bigbrainGenerator/new_domain.py <name> --allow platform   # new domain
git diff origin/main...HEAD | python bigbrainReviewer/review.py  # critic locally (needs API key)
```

---

## 7. The one thing to remember

Everything the agent *says* it did is surfaced — trust it for low stakes, verify
for the rest. Three things are guaranteed out of the box — **boundaries, small
PRs, branch protection** — and a coverage floor joins them once you arm it
(`MIN_COVERAGE`). The human at the top is irreducible not because automation
fell short, but because enforcement is the one job that must belong to an actor
the agent cannot reach.
