# AGENTS.md

Read this first, every task. It routes — it doesn't teach. Depth lives in the brains.

## The cycle (follow this order, every non-trivial task)
1. **Orient.** Read `docs/STACK.md` for current stack/conventions. Read the relevant brain for judgment.
2. **Plan.** Break the work into small stages. For new features/systems, plan the **first vertical slice** before breadth — one thin path through every layer. Show the plan, wait. One stage = one small PR (see Stacked PRs).
3. **Scaffold structure with the generator, never by hand.** New domain? `python bigbrainGenerator/new_domain.py <name>`. It stamps the horizontal skeleton (born correct, registered in `boundaries.yaml`) — then you fill it **vertically**: one real end-to-end behavior before fleshing out any single layer.
4. **TDD, one behavior at a time.** Failing test first (red) → minimum code (green) → refactor green.
5. **Verify before "done."** Run `python bigbrain_verify.py`. All steps green or it isn't done.
6. **Prove it** in your final reply (template below), then open the PR.
7. **Submit to review.** The PR triggers the advisory LLM critic; address must-fix findings.

Steps 1–6 are *yours to follow* (surfaced). The repo also enforces a *mechanical* floor you cannot talk past: the boundary check, the small-PR limit, and branch protection. Don't try to route around them.

## Habits (always)
- Plan before non-trivial code. Show the plan, wait, then build.
- Small steps. One change at a time.
- Preserve behavior unless a change was asked for.
- Match existing code style.
- Never claim done with failing checks.
- Clear context between unrelated tasks.

## TDD (default for any behavior change)
- Write a failing test **first**, run it, see it fail for the right reason (red).
- Write the **minimum** code to make it pass (green). Nothing more.
- Refactor with the test green. Never add behavior during a refactor.
- Loop one behavior at a time. Don't write five tests then five features.
- Exception: trivial non-behavioral edits (typo, comment, formatting, config rename) and throwaway spikes. If you skip TDD, **say so and say why** — don't skip silently.

## KISS (simplest thing that works)
- Build the smallest solution that satisfies the request as it stands now.
- No abstraction, layer, interface, class, config flag, or dependency without a force that exists **today** — not one you imagine for later.
- Solve the problem in front of you, not the general case, unless the general case was asked for.
- If two designs work, ship the one with fewer moving parts. Boring beats clever.

## Discipline gates (stop before you cross these)
- About to write implementation code? → a failing test for it must already exist (or you've stated the TDD exception).
- About to add an abstraction/layer/service/dependency? → name the present-day force that requires it, out loud. No force named → don't add it.
- About to import across a module boundary? → the import must be allowed by `boundaries.yaml` AND target the module's public surface. `bigbrainBoundaryGuard` is authoritative here, not your judgment. If the boundary is wrong, change `boundaries.yaml` in its own PR with an ADR — never route around it.

## Prove it (every code task, in your final reply)
- TDD: show the test, show it failing (red), then show it passing (green). If you can't run the checks, say what's unverified.
- KISS: state in one line what you deliberately did **not** build, and why the simpler choice is sufficient.
- Boundaries: if the change touches module structure, run `check_boundaries.py check` and show it passing. If you changed `boundaries.yaml`, link the ADR and name the force.
- This is so I can catch a skipped discipline even when I can't spot a bug myself.

## Stack (use stable command names — don't guess)
- One command for the whole cycle: `python bigbrain_verify.py` (runs typecheck + lint + test + boundaries).
- Web app → TypeScript: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
- Data/scripts → Python: `ruff check .`, `ruff format --check .`, `pytest`.
- Boundaries (any stack): `python bigbrainBoundaryGuard/check_boundaries.py check`.
- Run `bigbrain_verify.py` before done. If a step fails, say so — don't claim done.

## Teach me (I'm still learning — I can't always spot mistakes)
- Before I accept code: explain what it does, why, and what could go wrong. Plain language.
- When a check fails: tell me the mistake and how to avoid it next time, not just the fix.
- If you're unsure or guessing, say so out loud rather than sounding confident.

## Current facts vs timeless judgment
- The brains hold *timeless judgment* (it doesn't expire). `docs/STACK.md` holds *current decisions* (versions, libraries, conventions) — read it and keep it current.
- For genuinely time-sensitive facts (a library's current API, deprecations), **fetch live docs at task time** rather than trusting frozen text — book or STACK.md.
- SUPERVISION: when you fetch docs, NAME the source (URL + what you concluded) in your reply so I can sanity-check it. Fetched facts are proposals to verify, not ground truth.

## Stacked PRs (one stage per PR)
- Each plan stage is its own small PR. Don't batch stages into one big diff — CI fails PRs over the line limit, so a lump won't merge anyway.
- Stack the next stage on the previous branch; keep each PR independently green (verify + boundaries).

## Route into the brains
- Schema, migration, analytics/reporting table, pipeline, identity, or sensitive data → **bigbrainDataArchitecture**.
- Refactor, legacy code w/o tests, public API/contract change, service/module boundary, distributed, production-readiness, performance, or large rewrite → **bigbrainSoftwareArchitecture**.
- (Both brains must be present in the repo for these to work.)

## Boundaries are mechanically enforced (you are an untrusted committer)
- Module boundaries live in `boundaries.yaml` and are enforced by a CI check (`bigbrainBoundaryGuard`) running on every PR, outside your sandbox. You cannot `--no-verify` it and you cannot merge a violation.
- Treat yourself as exactly that: an untrusted committer. Your saying "I respected the boundary" is **not** enforcement — the red build is. Run `check_boundaries.py check` before declaring done and fix the *design* when it fails, never the rule.
- Do NOT propose disabling, weakening, or bypassing the boundary check, branch protection, required reviews, or the agent's own permissions. If a boundary genuinely must change, that is a deliberate PR against `boundaries.yaml` with an ADR naming the present-day force — surfaced for human review, not worked around.

## Security reflexes (always)
- Auth/authz check on every endpoint.
- Never trust user input — validate at the boundary.
- No secrets in code.
- Parameterized queries only — never build SQL by string.
- Don't log sensitive data.

## When I say "write that down"
Put the lesson in the strongest surface that fits:
- objective → a test or script
- domain judgment → the relevant brain
- a habit → this file
Never a "lessons" file nothing reads.

## PROJECT-SPECIFIC
<!-- per-project rules, conventions, danger zones go here -->
