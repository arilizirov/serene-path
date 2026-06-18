# Extracted Codex-Skill Training Material
## Source: _Working Effectively with Legacy Code_ — Michael C. Feathers

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

Primary domains:

```text
legacy code
refactoring
testing
debugging
architecture
senior engineering judgment
risk management
maintainability
```

The central engineering concern of this source is: how to make safe, valuable changes in code that is difficult to understand, difficult to test, and risky to modify.

---

# 1. Legacy Code Means Code Without Safety

## Core teaching

The useful engineering definition of legacy code is not merely “old code.” Legacy code is code that is hard to change safely because it lacks fast, reliable tests and clear seams.

The judgment being taught is:

```text
Do not treat risky existing code like greenfield code. First create safety.
```

## Codex trigger

Apply this when Codex is:

- modifying existing code without tests
- touching unfamiliar modules
- changing business-critical behavior
- refactoring a large class or function
- fixing bugs in tangled code
- adding features to old code
- working in code with unclear dependencies
- asked to “clean up” a messy codebase

## Signals and smells

Codex should notice:

- no tests around the area being changed
- tests exist but are slow, brittle, or integration-heavy
- code is difficult to instantiate
- functions/classes depend directly on database, filesystem, network, time, globals, or UI
- large methods with many branches
- unclear side effects
- hidden coupling
- fear of making changes
- “just rewrite it” instinct
- no clear way to verify behavior

## Desired Codex behavior

Codex should shift from “make the change directly” to:

```text
understand the change point, create a safety net, then make the smallest safe change.
```

Codex should not perform broad refactors in untested legacy code unless it first creates protection.

## Implementation guidance

Codex should:

- identify the exact change point
- avoid unnecessary edits outside that area
- add characterization tests where behavior is unclear
- introduce seams only as needed
- make minimal dependency-breaking changes
- preserve current behavior before improving design
- refactor only after tests protect the area
- keep changes small and reviewable

## Review guidance

Codex should ask:

- What behavior are we trying to preserve?
- What is the smallest area that must change?
- Is there a test protecting this behavior?
- If not, can we add a characterization test first?
- What dependencies prevent testing?
- Can we introduce a seam with minimal change?
- Are we refactoring without safety?

## Testing / verification guidance

Codex should recommend:

- characterization tests
- regression tests around the bug/feature
- narrow unit tests after breaking dependencies
- approval/golden-master tests for complex output
- integration tests only where unit-level isolation is not yet practical
- before/after behavior checks

## Tradeoffs and cautions

Do not stop all progress until the whole system is tested. Legacy code strategy is incremental. Codex should build “islands of safety” around the code being changed.

## Example transformation

**Before:**

```text
Codex rewrites a 900-line service because it is messy.
```

**After:**

```text
Codex identifies the method that must change, adds characterization tests around its current behavior, introduces one seam to isolate a database dependency, makes the requested change, then refactors only the covered portion.
```

## Distilled skill rule

When changing legacy code, create a local safety net before making behavioral or structural changes.

---

# 2. Identify the Change Point First

## Core teaching

Before editing legacy code, find where the required behavior actually needs to change. In legacy systems, the obvious place is not always the safest or smallest place.

The senior judgment is:

```text
Change as little unprotected code as possible.
```

## Codex trigger

Apply this when Codex receives:

- a bug fix request
- a feature request in existing code
- a vague “modify this workflow” task
- a request touching multiple modules
- a request where business behavior is spread across the codebase

## Signals and smells

Codex should notice:

- many files appear related
- business logic duplicated in several places
- unclear ownership of behavior
- temptation to refactor first
- broad search results across codebase
- multiple possible insertion points
- no tests around any candidate area

## Desired Codex behavior

Codex should locate the most direct and least risky place to make the change, then work outward only if necessary.

## Implementation guidance

Codex should:

- trace the execution path for the requested behavior
- identify the smallest code region that controls the behavior
- prefer the change point that minimizes untested edits
- avoid “drive-by” cleanup outside the target area
- record assumptions if behavior is unclear
- add tests at or near the change point where possible

## Review guidance

Codex should ask:

- Where is the actual behavior produced?
- Which code path is used in production?
- Are there duplicate paths?
- Is this the smallest safe change point?
- What would be affected by changing this location?
- Are we editing more code than necessary?

## Testing / verification guidance

Codex should recommend:

- tests that exercise the identified change point
- regression test reproducing the bug or feature expectation
- call-path verification for important workflows
- tests for duplicate or alternative paths if they exist

## Tradeoffs and cautions

The cleanest architectural location may require too much risky setup at first. Codex may choose a less elegant but safer change point initially, then improve structure once tests exist.

## Example transformation

**Before:**

```text
Request: add discount rule.
Codex restructures the whole billing module.
```

**After:**

```text
Codex traces where final invoice totals are calculated, adds characterization tests for current totals, inserts the discount rule at the narrowest safe point, and leaves broader cleanup for a separate protected refactor.
```

## Distilled skill rule

Before editing legacy code, locate the smallest safe change point that controls the requested behavior.

---

# 3. Find an Inflection Point

## Core teaching

An inflection point is a place where tests can cover the behavior affected by a change. It may be above or around the exact change point, depending on what can be tested.

