# Extracted Codex-Skill Training Material
## Source: _Refactoring: Improving the Design of Existing Code — Martin Fowler_

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

Primary domains:

```text
refactoring
code quality
testing
maintainability
legacy code
senior engineering judgment
```


---

# 1. Refactoring Means Behavior-Preserving Design Change

## Core teaching

Refactoring changes internal structure while preserving externally observable behavior. Codex should treat refactoring as design improvement, not as a chance to slip in feature changes, bug fixes, or contract changes.

## Codex trigger

Apply when asked to clean up code, simplify a module, reduce duplication, rename concepts, extract functions/classes, prepare for a feature, or improve maintainability without changing product behavior.

## Signals and smells

- Cleanup mixed with new behavior
- Large diff with unrelated transformations
- Public API or output changes during cleanup
- No tests protecting current behavior
- Refactor described only as “make it nicer”

## Desired Codex behavior

Codex should separate structural change from behavior change, make one small transformation at a time, and verify observable behavior before and after.

## Implementation guidance

- Identify public behavior and contracts first
- Add/run tests before structural changes
- Use small mechanical transformations
- Keep each refactor reversible
- Do behavior changes in a separate step

## Review guidance

- Is this truly behavior-preserving?
- Did any API, serialized shape, timing, ordering, or side effect change?
- Is the diff doing one kind of work?
- Could this be split smaller?

## Testing / verification guidance

- Existing tests before/after
- Characterization tests if coverage is weak
- Contract tests for public APIs
- Snapshot/golden-master tests for complex output

## Tradeoffs and cautions

In untested legacy areas, do not refactor broadly. Characterize behavior first and refactor only the protected area.

## Example transformation

Before: refactor billing and add a discount rule in one patch.

After: first characterize billing outputs, then extract calculation behavior-preservingly, then add the new discount rule with its own tests.

## Distilled skill rule

When refactoring, preserve observable behavior and separate structural changes from feature or bug-fix changes.


---

# 2. Use Code Smells as Triggers, Not Proofs

## Core teaching

Code smells are symptoms that invite investigation. They do not automatically prove that a refactor is needed.

## Codex trigger

Apply when seeing duplication, long functions, large classes, long parameter lists, switch statements, feature envy, shotgun surgery, data clumps, primitive obsession, or divergent change.

## Signals and smells

- Long methods with multiple responsibilities
- Same change needed in many places
- Similar code copied across workflows
- Classes that change for unrelated reasons
- Functions that use another object’s data more than their own

## Desired Codex behavior

Codex should identify the smell, explain the design pressure, and propose the smallest refactor that improves current changeability.

## Implementation guidance

- Name the practical smell
- Find the actual pain: duplication, coupling, change scattering, test difficulty
- Choose a proportional refactor
- Prefer domain-revealing names and boundaries

## Review guidance

- What smell is present?
- What change does it make harder?
- Does the refactor reduce coupling or just move code?
- Is it proportional?

## Testing / verification guidance

- Add tests before smell-driven changes
- Test duplicated variants before merging
- Run regression tests after each transformation

## Tradeoffs and cautions

Some duplication is safer than a wrong abstraction. Do not refactor unrelated smells during urgent work.

## Example transformation

Before: create a generic Validator framework because three blocks look similar.

After: test the three paths, confirm shared behavior, then extract one named validation function only if the rule is actually shared.

## Distilled skill rule

Treat code smells as investigation triggers; refactor only when the change reduces real complexity or risk.


---

# 3. Make Small, Composable Transformations

## Core teaching

Safe refactoring is built from small steps: extract function, rename, move function, inline variable, split phase, introduce parameter object, and similar behavior-preserving changes.

## Codex trigger

Apply when a refactor feels large, hard to review, or likely to break behavior.

## Signals and smells

- Massive cleanup PR
- Tests fail after many edits and cause is unclear
- Renaming, moving, rewriting, and formatting mixed together
- Codex wants to replace an entire algorithm to simplify it

## Desired Codex behavior

Codex should decompose refactoring into ordered micro-steps and verify after meaningful steps.

## Implementation guidance

- Extract before changing internals
- Rename to reveal intent
- Move behavior toward the owning concept
- Use compiler/tests after mechanical steps
- Keep transformations reversible

