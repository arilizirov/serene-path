# Extracted Codex-Skill Training Material
## Source: _An Elegant Puzzle: Systems of Engineering Management — Will Larson_

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

Primary domains:

```text
senior engineering judgment
engineering management
technical debt strategy
migration planning
systems thinking
execution strategy
product engineering
```


---

# 1. Think in Systems, Not Local Fixes

## Core teaching

Engineering organizations and codebases behave like systems with feedback loops, bottlenecks, queues, incentives, and constraints. Local fixes can worsen the whole if they ignore system dynamics.

## Codex trigger

Apply when improving process, delivery, technical debt, migrations, roadmaps, or broad engineering strategy.

## Signals and smells

- Same issue returns repeatedly
- Work piles up in review/testing/deployment
- Optimizing one team creates bottleneck elsewhere
- No feedback loop from production/support/users
- Everything treated as a coding problem

## Desired Codex behavior

Codex should identify the system, bottleneck, feedback loop, and second-order effects before proposing work.

## Implementation guidance

- Ask what flow is blocked
- Identify upstream/downstream effects
- Avoid optimizing non-bottlenecks
- Make metrics/feedback loops explicit
- Prefer changes improving throughput, reliability, or learning

## Review guidance

- What system are we changing?
- Where is the bottleneck?
- Does local improvement hurt global flow?
- How will we know it worked?

## Testing / verification guidance

- Define success metrics
- Measure before/after
- Use small experiments
- Track cycle time, defect rate, deployment frequency, support load where relevant

## Tradeoffs and cautions

Use for broad process/architecture/team/roadmap decisions, not tiny function edits.

## Example transformation

Before: rewrite slow code because developers complain.

After: check whether the real bottleneck is code complexity, review delay, flaky tests, unclear ownership, or deployment risk.

## Distilled skill rule

For broad engineering problems, identify the system bottleneck and feedback loop before proposing a local fix.


---

# 2. Technical Debt Requires Portfolio Judgment

## Core teaching

Not all technical debt should be fixed immediately. Debt should be classified by impact, risk, change frequency, and strategic relevance.

## Codex trigger

Apply when finding messy code, outdated dependencies, poor architecture, missing tests, or cleanup requests.

## Signals and smells

- “Fix all tech debt”
- Cleanup competing with urgent product work
- High-churn code has no tests
- Low-churn ugly code consumes attention
- Debt repeatedly blocks delivery

## Desired Codex behavior

Codex should classify debt and recommend: ignore, document, opportunistically improve, schedule, migrate, or escalate.

## Implementation guidance

- Prioritize high-change/high-risk areas
- Tie cleanup to product work where practical
- Separate safety debt from aesthetic debt
- Propose incremental debt payment
- Define success criteria

## Review guidance

- What cost does this debt impose?
- How often is area changed?
- Is it blocking delivery or causing incidents?
- What is the smallest debt payment reducing risk?

## Testing / verification guidance

- Add tests around high-churn debt
- Track defect/cycle-time improvements
- Verify cleanup preserves behavior
- Use migration checkpoints

## Tradeoffs and cautions

Some ugly but stable code should be left alone until strategically relevant.

## Example transformation

Before: refactor every old service because it is ugly.

After: prioritize enrollment because it changes monthly and causes defects; leave stable archive import alone.

## Distilled skill rule

Classify technical debt by impact and change frequency; pay down the debt that blocks delivery or increases risk.


---

# 3. Plan Migrations as Sequenced Systems Work

## Core teaching

Large migrations succeed when they are sequenced, measured, reversible, and designed around ongoing product delivery.

## Codex trigger

Apply when planning framework upgrades, database replacements, service extraction, architecture cleanup, dependency modernization, or platform shifts.

## Signals and smells

- Big-bang migration
- No owner
- No progress metric
- Product work freezes
- No rollback
- Long-running branch diverges

## Desired Codex behavior

Codex should design migrations as small slices with clear milestones and low blast radius.

## Implementation guidance

- Define goal/non-goals
- Identify first safe slice
- Create compatibility layer
- Track progress visibly
- Keep mainline releasable
- Remove old paths after cutover

## Review guidance