The judgment being taught is:

```text
When direct unit testing is hard, test at the nearest useful boundary that gives protection.
```

## Codex trigger

Apply this when:

- the exact code to change is hard to instantiate
- dependencies make direct testing impractical
- the change point is buried deep in a call chain
- adding a direct unit test would require too many risky edits
- the system lacks seams

## Signals and smells

Codex should notice:

- constructor requires many real dependencies
- method depends on database/network/filesystem
- UI and business logic are mixed
- static/global calls block isolation
- deep call chains
- code only reachable through a larger workflow

## Desired Codex behavior

Codex should seek a practical testing boundary that gives enough confidence without requiring a full rewrite.

## Implementation guidance

Codex should:

- identify callers and callees around the change point
- choose a test boundary that can be exercised with minimal setup
- use characterization tests if expected behavior is unclear
- introduce seams only where necessary to make the boundary testable
- avoid excessive mocking of every internal detail

## Review guidance

Codex should ask:

- Where can we observe this behavior?
- What boundary gives useful protection?
- Is direct unit testing possible without major surgery?
- Can an outer-level test protect the change temporarily?
- Are we testing behavior rather than implementation trivia?

## Testing / verification guidance

Codex should recommend:

- characterization tests at the nearest feasible boundary
- integration-style tests only if they are reliable enough
- unit tests after seams are introduced
- golden-master tests for complex output behavior
- regression tests for the requested change

## Tradeoffs and cautions

Tests at higher boundaries can be slower and less precise, but they may be the best first safety net. Codex should later narrow tests when seams make isolation possible.

## Example transformation

**Before:**

```text
Codex cannot unit test a calculation because it is buried in a controller that also queries the database and sends email, so it changes the code without tests.
```

**After:**

```text
Codex first adds a characterization test through the controller/service boundary using a test database or fake adapter, then extracts the calculation into a testable unit once behavior is protected.
```

## Distilled skill rule

If the exact change point is hard to test, cover the nearest practical inflection point before changing behavior.

---

# 4. Characterization Tests Capture Current Behavior

## Core teaching

When code is poorly understood, tests should first capture what it currently does, not what someone guesses it should do. These tests protect existing behavior while allowing safe refactoring or targeted changes.

## Codex trigger

Apply this when:

- expected behavior is unclear
- code has no tests
- bug fixes risk breaking hidden behavior
- refactoring legacy code
- output is complex
- many branches exist
- old behavior may be relied on by users

## Signals and smells

Codex should notice:

- “I think this is supposed to...”
- no written requirements
- complicated conditionals
- weird edge cases
- fragile business logic
- fear of changing code
- large existing outputs, reports, files, or calculations
- tests would require reverse-engineering expected behavior

## Desired Codex behavior

Codex should write tests that document current observable behavior before changing it.

## Implementation guidance

Codex should:

- run or inspect current behavior
- create tests for representative inputs
- include edge cases discovered in code
- assert existing outputs, even if awkward
- label suspicious behavior rather than silently “fixing” it
- separate characterization tests from new expected-behavior tests
- update/add tests deliberately when changing behavior

## Review guidance

Codex should ask:

- What does the code currently do?
- Is this current behavior relied upon?
- Are we changing behavior intentionally or accidentally?
- Do tests distinguish old behavior from the new requested behavior?
- Did we capture edge cases before refactoring?

## Testing / verification guidance

Codex should recommend:

- characterization tests for current behavior
- golden-master tests for complex output
- approval tests for generated files/text/reports
- regression tests for known bugs
- targeted new tests for intentional behavior changes

## Tradeoffs and cautions

Characterization tests can preserve bad behavior. Codex should mark suspicious behavior and distinguish “preserve for now” from “this is correct forever.”

## Example transformation

**Before:**

```text
Codex sees strange tax rounding and changes it to look cleaner.
```

**After:**

```text
Codex adds characterization tests for current rounding, confirms the requested change, then updates tests only where behavior is intentionally changed.
```

## Distilled skill rule

Before refactoring unclear legacy behavior, characterize what the code currently does.

---

# 5. Break Dependencies with Seams

## Core teaching

A seam is a place where behavior can be changed without editing the code at that point. Seams allow tests to replace hard dependencies with controlled alternatives.

The key judgment is:

```text
Make code testable by introducing the smallest seam that isolates the problematic dependency.
```

## Codex trigger

Apply this when code depends directly on:

- databases
- network calls
- filesystem
- clocks/time
- random values
- environment variables
- static/global methods
- UI frameworks
- hard-to-construct objects
- singletons
- external services

## Signals and smells

Codex should notice:

- code cannot run without real infrastructure
- tests require production configuration
- constructors do real work
- static calls hide dependencies
- time/randomness makes tests nondeterministic
- object creation is hardcoded inside logic
- logic and I/O are mixed

## Desired Codex behavior

Codex should introduce test seams that allow behavior to be exercised without real infrastructure.

## Implementation guidance

Codex should:

- prefer dependency injection for new or touched code
- introduce interfaces/adapters only where useful
- wrap static/global/external dependencies
- pass time/randomness through abstractions when needed
- use subclassing or override seams when safer in legacy code
- avoid large architectural rewrites just to create one seam
- keep the seam close to the dependency being controlled

