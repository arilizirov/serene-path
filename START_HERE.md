# START HERE — operating instructions for the coding agent

**You are the coding agent working in this repository.** This is your brief.
Follow it top to bottom the first time. After setup, `AGENTS.md` drives every
task. Do what each phase says, run the commands, and report what happened.

---

## Your discipline model (read once)

- **Surfaced** = things you self-report (the cycle, TDD, the "prove it" note). You
  are expected to follow them, and to show evidence — not just claim them.
- **Hard** = mechanical checks you **cannot bypass**: module boundaries, a
  small-PR limit, branch protection, and a coverage floor *once your human arms
  it*. Do not try to route
  around them. If a boundary genuinely must change, edit `boundaries.yaml` in its
  own PR with an ADR explaining the present-day force — never widen it to sneak a
  dependency through.

You are an *untrusted committer*: free to write anything on a branch, unable to
merge what the hard checks reject. That is by design. Work with it.

---

## PHASE 1 — Setup (do this once, now)

Run these and report the result of each:

1. `python bootstrap.py` — installs the Python dep, writes `boundaries.yaml` and
   `docs/STACK.md` (it never overwrites existing files).
2. Install the validator(s) for this repo's stack, plus `pip install pyyaml`:
   - **TS/JS:** `npm i -D dependency-cruiser`, and make sure `typecheck` / `lint`
     / `test` scripts exist in `package.json`.
   - **Python:** `pip install import-linter`, and set `python.root_package` in
     `boundaries.yaml` to the importable top-level package.
3. **Edit `boundaries.yaml`** so the modules match THIS app's domains. Show the
   diff and explain your domain choices in plain language.
4. **Fill in `docs/STACK.md`** with the real stack, versions, and conventions. If
   unsure of a current version or API, fetch live docs and **cite what you
   fetched** so it can be checked.
5. `python bigbrain_verify.py` — confirm the cycle runs. (Some steps may report
   "nothing to run" until there's real code; that's fine.)
6. Confirm both `AGENTS.md` and `CLAUDE.md` exist at the repo root (bootstrap
   creates the `CLAUDE.md` pointer if missing) — so whichever agent tool is used
   finds its instruction file. Both resolve to the same content; edit `AGENTS.md`.

---

## PHASE 2 — STOP. Hand off to your human.

Two settings live on the git host, not in these files, and **one of them you must
not do yourself.** Tell your human, verbatim:

> Two one-time settings are needed before I do real work:
> **(a)** Make `boundaries`, `verify`, and `pr-size` **required** status checks on
> `main`, and block direct pushes. You can run `python bootstrap.py --protect` if
> your `gh` CLI has repo admin, or set it in repo settings.
> **(b)** Scope **my** token to *Contents + PR write only, NO Administration* — so
> I cannot disable the checks that constrain me. **This one is yours, not mine:**
> if I could set my own permissions, the enforcement would be meaningless.
> Details are in `BRANCH_PROTECTION.md`.

Until your human confirms (a) and (b), the hard tier is **not standing** — your
self-discipline is the only thing holding. If you proceed before then, say so
explicitly in your output so no one mistakes "followed instructions" for
"enforced."

---

## PHASE 3 — Per-task loop (every change from now on)

Read `AGENTS.md`; it defines the cycle. In short, in order:

1. **Orient** — read `docs/STACK.md` + the relevant brain
   (`bigbrainSoftwareArchitectureJudgmentRouter` for code/architecture,
   `bigbrainDataArchitectureJudgmentRouter` for schema/data).
2. **Plan** — small stages. For new work, plan the **first vertical slice** before
   breadth. One stage = one small PR.
3. **Generate, don't hand-roll** — new domain? `python
   bigbrainGenerator/new_domain.py <name>`. It's born correct and registered in
   `boundaries.yaml`. Then **fill it vertically** — one real end-to-end behavior
   before fleshing out any single layer.
4. **TDD** — failing test first (red) → minimum code to pass (green) → refactor
   green. One behavior at a time.
5. **Verify** — `python bigbrain_verify.py`. All steps green, or it isn't done.
6. **Prove it** — show red→green, and state in one line what you deliberately did
   NOT build and why the simpler choice suffices.
7. **PR → review** — open the small PR. The advisory critic will comment; address
   its must-fix findings. The hard checks gate the merge.

---

## PHASE 4 — Building something new

1. The **generator** stamps the domain skeleton (the horizontal shape).
2. Build **one vertical slice** end-to-end through real layers — UI → service →
   DB → test → deploy. No stubs, no gold-plating. Ship it. This proves the shape
   and becomes the template.
3. **Then breadth** — each further behavior/screen is its own vertical slice = its
   own small, stacked PR. Extract shared pieces only when duplication is real.
4. A horizontal-scoped goal (e.g. "redo the whole UI") is still delivered as
   vertical slices — one shippable screen first.

---

## The rule that governs you

Everything you *say* you did is surfaced — earn trust by showing evidence. Three
things are *guaranteed* by machine out of the box — **boundaries, small PRs,
branch protection** — plus a coverage floor once your human arms it. Do not
mistake following these instructions for being enforced by them. The enforcement
is the checks — and, for the one thing you must not set yourself, your human.

(Reference docs, if you need depth: `OPERATING.md` = the human's runbook,
`BRANCH_PROTECTION.md` = the git-host setup, the two `bigbrain…` brains = judgment.)
