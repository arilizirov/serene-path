# Extracted Codex-Skill Training Material
## Source: _Software Architecture: The Hard Parts — Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani_

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

Primary domains:

```text
architecture
tradeoff analysis
distributed systems
modularity
migration planning
production readiness
senior engineering judgment
```


---

# 1. Architecture Is Tradeoff Analysis

## Core teaching

Hard architecture problems rarely have universally correct answers. Good architecture work discovers tradeoffs, names them explicitly, and chooses based on context.

## Codex trigger

Apply when Codex proposes architecture, splits services, changes boundaries, chooses patterns, selects infrastructure, or resolves competing quality attributes.

## Signals and smells

- “Best practice” used without context
- One-size-fits-all architecture advice
- No explicit tradeoffs
- Tool/pattern chosen by fashion
- No link to business constraints

## Desired Codex behavior

Codex should present architecture choices as tradeoff decisions, not absolute truths.

## Implementation guidance

- State forces: scalability, consistency, latency, deployability, team ownership, complexity, cost
- Offer options with pros/cons
- Choose simplest option satisfying constraints
- Document why the choice fits

## Review guidance

- What tradeoff is being made?
- What does this design make easier/harder?
- What future change does it enable or block?
- Is complexity justified?

## Testing / verification guidance

- Add architecture fitness checks where possible
- Verify key quality attributes with tests/benchmarks
- Use decision records for major tradeoffs

## Tradeoffs and cautions

Scale analysis to impact and reversibility; do not turn every small task into an architecture essay.

## Example transformation

Before: split billing into a microservice because services scale better.

After: compare modular monolith vs service split across consistency, deployment, ownership, data, operations, and migration.

## Distilled skill rule

For architecture decisions, explicitly name tradeoffs and choose based on system context, not generic best practices.


---

# 2. Architectural Characteristics Drive Design

## Core teaching

Architecture should be driven by important qualities: availability, scalability, reliability, performance, security, deployability, testability, maintainability, and operability.

## Codex trigger

Apply when designing a module/service or evaluating whether implementation is production-appropriate.

## Signals and smells

- Requirements only describe features
- Nonfunctional qualities assumed
- Pattern chosen before qualities known
- Tests check behavior but not quality attributes

## Desired Codex behavior

Codex should identify the top architecturally significant characteristics and design around them.

## Implementation guidance

- Ask which qualities matter most
- Avoid optimizing for all qualities equally
- Trace design choices to qualities
- Keep code simple when no special quality is needed

## Review guidance

- Which qualities are significant?
- Does this design support them?
- What quality is sacrificed?
- Is that acceptable?

## Testing / verification guidance

- Load/performance tests for sensitive paths
- Security tests for sensitive flows
- Failure tests for critical flows
- Dependency/module checks for maintainability

## Tradeoffs and cautions

Over-optimizing nonessential qualities creates waste. Prioritize only qualities that materially affect success.

## Example transformation

Before: design registration as generic CRUD.

After: because registration is deadline-driven, prioritize burst tolerance, correctness, auditability, and admin recovery.

## Distilled skill rule

Let architecturally significant qualities drive design decisions and verification.


---

# 3. Modularity and Coupling Are Core Levers

## Core teaching

Architecture manages coupling and cohesion. The right boundary groups things that change together and separates things that need independent evolution.

## Codex trigger

Apply when defining modules, services, packages, bounded contexts, layers, or ownership boundaries.

## Signals and smells

- Business logic spread across UI/controllers/repositories
- Circular dependencies
- Shared database tables across services
- One module owns unrelated responsibilities
- Changes scatter across modules

## Desired Codex behavior

Codex should design boundaries around change patterns, domain cohesion, and data ownership.

## Implementation guidance

- Identify what changes together
- Keep cohesive behavior together
- Make dependencies directional
- Avoid shared mutable state across boundaries
- Prefer module boundaries before service boundaries

## Review guidance

- Does boundary reflect domain or technology?
- What data does each module own?
- Are dependencies intentional?
- Would splitting create distributed transactions?