## Review guidance

Codex should ask:

- What dependency prevents testing?
- Can it be replaced in a test?
- What is the smallest seam needed?
- Are we introducing abstractions for a real testability problem?
- Does the seam reduce risk or add noise?

## Testing / verification guidance

Codex should recommend:

- tests using fake/stub dependencies
- tests for logic without real infrastructure
- one integration test for the real adapter if needed
- deterministic tests for time/random behavior

## Tradeoffs and cautions

Do not wrap every dependency automatically. A seam is valuable when it enables testing or reduces coupling in an area being changed.

## Example transformation

**Before:**

```csharp
public decimal CalculateTotal(int familyId)
{
    var family = Database.LoadFamily(familyId);
    return family.Invoices.Sum(i => i.Amount) - family.Payments.Sum(p => p.Amount);
}
```

**After:**

```csharp
public decimal CalculateTotal(Family family)
{
    return family.Invoices.Sum(i => i.Amount) - family.Payments.Sum(p => p.Amount);
}
```

Then database loading remains outside the calculation and the calculation can be tested directly.

## Distilled skill rule

When a dependency blocks testing, introduce the smallest useful seam to replace it under test.

---

# 6. The Legacy Code Change Algorithm

## Core teaching

Legacy changes should follow a disciplined sequence:

```text
identify change points → find test boundary → break dependencies → write tests → make change → refactor covered code
```

The order matters. Refactoring before protection increases risk.

## Codex trigger

Apply this whenever Codex modifies untested or poorly tested existing code.

## Signals and smells

Codex should notice:

- urge to clean code before tests
- no fast feedback loop
- large unreviewable diff
- refactor mixed with behavior change
- no clear rollback of change
- many unrelated files modified
- tests added only after implementation

## Desired Codex behavior

Codex should explicitly follow a safe-change workflow.

## Implementation guidance

Codex should:

- keep behavior-preserving setup separate from behavior changes
- add tests before risky edits
- make dependency-breaking changes minimal
- make requested behavior change after tests exist
- refactor only the code now under test
- keep commits/patches logically separated if possible

## Review guidance

Codex should ask:

- Were tests added before the behavior change?
- Are refactors separated from behavior changes?
- Is the diff small enough to review?
- Does every structural change support testability or the requested change?
- Did we leave unrelated code alone?

## Testing / verification guidance

Codex should recommend:

- pre-change characterization tests
- post-change behavior tests
- regression tests for the bug/feature
- full relevant test suite after refactor
- manual verification only as a fallback, not the only safety net

## Tradeoffs and cautions

In emergencies, Codex may need to make a minimal direct fix first. Even then, it should add a regression test immediately after and avoid broad cleanup.

## Example transformation

**Before:**

```text
Codex changes logic, renames methods, extracts classes, and fixes formatting in one patch.
```

**After:**

```text
Patch 1: add characterization tests.
Patch 2: introduce one seam.
Patch 3: implement behavior change.
Patch 4: refactor covered code.
```

## Distilled skill rule

In legacy code, separate safety-building, behavior change, and refactoring into distinct steps.

---

# 7. Sprout Method and Sprout Class

## Core teaching

When existing code is too risky to modify deeply, add new behavior in new tested code and call it from the legacy code. This minimizes changes to dangerous areas.

## Codex trigger

Apply this when:

- adding a feature to very tangled code
- the existing method/class is huge and untested
- direct modification would require broad understanding
- time is limited
- the new behavior can be isolated
- legacy code must remain mostly untouched

## Signals and smells

Codex should notice:

- large method with many unrelated responsibilities
- no tests
- difficult setup
- new behavior is separable
- changing existing code risks many side effects
- code owner/user wants minimal risk

## Desired Codex behavior

Codex should implement new logic in a small, tested unit and insert a minimal call from legacy code.

## Implementation guidance

Codex should:

- create a new function/class for the new behavior
- unit test the new code independently
- pass only necessary data into the new code
- keep the insertion point minimal
- avoid moving existing logic unless protected
- later refactor surrounding code once tests exist

## Review guidance

Codex should ask:

- Can the new behavior be written separately?
- Is the insertion point minimal?
- Does the new code have tests?
- Are we avoiding risky edits to unprotected logic?
- Is this a temporary bridge or a permanent boundary?

## Testing / verification guidance

Codex should recommend:

- focused tests for the sprouted code
- one integration/characterization test around the insertion point
- regression tests for the legacy workflow

## Tradeoffs and cautions

Sprouting can increase duplication or leave awkward structure. It is a risk-reduction tactic, not always ideal final design. Codex should consider later refactoring once coverage improves.

## Example transformation

**Before:**

```text
Add new invoice discount logic directly inside a 700-line GenerateInvoice method.
```

**After:**

```text
Create tested DiscountCalculator. Insert one call from GenerateInvoice. Leave broader invoice refactor for later.
```

## Distilled skill rule

When legacy code is too risky to edit deeply, sprout new tested code and connect it with the smallest possible change.

---

# 8. Wrap Method and Wrap Class

## Core teaching