- What is smallest safe slice?
- Can old/new coexist?
- How is progress measured?
- What is rollback?
- Who owns cleanup?

## Testing / verification guidance

- Migration dry runs
- Dual-run comparison tests
- Compatibility tests
- Rollback tests
- Incremental smoke tests

## Tradeoffs and cautions

Migrations can become endless. Define exit criteria and remove transitional code.

## Example transformation

Before: upgrade every endpoint to new auth in one release.

After: add adapter, migrate low-risk endpoints, dual-log decisions, validate metrics, then migrate critical endpoints.

## Distilled skill rule

Plan migrations as incremental, measurable, reversible sequences that preserve ongoing delivery.


---

# 4. Use Strategy to Say No

## Core teaching

A strategy is useful only if it guides prioritization and excludes work. Codex should not produce endless improvement lists.

## Codex trigger

Apply when asked for roadmap, architecture plan, cleanup strategy, feature sequencing, or next steps.

## Signals and smells

- Many unrelated improvements
- No prioritization
- Everything urgent
- Too many simultaneous initiatives
- Work not tied to goal

## Desired Codex behavior

Codex should choose a small number of priorities and explicitly defer the rest.

## Implementation guidance

- Identify goal and constraints
- Rank by impact, risk, urgency, dependency
- Limit concurrent initiatives
- State what not to do yet
- Create reassessment checkpoints

## Review guidance

- What goal does this serve?
- What are we choosing not to do?
- Is there too much parallel work?
- What evidence changes priority?

## Testing / verification guidance

- Define measurable outcomes
- Review milestone progress
- Track blocked/active/completed work
- Validate assumptions with small experiments

## Tradeoffs and cautions

Strategy must adapt to new information; recommend reassessment.

## Example transformation

Before: improve tests, refactor architecture, upgrade dependencies, add monitoring, rewrite UI, and add features at once.

After: stabilize deployment and add billing tests first; defer UI rewrite and broad cleanup.

## Distilled skill rule

A good engineering plan prioritizes a few high-leverage actions and explicitly defers lower-value work.


---

# 5. Manage Execution with Small Batches

## Core teaching

Large ambiguous projects fail when work stays invisible too long. Small batches create feedback and reduce risk.

## Codex trigger

Apply when scoping large refactors, migrations, architecture changes, platforms, or multi-feature initiatives.

## Signals and smells

- Large PRs
- Long-running branch
- No intermediate value
- “Almost done” for weeks
- No demoable milestones
- Risk discovered late

## Desired Codex behavior

Codex should break work into reviewable, shippable increments with validation at each step.

## Implementation guidance

- Slice by vertical capability where possible
- Keep PRs focused
- Ship scaffolding safely
- Use feature flags when useful
- Define completion per slice

## Review guidance

- Can this be smaller?
- Does slice reduce risk?
- Is there intermediate value?
- Can it be reviewed independently?

## Testing / verification guidance

- Per-slice regression tests
- CI checks
- Smoke tests
- Feature-flag verification
- Review after each milestone

## Tradeoffs and cautions

Too-small slices add overhead if they produce no learning; slice around meaningful feedback.

## Example transformation

Before: one massive PR converts whole app architecture.

After: migrate one bounded module, add dependency checks, verify build/tests, then repeat.

## Distilled skill rule

Break large engineering work into small reviewable increments that produce feedback or reduce risk.


---

# 6. Make Ownership Explicit

## Core teaching

Engineering systems work better when ownership boundaries are clear. Ambiguous ownership creates neglected modules, repeated coordination, and slow decisions.

## Codex trigger

Apply when designing modules, services, repositories, workflows, or multi-team process.

## Signals and smells

- Everyone owns everything
- No one owns failing area
- Shared components changed casually
- Repeated cross-team blocking
- Unclear decision authority

## Desired Codex behavior

Codex should recommend explicit ownership for systems, modules, data, and operational responsibilities.

## Implementation guidance

- Assign owner/team for module/service/data
- Define interface/responsibilities
- Document escalation/support path
- Add code owners/review rules where appropriate

## Review guidance

- Who owns this after merge?
- Who responds to incidents?
- Who approves interface changes?
- Is ownership aligned with domain knowledge?