## Testing / verification guidance

- Static dependency checks
- Module contract tests
- Integration tests across intentional boundaries
- Tests proving business rules live in correct module

## Tradeoffs and cautions

Too many boundaries fragment simple systems. Prefer modular monolith boundaries before distributed services.

## Example transformation

Before: registration validation lives in controller, DB trigger, and UI JavaScript.

After: registration domain owns enrollment rules; UI/database enforce but do not duplicate core logic.

## Distilled skill rule

Design boundaries around cohesion, change patterns, and data ownership before choosing physical deployment.


---

# 4. Distributed Architecture Increases Coordination Cost

## Core teaching

Splitting systems into services trades independent scaling/deployability for latency, consistency, observability, and operational complexity.

## Codex trigger

Apply when proposing microservices, service extraction, async messaging, API boundaries, or distributed data ownership.

## Signals and smells

- Service split without ownership
- Shared database after split
- Synchronous chains between many services
- Distributed transactions needed
- Microservices used to hide messy modularity

## Desired Codex behavior

Codex should challenge service splits and offer modular monolith alternatives unless independence is clearly valuable.

## Implementation guidance

- Define service/data ownership
- Avoid shared database writes
- Design for failure and latency
- Minimize synchronous chains
- Plan migration incrementally

## Review guidance

- What benefit does distribution provide?
- Can a module solve this?
- Who owns the data?
- What happens if service is down?
- Can team operate it?

## Testing / verification guidance

- Contract tests
- Timeout/failure tests
- Observability checks
- Independent deployment tests

## Tradeoffs and cautions

Distributed architecture is usually a later step after module boundaries are clear.

## Example transformation

Before: extract every domain area into a service immediately.

After: first create internal modules; extract only when independent deployment/scaling/ownership outweighs network and consistency costs.

## Distilled skill rule

Do not distribute a system until service ownership, data ownership, and operational tradeoffs are justified.


---

# 5. Use Fitness Functions

## Core teaching

Architecture goals should be testable or checkable over time. Fitness functions guard architectural characteristics against drift.

## Codex trigger

Apply when architecture rules, dependency boundaries, performance goals, security requirements, or migration constraints could regress.

## Signals and smells

- Docs say one thing but code allows anything
- Dependency rules not enforced
- Performance goals untested
- Migration progress not measurable
- Security constraints rely on memory

## Desired Codex behavior

Codex should suggest lightweight checks that continuously verify important architecture decisions.

## Implementation guidance

- Add static dependency checks
- Add module-boundary tests
- Add performance budgets where critical
- Add contract/security checks
- Track migration metrics

## Review guidance

- What architecture rule could regress?
- Can we automate a check?
- Is the check cheap and valuable?
- Who responds when it fails?

## Testing / verification guidance

- Static analysis in CI
- Architecture tests
- Contract tests
- Performance threshold tests
- Migration progress checks

## Tradeoffs and cautions

Avoid fragile checks that block productive change without protecting meaningful quality.

## Example transformation

Before: policy says controllers must not access DbContext.

After: CI rule fails if web layer references persistence types directly.

## Distilled skill rule

Convert important architecture decisions into lightweight checks that prevent drift.


---

# 6. Record Significant Decisions

## Core teaching

Architecture decisions need context, rationale, and consequences so future work does not accidentally undo intentional constraints.

## Codex trigger

Apply when recommending service splits, database choices, messaging patterns, migration strategies, caching, security models, or major dependencies.

## Signals and smells

- Same debate repeats
- Tool chosen without written tradeoffs
- Future developers undo intentional boundaries
- Migration plan exists only in chat

## Desired Codex behavior

Codex should produce concise decision records for significant hard-to-reverse choices.

## Implementation guidance

- Capture context, options, decision, consequences
- Include status/date/owner where useful
- Link decision to verification/fitness checks when applicable

## Review guidance

- Is decision significant enough?
- Are alternatives represented fairly?
- Are consequences explicit?
- Is reversibility clear?