When behavior must be added before or after existing behavior, wrapping can avoid changing the core legacy logic directly.

## Codex trigger

Apply this when:

- new behavior surrounds old behavior
- legacy method is risky to edit
- adding logging, validation, notification, authorization, or orchestration
- existing behavior should remain unchanged
- a caller can be redirected to a wrapper

## Signals and smells

Codex should notice:

- need to add pre/post behavior
- existing method is untested
- direct edits would be invasive
- old behavior can be called as-is
- caller boundary is easier to change than internals

## Desired Codex behavior

Codex should consider wrapping the legacy behavior instead of modifying it directly.

## Implementation guidance

Codex should:

- create a wrapper method/class
- call existing behavior from wrapper
- add new behavior before/after
- keep wrapper testable
- avoid duplicating legacy internals
- ensure error handling and transaction boundaries remain correct

## Review guidance

Codex should ask:

- Is this behavior additive around existing behavior?
- Can we preserve old method untouched?
- Are callers routed through the wrapper safely?
- Does wrapping change transaction/error semantics?
- Is the wrapper tested?

## Testing / verification guidance

Codex should recommend:

- tests for wrapper behavior
- tests verifying old behavior is still called
- error-path tests
- regression tests around original workflow

## Tradeoffs and cautions

Too many wrappers can make call paths confusing. Codex should use wrapping when it clearly reduces risk or separates concerns.

## Example transformation

**Before:**

```text
Modify legacy SaveOrder method to add audit logging in the middle of complex logic.
```

**After:**

```text
Create AuditedOrderSaver that validates/logs, calls SaveOrder, then records audit result. Test wrapper behavior separately.
```

## Distilled skill rule

When adding behavior around risky legacy logic, wrap the old behavior instead of rewriting it.

---

# 9. Pinch Points and Effect Sketches

## Core teaching

To understand legacy systems, trace how effects flow through the code. Pinch points are places where many effects converge, making them useful points for testing or intervention.

## Codex trigger

Apply this when:

- code behavior is hard to understand
- a change appears to affect many places
- side effects are spread through the system
- there are many callers or branches
- tests need maximum coverage with minimum effort

## Signals and smells

Codex should notice:

- tangled call graph
- many paths through same method
- unclear side effects
- repeated logic
- one method/class used by many workflows
- hard-to-predict impact of change

## Desired Codex behavior

Codex should map the relevant effect path before editing.

## Implementation guidance

Codex should:

- identify inputs, outputs, and side effects
- trace callers and callees around the change
- find convergence points for tests
- add characterization tests at high-value pinch points
- avoid editing before understanding the effect path
- document risk when the call graph is uncertain

## Review guidance

Codex should ask:

- What code paths reach this behavior?
- Where do the effects converge?
- Which tests give the broadest protection?
- What side effects must be preserved?
- Are we missing a caller path?

## Testing / verification guidance

Codex should recommend:

- characterization tests at pinch points
- tests for each major caller category
- side-effect verification tests
- golden-master tests for broad outputs where useful

## Tradeoffs and cautions

Do not spend forever mapping the whole system. Codex should sketch enough to make the current change safer.

## Example transformation

**Before:**

```text
Codex changes a shared price calculation function without checking who calls it.
```

**After:**

```text
Codex identifies checkout, reporting, refund, and admin preview callers, adds tests for representative paths, then makes the calculation change.
```

## Distilled skill rule

Before changing tangled legacy behavior, trace effect paths and test at high-value convergence points.

---

# 10. Separate Refactoring from Feature Work

## Core teaching

Legacy work often mixes three different activities: understanding, refactoring, and changing behavior. Mixing them in one uncontrolled patch creates risk.

## Codex trigger

Apply this when:

- adding features to messy code
- fixing bugs while noticing cleanup opportunities
- performing architecture cleanup
- renaming/extracting/moving code
- large diffs start forming

## Signals and smells

Codex should notice:

- behavior change and formatting mixed together
- many files changed for a small request
- tests fail and it is unclear why
- broad cleanup unrelated to task
- refactor justified only because “code looked bad”
- no before/after behavior protection

## Desired Codex behavior

Codex should keep changes small, sequential, and purpose-specific.

## Implementation guidance

Codex should:

- first add tests
- then make behavior change
- then refactor covered code
- avoid unrelated cleanup
- preserve public behavior during refactor
- make mechanical refactors separately from semantic changes
- clearly state when behavior changes intentionally

## Review guidance

Codex should ask:

- Is this patch doing more than one kind of work?
- Can this refactor be separated?
- Are behavior changes clearly identified?
- Is every cleanup necessary for this task?
- Are tests proving behavior was preserved?

## Testing / verification guidance

Codex should recommend:

- run tests after each phase
- characterization tests before refactor
- regression tests after behavior change
- review diff by phase where possible

## Tradeoffs and cautions

Sometimes small refactors are necessary to make the feature possible. Codex should do only the minimal enabling refactor before tests, then deeper cleanup after coverage exists.

## Example transformation

**Before:**

```text
One patch: rename classes, move files, alter API, change billing behavior, reformat whole module.
```

**After:**

```text
Patch 1: add characterization tests.
Patch 2: minimal extraction to create seam.
Patch 3: billing behavior change.
Patch 4: optional cleanup of now-covered code.
```