## Review guidance

- Could this step be smaller?
- Is each step behavior-preserving?
- Did tests pass between phases?
- Is the diff reviewable?

## Testing / verification guidance

- Run tests frequently
- Add focused tests for extracted behavior
- Use type checking/static analysis where available
- Compare before/after output for complex logic

## Tradeoffs and cautions

Small-step discipline should reduce risk, not create ceremony for trivial edits.

## Example transformation

Before: rewrite a 200-line pricing method into a new class in one jump.

After: extract named sub-calculations, test them, then introduce policy objects only after responsibilities are clear.

## Distilled skill rule

Refactor through small behavior-preserving transformations, verifying after each meaningful step.


---

# 4. Refactor Toward Clear Names and Explicit Concepts

## Core teaching

Names are design. Good names expose domain concepts, reduce explanatory comments, and make change safer.

## Codex trigger

Apply when names are vague, misleading, abbreviated, overloaded, or implementation-focused.

## Signals and smells

- `data`, `info`, `manager`, `helper`, `process`, `handle`
- Comments explaining what a name should say
- Boolean flags with unclear meaning
- Methods named by mechanism rather than business outcome

## Desired Codex behavior

Codex should rename toward domain intent and split overloaded concepts when useful.

## Implementation guidance

- Use business/domain vocabulary
- Rename before extracting when it clarifies intent
- Replace unclear booleans with named options/methods
- Avoid clever or overly generic names

## Review guidance

- Does the name reveal why this exists?
- Is it accurate after the refactor?
- Is a comment compensating for a weak name?
- Are two concepts sharing one name?

## Testing / verification guidance

- Use compiler/type checker after renames
- Run tests to catch dynamic references
- Add tests if renaming accompanies extraction or movement

## Tradeoffs and cautions

Renames can create noisy diffs. Avoid broad naming churn unless it materially improves current work or shared understanding.

## Example transformation

Before: `Calculate(x, y, flag)`.

After: `CalculateInvoiceTotal(invoice, pricingPolicy)`.

## Distilled skill rule

Use refactoring to make names reveal domain intent and remove ambiguity.


---

# 5. Extract Around Meaning, Not Just Length

## Core teaching

Extraction is useful when it names a concept, separates abstraction levels, or isolates change. Length alone is not enough.

## Codex trigger

Apply when a function mixes validation, calculation, persistence, formatting, I/O, orchestration, or multiple abstraction levels.

## Signals and smells

- Comments separating blocks
- Deep nesting
- Function name says one thing but body does many
- Hard to test one branch without running everything

## Desired Codex behavior

Codex should extract coherent behavior with a name that explains purpose, avoiding meaningless tiny fragments.

## Implementation guidance

- Extract around conceptual steps
- Keep inputs/outputs explicit
- Avoid excessive parameter lists
- Prefer pure extracted functions for calculations
- Keep orchestration readable

## Review guidance

- Does the extracted function have a meaningful name?
- Does it reduce cognitive load?
- Did extraction change side effects or order?
- Can it be tested more easily?

## Testing / verification guidance

- Existing tests pass unchanged
- Add unit tests for extracted pure logic when useful
- Characterize risky code before extraction

## Tradeoffs and cautions

Too many tiny functions can scatter logic. Extraction should improve readability, testability, or changeability.

## Example transformation

Before: `SubmitRegistration` validates input, calculates fees, saves records, emails, and formats response.

After: it orchestrates named steps: validate, calculate fees, save, queue confirmation.

## Distilled skill rule

Extract functions around meaningful concepts and abstraction boundaries, not merely because code is long.


---

# 6. Manage Duplication with Careful Abstraction

## Core teaching

Duplication is a signal, but the wrong abstraction is worse than duplication. Codex should confirm duplicated behavior truly represents one concept before merging it.

## Codex trigger

Apply when similar logic appears in multiple places or a bug fix requires repeated patches.

## Signals and smells

- Copy-pasted calculations
- Repeated conditionals
- Similar DTO mapping code
- Multiple workflows implementing rules differently

## Desired Codex behavior

Codex should distinguish true semantic duplication from similar-looking but different domain rules.

## Implementation guidance

- Test each duplicate path first
- Compare edge cases
- Extract a named domain concept when sameness is real
- Keep variants separate when rules differ