## Testing / verification guidance

- Link ADR to checks/tests
- Verify assumptions at milestones
- Review ADRs during migration checkpoints

## Tradeoffs and cautions

Do not write ADRs for trivial details.

## Example transformation

Before: use Redis for sessions because it seems good.

After: ADR records need, options, failure behavior, operational cost, and exit plan.

## Distilled skill rule

Record significant architecture decisions with context, alternatives, tradeoffs, and consequences.


---

# 7. Migrate Architecture Incrementally

## Core teaching

Large architecture changes should be staged. Big-bang migrations combine behavior risk, data movement, deployment risk, and organizational coordination.

## Codex trigger

Apply when splitting monoliths, replacing databases, moving to events, extracting services, changing APIs, or modernizing architecture.

## Signals and smells

- One giant cutover
- No rollback
- Old/new cannot coexist
- No progress metrics
- No compatibility layer
- Data migration not rehearsed

## Desired Codex behavior

Codex should propose staged migration paths with coexistence, validation, and rollback.

## Implementation guidance

- Identify first safe slice
- Use strangler pattern where suitable
- Run old/new paths in parallel when useful
- Compare outputs before cutover
- Preserve compatibility

## Review guidance

- What is the first safe slice?
- Can old and new coexist?
- How is correctness compared?
- What is rollback?
- How is progress measured?

## Testing / verification guidance

- Parallel-run tests
- Contract tests
- Migration dry runs
- Data consistency checks
- Cutover smoke tests

## Tradeoffs and cautions

Incremental migration can temporarily add complexity; remove transitional code after completion.

## Example transformation

Before: replace whole backend in one release.

After: extract read-only reporting first, mirror data, compare outputs, then route selected users.

## Distilled skill rule

Architectural migrations should be incremental, measurable, compatible, and reversible.


---

# 8. Architecture Includes Operations

## Core teaching

Architecture is incomplete if it ignores deployment, monitoring, failure modes, ownership, and support burden.

## Codex trigger

Apply when proposing new infrastructure, services, queues, databases, caches, or distributed workflows.

## Signals and smells

- New component with no owner
- No monitoring/alerts
- No runbook
- No backup/restore plan
- No deployment path
- “Just add Kafka/Redis/Elasticsearch”

## Desired Codex behavior

Codex should include operational consequences in architecture recommendations.

## Implementation guidance

- Identify owner
- Add metrics/logs/health checks
- Plan backups/recovery for stateful systems
- Include local/dev setup
- Document failure modes
- Prefer existing understood tools when sufficient

## Review guidance

- Who owns this in production?
- How do we know it is healthy?
- How do we recover it?
- What happens during outage?
- Can team operate it?

## Testing / verification guidance

- Smoke tests
- Failure-mode tests
- Backup/restore verification
- Observability checks
- Deployment pipeline tests

## Tradeoffs and cautions

Operational rigor should scale with criticality, but production architecture needs operations.

## Example transformation

Before: add search engine for better filtering.

After: add search with source of truth, indexing pipeline, reindex strategy, lag metric, fallback behavior, and owner.

## Distilled skill rule

Any architecture recommendation that adds runtime components must include ownership, observability, and recovery implications.


---

# Compression Candidates for Future `SKILL.md`

```text
For architecture decisions, explicitly name tradeoffs and choose based on system context, not generic best practices.
```

```text
Let architecturally significant qualities drive design decisions and verification.
```

```text
Design boundaries around cohesion, change patterns, and data ownership before choosing physical deployment.
```

```text
Do not distribute a system until service ownership, data ownership, and operational tradeoffs are justified.
```

```text
Convert important architecture decisions into lightweight checks that prevent drift.
```

```text
Record significant architecture decisions with context, alternatives, tradeoffs, and consequences.
```

```text
Architectural migrations should be incremental, measurable, compatible, and reversible.
```

```text
Any architecture recommendation that adds runtime components must include ownership, observability, and recovery implications.
```