## Distilled skill rule

Do not mix broad refactoring with behavior change in unprotected legacy code.

---

# 11. Preserve Behavior First, Improve Design Second

## Core teaching

In legacy systems, design improvement is safest after current behavior is protected. Tests convert fear into feedback.

## Codex trigger

Apply this when:

- user asks for cleanup/refactor
- code is messy but untested
- Codex wants to restructure
- a bug fix requires touching poor design
- a large method/class is being changed

## Signals and smells

Codex should notice:

- “this code is terrible, rewrite it”
- no tests
- complex behavior hidden in messy structure
- many edge cases
- unclear requirements
- production behavior may depend on quirks

## Desired Codex behavior

Codex should preserve observable behavior before changing internal structure.

## Implementation guidance

Codex should:

- add characterization tests
- avoid changing outputs, timing, side effects, or error behavior accidentally
- refactor in small steps
- run tests after each transformation
- keep public API stable unless change is explicit
- improve names, extraction, and structure only after coverage

## Review guidance

Codex should ask:

- What behavior is protected?
- Are we sure this is behavior-preserving?
- Could any user-visible behavior change?
- Did tests run before and after?
- Are we relying on subjective cleanliness instead of verified safety?

## Testing / verification guidance

Codex should recommend:

- characterization tests
- before/after snapshot comparison
- contract tests for public APIs
- regression tests for edge cases
- mutation or branch coverage checks where useful

## Tradeoffs and cautions

Some bad behavior should be intentionally changed. Codex must distinguish accidental behavior changes from deliberate fixes.

## Example transformation

**Before:**

```text
Codex “simplifies” conditional logic and accidentally changes an edge-case fee calculation.
```

**After:**

```text
Codex captures edge-case fee behavior in tests, refactors conditionals step by step, then changes the fee rule only if explicitly required.
```

## Distilled skill rule

In legacy refactoring, protect current behavior before improving internal design.

---

# 12. Work Around Hard-to-Test Constructors and Globals

## Core teaching

Legacy code often hides dependencies in constructors, globals, static calls, and singletons. These make tests hard because creating the object triggers infrastructure or complex setup.

## Codex trigger

Apply this when Codex sees:

- constructors doing database/network/file work
- global state
- singletons
- static service locators
- environment reads deep in logic
- hidden dependency creation
- hard-coded timestamps/randomness

## Signals and smells

Codex should notice:

- tests cannot instantiate class
- constructor has side effects
- object creation is expensive or flaky
- hidden dependencies not visible in method signature
- static calls prevent substitution
- global state leaks across tests

## Desired Codex behavior

Codex should make dependencies explicit enough to test the behavior being changed.

## Implementation guidance

Codex should:

- move side effects out of constructors where feasible
- introduce injectable dependencies for touched code
- wrap static/global calls behind adapters if needed
- pass clock/random/config dependencies explicitly where useful
- avoid sweeping dependency injection rewrites
- isolate global state in tests and reset it if unavoidable

## Review guidance

Codex should ask:

- What happens when this object is constructed?
- Can this class be created in a test?
- What hidden dependencies does it use?
- Can we pass the dependency instead of creating it internally?
- Does global state make tests order-dependent?

## Testing / verification guidance

Codex should recommend:

- constructor-free logic tests
- tests using fake dependencies
- global state reset tests if unavoidable
- integration tests for real adapters
- deterministic tests for time/random values

## Tradeoffs and cautions

Do not refactor the entire dependency graph just to test one small behavior. Add the narrowest seam needed.

## Example transformation

**Before:**

```csharp
public ReportGenerator()
{
    _connection = new SqlConnection(Environment.GetEnvironmentVariable("PROD_DB"));
    _connection.Open();
}
```

**After:**

```csharp
public ReportGenerator(IReportDataSource dataSource)
{
    _dataSource = dataSource;
}
```

The real SQL data source is tested separately; report formatting can now be tested with a fake.

## Distilled skill rule

Make hidden dependencies explicit when they block safe testing or change.

---

# 13. Add Tests at the Right Speed and Level

## Core teaching

Legacy code cannot usually be fully tested all at once. The goal is to add enough fast, reliable feedback around the area being changed.

## Codex trigger

Apply this when:

- test coverage is low
- existing tests are slow or flaky
- code depends on infrastructure
- user asks for a focused bug fix
- large legacy module lacks tests

## Signals and smells

Codex should notice:

- test suite takes too long for feedback
- tests require database/network for simple logic
- too many mocks of internals
- no tests around changed behavior
- test setup is larger than the behavior under test
- only manual QA protects the change

## Desired Codex behavior

Codex should add targeted tests that reduce change risk without trying to test the entire system at once.

## Implementation guidance

Codex should:

- prefer fast tests for logic once seams exist
- use characterization tests when logic is unclear
- use integration tests when boundaries cannot yet be isolated
- keep tests focused on behavior
- avoid over-mocking implementation details
- add regression tests for every fixed bug
- build coverage incrementally around changed areas

## Review guidance

Codex should ask:

- Does this test protect the change?
- Is this test fast and reliable enough to run often?
- Is it too coupled to implementation details?
- Is there a smaller boundary we can test?
- Are we adding coverage where we touched code?