## Testing / verification guidance

- Ownership docs/codeowners
- Runbook verification
- Interface contract tests
- Review gates for owned modules

## Tradeoffs and cautions

Ownership should not create silos; interfaces should allow collaboration while preserving accountability.

## Example transformation

Before: any developer changes billing tables and reporting projections.

After: billing has explicit owner, contract tests, and review expectations for invariant/schema changes.

## Distilled skill rule

Make ownership explicit for modules, data, interfaces, and operational responsibilities.


---

# 7. Use Metrics Carefully

## Core teaching

Metrics guide improvement only when tied to real outcomes. Bad metrics distort behavior and create local optimization.

## Codex trigger

Apply when recommending metrics for productivity, reliability, debt, delivery speed, migration progress, or quality.

## Signals and smells

- Metric chosen because easy to count
- Lines of code/PR count treated as productivity
- Coverage target without quality discussion
- No baseline
- No action tied to metric

## Desired Codex behavior

Codex should choose metrics that support decisions and pair quantitative data with qualitative judgment.

## Implementation guidance

- Define decision metric informs
- Use leading and lagging indicators
- Prefer outcome metrics over vanity metrics
- Add baseline and target
- Watch for gaming

## Review guidance

- What decision will metric improve?
- Can it be gamed?
- Outcome or activity?
- What behavior will it incentivize?
- Is there a baseline?

## Testing / verification guidance

- Validate metric collection
- Review after interventions
- Compare with qualitative feedback
- Use dashboards for trend, not punishment

## Tradeoffs and cautions

Metrics can harm if used as individual pressure. Frame as system feedback.

## Example transformation

Before: maximize number of tickets closed.

After: track lead time, escaped defects, incident count, and developer-reported friction.

## Distilled skill rule

Use metrics as system feedback tied to decisions, not vanity counts or individual pressure.


---

# 8. Codex as Tech Lead: Sequence, Scope, and Risk

## Core teaching

The useful extraction for Codex is tech-lead behavior: reduce ambiguity, choose leverage, sequence work, and manage risk rather than just generating code.

## Codex trigger

Apply when a task spans multiple files, teams, modules, deadlines, or tradeoffs.

## Signals and smells

- Codex jumps directly to implementation
- No staging plan
- No risk assessment
- Large unreviewable change
- Missing success criteria

## Desired Codex behavior

Codex should frame the problem, identify constraints, propose staged execution, and keep work reviewable.

## Implementation guidance

- State goal, constraints, assumptions
- Identify risks/dependencies
- Propose phased plan
- Keep first step small
- Define verification per phase
- Defer nonessential improvements

## Review guidance

- Is plan sequenced?
- Are risks named?
- Is scope controlled?
- Are success criteria clear?
- Is there feedback loop?

## Testing / verification guidance

- Phase-specific tests
- Milestone reviews
- Rollback/checkpoint plan
- Production validation when relevant

## Tradeoffs and cautions

Do not over-manage small tasks. Use for broad, risky, or ambiguous work.

## Example transformation

Before: Codex starts implementing entire school management rewrite.

After: Codex proposes phases: stabilize model, add tests to enrollment/billing, migrate one workflow, validate, then expand.

## Distilled skill rule

For broad engineering work, Codex should sequence work, control scope, name risks, and define verification before coding.


---

# Compression Candidates for Future `SKILL.md`

```text
For broad engineering problems, identify the system bottleneck and feedback loop before proposing a local fix.
```

```text
Classify technical debt by impact and change frequency; pay down the debt that blocks delivery or increases risk.
```

```text
Plan migrations as incremental, measurable, reversible sequences that preserve ongoing delivery.
```

```text
A good engineering plan prioritizes a few high-leverage actions and explicitly defers lower-value work.
```

```text
Break large engineering work into small reviewable increments that produce feedback or reduce risk.
```

```text
Make ownership explicit for modules, data, interfaces, and operational responsibilities.
```

```text
Use metrics as system feedback tied to decisions, not vanity counts or individual pressure.
```

```text
For broad engineering work, Codex should sequence work, control scope, name risks, and define verification before coding.
```