## Review guidance

- Are these duplicates semantically the same?
- What varies?
- Will future changes become simpler?
- Are all previous variants covered?

## Testing / verification guidance

- Characterization tests for each duplicate path
- Edge-case tests before/after extraction
- Regression tests for previous bug patterns

## Tradeoffs and cautions

Duplication across unstable domains may be cheaper than an abstraction that hides important differences.

## Example transformation

Before: merge student billing and staff billing because both calculate discounts.

After: test both paths, extract only the truly shared percentage calculation, and keep domain-specific policies separate.

## Distilled skill rule

Remove duplication only after confirming the shared code represents the same domain concept.


---

# 7. Use Preparatory Refactoring

## Core teaching

Sometimes the best way to add a feature is to first reshape code so the feature has an obvious home. Preparatory refactoring should be small and justified by the upcoming change.

## Codex trigger

Apply when a feature would otherwise require invasive edits, scattered conditionals, or copy-paste.

## Signals and smells

- New feature requires editing many branches
- No clear owner for behavior
- Business rule hidden in controller/UI/database layer
- Feature would make a bad method worse

## Desired Codex behavior

Codex should perform the smallest behavior-preserving refactor that makes the feature straightforward.

## Implementation guidance

- Identify desired change point
- Extract or move behavior to create a natural home
- Verify before adding feature
- Add feature in separate step

## Review guidance

- Does this prep directly enable the feature?
- Is it behavior-preserving?
- Did Codex avoid speculative redesign?

## Testing / verification guidance

- Run tests after preparatory refactor
- Add characterization tests before risky reshaping
- Add new behavior tests after prep is complete

## Tradeoffs and cautions

Stop once the next change is easy enough; do not gold-plate.

## Example transformation

Before: add a fourth shipping rule by extending a long if/else block.

After: extract existing shipping rules into named policies, verify behavior, then add the new rule as one policy.

## Distilled skill rule

Before adding a feature to awkward code, perform only the smallest behavior-preserving refactor that gives the feature a clear home.


---

# 8. Keep Public Contracts Stable

## Core teaching

Refactoring changes internals, not external contracts. Codex must avoid accidental API, database, message, or UI behavior changes during cleanup.

## Codex trigger

Apply when moving code, renaming public methods, changing DTOs, splitting classes, or altering exported behavior.

## Signals and smells

- Endpoint response changes during cleanup
- Public method renamed without adapter
- Serialized/event shape changed during refactor
- Database field changed with no migration plan

## Desired Codex behavior

Codex should treat public contracts as behavior. Contract changes require explicit compatibility/migration planning.

## Implementation guidance

- Preserve public signatures during internal refactor
- Add adapters/delegates during transitions
- Keep serialization formats stable
- Document intentional breaking changes separately

## Review guidance

- Is this contract public or persisted?
- Do old callers still work?
- Is there a migration path?
- Are contract tests present?

## Testing / verification guidance

- Contract tests
- Snapshot tests for API responses where useful
- Backward compatibility tests
- Consumer integration tests

## Tradeoffs and cautions

Improving a public contract is not refactoring alone; it is a separate compatibility task.

## Example transformation

Before: rename API field `name` to `fullName` as cleanup.

After: internally rename variables but preserve API field; add `fullName` compatibly only through a staged contract change.

## Distilled skill rule

During refactoring, preserve public and persisted contracts unless a separate migration plan exists.


---

# Compression Candidates for Future `SKILL.md`

```text
When refactoring, preserve observable behavior and separate structural changes from feature or bug-fix changes.
```

```text
Treat code smells as investigation triggers; refactor only when the change reduces real complexity or risk.
```

```text
Refactor through small behavior-preserving transformations, verifying after each meaningful step.
```

```text
Use refactoring to make names reveal domain intent and remove ambiguity.
```

```text
Extract functions around meaningful concepts and abstraction boundaries, not merely because code is long.
```

```text
Remove duplication only after confirming the shared code represents the same domain concept.
```

```text
Before adding a feature to awkward code, perform only the smallest behavior-preserving refactor that gives the feature a clear home.
```

```text
During refactoring, preserve public and persisted contracts unless a separate migration plan exists.
```