## Testing / verification guidance

Codex should recommend:

- narrow behavior tests
- characterization tests before refactor
- regression tests after bug fixes
- integration tests for infrastructure boundaries
- smoke tests for critical workflows

## Tradeoffs and cautions

In legacy systems, some initial tests may be ugly. Codex should prefer imperfect but useful protection over no protection, while avoiding brittle tests that block future improvements.

## Example transformation

**Before:**

```text
Codex adds a giant end-to-end test for one calculation bug because direct testing is hard.
```

**After:**

```text
Codex first adds a characterization test through an available service boundary, then extracts the calculation behind a seam and adds fast unit tests.
```

## Distilled skill rule

Add the smallest useful tests that protect the change and improve future changeability.

---

# 14. Avoid Full Rewrites as the Default

## Core teaching

Rewriting legacy systems is expensive, risky, and often underestimates hidden behavior. Incremental change is usually safer unless the system is beyond economical repair or the requirements have fundamentally changed.

## Codex trigger

Apply this when:

- user asks to rewrite a messy module
- Codex sees bad design
- code lacks tests
- migration/replatforming is proposed
- architecture seems obsolete
- “start over” feels attractive

## Signals and smells

Codex should notice:

- rewrite proposed without behavior inventory
- no migration plan
- hidden business rules in old code
- no parallel validation
- no staged rollout
- feature work would stop for long period
- new system likely to repeat old mistakes

## Desired Codex behavior

Codex should prefer incremental strangling, sprouting, wrapping, and coverage-building over full rewrite by default.

## Implementation guidance

Codex should:

- identify valuable seams for incremental replacement
- preserve old behavior through characterization tests
- replace one workflow/module at a time
- run old and new paths in parallel where useful
- compare outputs before cutover
- maintain rollback options
- document migration stages

## Review guidance

Codex should ask:

- Why is rewrite necessary?
- What behavior must be preserved?
- How will old and new systems coexist?
- What is the cutover plan?
- How will correctness be verified?
- What is the rollback path?
- Can we achieve value incrementally?

## Testing / verification guidance

Codex should recommend:

- characterization tests for old behavior
- parallel-run comparison tests
- migration tests
- cutover smoke tests
- rollback tests
- output equivalence tests

## Tradeoffs and cautions

Sometimes rewrite is justified: obsolete platform, impossible constraints, security risk, or fundamentally changed requirements. Codex should require explicit justification and a migration plan.

## Example transformation

**Before:**

```text
Rewrite the entire billing system because the code is ugly.
```

**After:**

```text
Identify invoice calculation as a seam. Characterize current outputs. Build new calculation module. Run old/new outputs side by side. Gradually route traffic to the new module.
```

## Distilled skill rule

Do not default to rewrites; prefer incremental replacement with tests, seams, and staged migration.

---

# 15. Use Golden Master / Approval Testing for Complex Outputs

## Core teaching

When legacy code produces complex output that is hard to assert manually, capture current output and compare future output against it.

## Codex trigger

Apply this when code produces:

- reports
- generated documents
- HTML
- PDFs
- exports
- invoices
- formatted text
- serialized payloads
- large calculations
- complex transformations

## Signals and smells

Codex should notice:

- output has many fields/lines
- manually writing assertions would be tedious
- expected behavior is unclear
- refactor must preserve complex output
- small formatting changes may matter
- existing users rely on output quirks

## Desired Codex behavior

Codex should use approval/golden-master style tests to capture current behavior before refactoring or replacing complex output generation.

## Implementation guidance

Codex should:

- generate representative outputs
- store approved snapshots carefully
- normalize nondeterministic values like timestamps/IDs
- compare output after changes
- review diffs intentionally
- add focused tests for new rules after characterization

## Review guidance

Codex should ask:

- Is the output too complex for normal assertions?
- Are nondeterministic values normalized?
- Is the approved output representative?
- Are output diffs reviewed intentionally?
- Are we preserving or intentionally changing output?

## Testing / verification guidance

Codex should recommend:

- golden-master tests
- snapshot/approval tests
- fixture-based input coverage
- diff review workflow
- targeted assertions for critical fields

## Tradeoffs and cautions

Snapshot tests can become noisy or lock in bad formatting. Codex should use them for broad safety, then add focused tests for important behavior.

## Example transformation

**Before:**

```text
Codex refactors invoice PDF generation without tests because asserting the PDF is hard.
```

**After:**

```text
Codex creates representative invoice fixtures, captures normalized generated output, refactors generation, and compares output diffs.
```

## Distilled skill rule

For complex legacy output, use golden-master tests to protect behavior before changing internals.

---

# 16. Understand Before Abstracting

## Core teaching

Legacy code often contains hidden domain knowledge. Premature abstraction can erase important differences or preserve the wrong boundary.

## Codex trigger

Apply this when Codex sees:

- duplicated code in legacy system
- similar workflows with subtle differences
- large conditionals
- repeated calculations
- old modules with unclear business rules
- pressure to “DRY it up”

## Signals and smells

Codex should notice:

- duplication with subtle variations
- unclear reason for differences
- comments or conditionals tied to historical cases
- business rules embedded in code shape
- refactor would merge paths without tests
- names do not reveal domain meaning

## Desired Codex behavior

Codex should first characterize and understand differences before abstracting.

## Implementation guidance

Codex should:

- add tests around each duplicated path
- identify true common behavior versus accidental similarity
- use domain names for abstractions
- avoid generic helper abstractions too early
- preserve distinct business cases when needed
- refactor duplication only after behavior is protected

## Review guidance

Codex should ask:

- Are these duplicates truly the same?
- What differences matter?
- Do tests cover each variant?
- Does the new abstraction express domain meaning?
- Are we hiding business rules behind generic code?

## Testing / verification guidance

Codex should recommend:

- characterization tests for each duplicated path
- equivalence tests only where behavior should match
- edge-case tests for known differences
- regression tests after abstraction

## Tradeoffs and cautions

Some duplication is cheaper than a bad abstraction, especially in unclear legacy systems. Codex should not force DRY at the cost of clarity or correctness.

## Example transformation

**Before:**

```text
Codex merges student billing and staff billing because both calculate discounts.
```

**After:**

```text
Codex tests both paths, discovers different rounding and eligibility rules, extracts only the truly shared percentage calculation while keeping domain-specific policies separate.
```

## Distilled skill rule

Do not abstract legacy duplication until tests reveal which differences are intentional.

---

# 17. Make Bugs Safer by Reproducing Them First

## Core teaching

Bug fixing in legacy code should start by reproducing the bug in a test or reliable scenario. The bug test becomes a permanent guard against regression.

## Codex trigger

Apply this when:

- fixing a reported bug
- changing unclear behavior
- bug appears in production only
- symptoms are vague
- user says “this used to work”
- legacy code has no tests

## Signals and smells

Codex should notice:

- code changed based on guesswork
- no failing test
- bug cannot be reproduced
- fix touches broad logic
- no regression test after fix
- multiple changes made before verifying cause

## Desired Codex behavior

Codex should reproduce the failure before fixing, or clearly state when it cannot.

## Implementation guidance

Codex should:

- create a failing test or minimal repro
- isolate input/state that triggers the bug
- make the smallest fix
- verify the test passes
- add related edge-case tests if cheap
- avoid unrelated refactors during bug fix

## Review guidance

Codex should ask:

- Do we have a failing test or repro?
- Does the fix address the observed failure?
- Could this bug occur in similar paths?
- Did we avoid changing unrelated behavior?
- Is there a regression test now?

## Testing / verification guidance

Codex should recommend:

- failing regression test first
- minimal reproduction case
- edge-case tests around bug boundary
- production-data-inspired fixtures where safe
- before/after verification

## Tradeoffs and cautions

Some urgent production bugs may require a hotfix before a full test. Codex should still add a regression test as soon as possible.

## Example transformation

**Before:**

```text
Bug: duplicate invoices.
Codex changes invoice generation logic based on inspection only.
```

**After:**

```text
Codex writes a test showing duplicate invoice creation on repeated submission, fixes with idempotency/constraint, and verifies the regression test passes.
```

## Distilled skill rule

For legacy bug fixes, reproduce the bug first and keep the reproduction as a regression test.

---

# 18. Improve Design Opportunistically but Safely

## Core teaching

Legacy systems improve over time through many small safe changes. Do not wait for a giant cleanup project; also do not clean everything at once.

## Codex trigger

Apply this when:

- touching messy code for a feature
- adding tests around legacy code
- a seam has just been introduced
- a small refactor would simplify the change
- covered code has obvious duplication or bad names

## Signals and smells

Codex should notice:

- local code now has tests
- small extraction would clarify behavior
- renamed concept would reduce confusion
- duplication exists inside the covered area
- cleanup outside the area would expand risk

## Desired Codex behavior

Codex should refactor only the code now protected by tests and directly relevant to the change.

## Implementation guidance

Codex should:

- make small behavior-preserving refactors
- run tests after each meaningful step
- improve names around the touched concept
- extract logic only when it reduces risk or clarifies behavior
- avoid expanding the scope unnecessarily
- leave notes/todos for larger cleanup only when useful

## Review guidance

Codex should ask:

- Is this code covered now?
- Does this refactor support the current change?
- Is the refactor behavior-preserving?
- Did the diff stay small?
- Are we improving design incrementally?

## Testing / verification guidance

Codex should recommend:

- tests before and after refactor
- characterization tests for preserved behavior
- focused tests for extracted units
- regression suite for touched module

## Tradeoffs and cautions

Opportunistic refactoring should not become drive-by rewriting. Codex should keep cleanup local and justified.

## Example transformation

**Before:**

```text
After adding one test, Codex reformats and restructures the entire module.
```

**After:**

```text
After adding tests around payment calculation, Codex extracts only the covered calculation branch into a clearly named method.
```

## Distilled skill rule

Improve legacy design incrementally inside tested areas; avoid broad cleanup outside the safety net.

---

# 19. Codex Should Communicate Risk Like a Senior Engineer

## Core teaching

Legacy code work is risk management. A senior engineer explains uncertainty, identifies dangerous areas, and proposes a staged path instead of pretending the change is simple.

## Codex trigger

Apply this when:

- requirements are vague
- code is untested
- change affects core business behavior
- multiple modules are involved
- there is production risk
- user asks for large cleanup/rewrite
- tests are missing or failing

## Signals and smells

Codex should notice:

- “simple change” touches many files
- no test safety net
- hidden dependencies
- unclear behavior
- high business impact
- irreversible migration
- no rollback plan

## Desired Codex behavior

Codex should clearly state:

- what is risky
- what assumptions it is making
- what minimal safe path it recommends
- what tests or checks are needed
- what should be deferred

## Implementation guidance

Codex should:

- produce staged plans for risky legacy changes
- avoid overstating certainty
- mark assumptions
- separate safe immediate change from future cleanup
- recommend checkpoints/commits before risky refactors
- keep diffs reviewable

## Review guidance

Codex should ask:

- Did we identify the risk?
- Did we reduce it before coding?
- Did we communicate assumptions?
- Is there a staged path?
- Can this be reviewed and rolled back?

## Testing / verification guidance

Codex should recommend:

- test-first safety steps
- before/after behavior verification
- regression tests
- incremental commits
- production smoke checks for high-risk changes

## Tradeoffs and cautions

Do not over-plan tiny reversible changes. Scale the process to the risk of the change.

## Example transformation

**Before:**

```text
Codex says “I’ll refactor the legacy billing module” and changes 40 files.
```

**After:**

```text
Codex says “This module is untested and business-critical. I’ll first characterize invoice totals, then introduce a seam around tax calculation, then implement the requested rule in a small patch.”
```

## Distilled skill rule

Treat legacy code modification as risk management: state assumptions, build safety, and change in small reviewable steps.

---

# 20. Senior Engineering Judgment from _Working Effectively with Legacy Code_

## Core teaching

The deeper lesson is disciplined incrementalism. Legacy systems become changeable through small, safe, test-backed improvements, not heroic rewrites.

Codex should act like a careful engineer who respects unknown behavior.

## Codex trigger

Apply broadly when Codex is working in existing code that is:

- untested
- poorly understood
- tightly coupled
- business-critical
- hard to instantiate
- difficult to modify safely

## Signals and smells

Codex should notice:

- missing tests
- fear of change
- large classes/methods
- hard dependencies
- hidden side effects
- global/static coupling
- broad requested refactors
- unclear domain rules
- “rewrite it all” impulse

## Desired Codex behavior

Codex should:

- create safety before change
- preserve behavior before cleanup
- break only the dependencies needed for testing
- sprout/wrap when direct changes are risky
- add regression tests for bugs
- refactor covered areas gradually
- avoid broad unprotected rewrites

## Implementation guidance

Codex should:

- trace behavior
- add characterization tests
- introduce seams
- isolate logic from infrastructure
- keep patches small
- separate behavior change from refactor
- prefer incremental migration over rewrite
- improve design in tested areas only

## Review guidance

Codex should check:

- Is there test protection?
- Is the change point minimal?
- Are dependencies controlled?
- Is behavior change intentional?
- Is the refactor separated?
- Are hidden side effects preserved?
- Is the diff small and reviewable?

## Testing / verification guidance

Codex should recommend:

- characterization tests
- regression tests
- approval/golden-master tests
- fake dependency tests
- integration tests for remaining hard boundaries
- before/after comparison
- incremental test coverage growth

## Tradeoffs and cautions

Not every legacy change needs perfect test coverage. Codex should seek enough safety for the risk level, not perfection.

## Example transformation

**Before:**

```text
Codex directly edits an untested legacy workflow and then tries to reason that it probably still works.
```

**After:**

```text
Codex identifies the workflow boundary, characterizes current behavior, breaks the dependency blocking tests, makes the smallest behavior change, then refactors only the covered code.
```

## Distilled skill rule

In legacy systems, make change safe first, correct second, and cleaner third.

---

# Compression Candidates for Future `SKILL.md`

These are candidate rules to compress into a future Codex skill:

```text
When modifying legacy code, first create a local safety net around the behavior being changed.
```

```text
Identify the smallest safe change point before editing existing code.
```

```text
If expected behavior is unclear, write characterization tests that capture current observable behavior.
```

```text
Introduce the smallest useful seam needed to test the code; avoid broad dependency rewrites.
```

```text
Separate safety-building, behavior change, and refactoring into distinct steps.
```

```text
Use sprout or wrap techniques when direct edits to untested legacy code are too risky.
```

```text
Do not abstract legacy duplication until tests reveal which differences are intentional.
```

```text
For bug fixes, reproduce the bug first and preserve the reproduction as a regression test.
```

```text
Avoid full rewrites by default; prefer incremental replacement with seams, tests, and staged migration.
```

```text
Use golden-master or approval tests for complex legacy outputs before refactoring.
```

```text
Make hidden dependencies explicit only where they block testing or safe change.
```

```text
Refactor only code that is covered or directly protected by tests.
```

```text
Keep legacy patches small, reviewable, and focused on the requested behavior.
```

```text
Communicate risk, assumptions, safety steps, and deferred cleanup like a senior engineer.
```

```text
In legacy systems, make change safe first, correct second, and cleaner third.
```
