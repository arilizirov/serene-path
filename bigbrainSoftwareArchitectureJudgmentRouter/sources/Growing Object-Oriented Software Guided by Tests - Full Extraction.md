# Extracted Codex-Skill Training Material
## Source: _Growing Object-Oriented Software, Guided by Tests — Steve Freeman and Nat Pryce_

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

Primary domains:

```text
testing
test-driven development
object-oriented design
refactoring
architecture
senior engineering judgment
```


---

# 1. Use Tests to Grow Design, Not Just Verify It

## Core teaching

TDD is a design process. Tests should shape object boundaries, messages, responsibilities, and feedback loops, not merely check code after implementation.

## Codex trigger

Apply when creating new features, designing object interactions, adding services, or writing code in a testable architecture.

## Signals and smells

- Tests added only after implementation
- Objects hard to test because responsibilities are unclear
- Tests assert implementation details
- Design becomes procedural script

## Desired Codex behavior

Codex should begin from observable behavior and use tests to drive small design decisions.

## Implementation guidance

- Write a failing behavior test first where practical
- Let tests expose missing interfaces/responsibilities
- Keep tests focused on behavior/collaboration
- Refactor after green

## Review guidance

- Did tests influence design?
- Are objects easier to use because tests use them?
- Are tests checking behavior or internals?
- Does test describe user/domain need?

## Testing / verification guidance

- Red-green-refactor cycle
- Acceptance tests for feature behavior
- Unit tests for responsibilities
- Collaboration tests where interaction is behavior

## Tradeoffs and cautions

Do not force TDD mechanically while exploring unknown APIs; spike first if needed, then test-drive real implementation.

## Example transformation

Before: implement service, then write tests to match it.

After: write failing test for registration outcome, implement simplest behavior, then refactor names and boundaries.

## Distilled skill rule

Use tests as a design tool: specify behavior first, implement simply, then refactor with feedback.


---

# 2. Start from a Walking Skeleton

## Core teaching

A walking skeleton is a minimal end-to-end slice through the system that verifies architecture, deployment, test harness, and integration early.

## Codex trigger

Apply when starting a new application, subsystem, major workflow, or integration-heavy feature.

## Signals and smells

- Large design before anything runs end-to-end
- Late UI/backend/database integration
- Deployment postponed
- Tests only isolated pieces
- Architecture assumptions unverified

## Desired Codex behavior

Codex should establish a thin working vertical slice early, then grow behavior incrementally.

## Implementation guidance

- Build minimal end-to-end path
- Include build/test/run loop
- Stub externals initially if needed
- Add real integrations gradually
- Keep it production-shaped, not throwaway

## Review guidance

- Does system run end-to-end?
- Is CI/build working?
- Can it deploy/run in target environment?
- Are major integration points represented?

## Testing / verification guidance

- Minimal acceptance test through stack
- Smoke test for deploy/run
- Contract tests for external boundaries
- Incremental tests as features fill in

## Tradeoffs and cautions

The skeleton should not become a throwaway prototype; keep it simple but shaped like final system.

## Example transformation

Before: build all domain classes, wire database/UI later.

After: create path: submit minimal form → save record → display confirmation → CI runs it.

## Distilled skill rule

For new systems or major workflows, establish a minimal end-to-end walking skeleton before adding breadth.


---

# 3. Drive Design Through Responsibilities

## Core teaching

Object-oriented design is assigning clear responsibilities and defining collaboration through messages. Avoid central procedural controllers that know everything.

## Codex trigger

Apply when designing classes/services, extracting domain logic, or seeing anemic models with orchestration-heavy services.

## Signals and smells

- One service coordinates everything
- Data classes with no behavior
- Objects expose internals for others to manipulate
- Business rules spread across procedural code

## Desired Codex behavior

Codex should assign behavior to objects/modules that own the relevant concept and invariant.

## Implementation guidance

- Identify roles/responsibilities
- Make objects communicate through clear methods
- Keep invariants near owning concept
- Use interfaces where collaboration boundaries matter

## Review guidance

- Who owns this responsibility?
- Is behavior close to data/invariant?
- Is code telling or asking?
- Is a central service doing too much?

## Testing / verification guidance

- Unit tests for object responsibility
- Collaboration tests when message exchange matters
- Acceptance tests for feature behavior
- Invariant tests near owning object

## Tradeoffs and cautions

Do not create artificial hierarchies. Simple CRUD may be fine with application services and clear validation.

## Example transformation

Before: RegistrationService pulls fields from Student, Class, Parent and calculates everything.

After: StudentEnrollment owns eligibility, Class owns capacity, RegistrationService orchestrates.

## Distilled skill rule

Assign behavior to the object/module that owns the responsibility and invariant.


---

# 4. Tell, Don’t Ask

## Core teaching

Code is often clearer when objects are told to do meaningful work rather than exposing internal state for outsiders to manipulate.

## Codex trigger

Apply when seeing getter chains, external calculations from object internals, or procedural mutation of domain objects.

## Signals and smells

- `obj.GetA().GetB().GetC()` chains
- Services read fields and decide object behavior
- Domain objects are passive records
- Many setters mutate state externally

## Desired Codex behavior

Codex should move behavior behind intention-revealing methods where it improves encapsulation and invariants.

## Implementation guidance

- Replace external calculations with domain methods
- Keep invariants inside owning objects
- Reduce setter exposure
- Name commands by business intent

## Review guidance

- Is code asking for data to make a decision that belongs elsewhere?
- Could object expose meaningful behavior?
- Are invariants protected?

## Testing / verification guidance

- Tests for domain methods/invariants
- Regression tests for moved behavior
- Contract tests if public API changes

## Tradeoffs and cautions

Do not hide data needed for reporting/query DTOs behind awkward behavior-only APIs.

## Example transformation

Before: `if student.Age >= 3 && student.Age <= 5 ...` outside Student.

After: `student.CanEnrollInGan(schoolYear)` expresses domain intent.

## Distilled skill rule

Prefer intention-revealing behavior over exposing internals for outside code to manipulate.


---

# 5. Mock Roles, Not Implementation Details

## Core teaching

Mocks are useful when they represent meaningful collaborators and protocols. Over-mocking internals makes tests brittle.

## Codex trigger

Apply when writing tests with mocks/stubs/fakes or designing collaborators.

## Signals and smells

- Mock setup longer than behavior
- Tests verify every internal method call
- Tests fail after harmless refactor
- Mock represents concrete implementation trivia
- No clear role/interface behind mock

## Desired Codex behavior

Codex should mock stable roles at boundaries, not incidental implementation details.

## Implementation guidance

- Mock external collaborators or meaningful roles
- Prefer fakes/stubs for simple data where easier
- Verify interactions only when interaction is behavior
- Avoid mocking value objects/simple data

## Review guidance

- Does mock represent real role?
- Is interaction part of behavior?
- Would test survive internal refactor?
- Is fake simpler than mock?

## Testing / verification guidance

- State-based tests where outcome matters
- Interaction tests where protocol matters
- Contract tests for fake/mock consistency
- Avoid excessive call-order assertions

## Tradeoffs and cautions

Mocks are powerful but easy to overuse. Choose the test double that makes behavior clearest.

## Example transformation

Before: verify service calls repository, mapper, validator, logger in exact order.

After: verify invoice is submitted and gateway receives one authorized charge; mapper calls are not asserted.

## Distilled skill rule

Mock meaningful collaborator roles, not incidental internal implementation details.


---

# 6. Separate Acceptance and Unit Tests

## Core teaching

Acceptance tests describe system behavior from outside; unit tests drive internal design. They serve different feedback purposes.

## Codex trigger

Apply when designing test strategy for a feature, workflow, or system.

## Signals and smells

- Only unit tests, no user-visible behavior coverage
- Only slow E2E tests, no fast design feedback
- Acceptance tests check internal classes
- Unit tests require UI/database

## Desired Codex behavior

Codex should use acceptance tests to define done and unit tests to grow internal design.

## Implementation guidance

- Write acceptance test for feature outcome
- Use unit tests for domain/object behavior
- Keep acceptance tests few, valuable, stable
- Avoid testing every edge case through full stack

## Review guidance

- What test proves feature works externally?
- What tests give fast design feedback?
- Are acceptance tests too detailed?
- Are unit tests too integrated?

## Testing / verification guidance

- Acceptance test for main workflow
- Unit tests for important rules
- Integration/contract tests at boundaries
- Avoid duplicating every case at every level

## Tradeoffs and cautions

Useful feedback matters more than rigid test-pyramid ideology.

## Example transformation

Before: every validation edge case tested through browser automation.

After: one browser test covers registration flow; validation edge cases live in fast domain tests.

## Distilled skill rule

Use acceptance tests for external behavior and unit tests for internal design feedback.


---

# 7. Write Tests That Communicate

## Core teaching

Tests are executable documentation. Good tests explain behavior, context, and expected outcome clearly.

## Codex trigger

Apply whenever writing tests, naming test cases, building fixtures, or creating test helpers.

## Signals and smells

- Test names describe implementation
- Fixture setup hides important facts
- Test has many unrelated assertions
- Failure cause unclear
- Magic values with no meaning

## Desired Codex behavior

Codex should write tests that read like examples of system behavior.

## Implementation guidance

- Name tests by behavior
- Use clear arrange/act/assert flow
- Keep one main reason to fail
- Use builders/factories for irrelevant setup
- Make important values explicit

## Review guidance

- Can reader understand behavior from test?
- Is setup minimal but meaningful?
- Is failure diagnostic?
- Are helpers hiding too much?

## Testing / verification guidance

- Review tests as documentation
- Add edge cases as separate named tests
- Use domain-specific test data builders
- Ensure failures point to likely cause

## Tradeoffs and cautions

Avoid clever test DSLs that only the author understands.

## Example transformation

Before: `Test_Registration_1` with 80 lines of setup and many assertions.

After: `Rejects_registration_when_class_is_full` with minimal fixture and one assertion.

## Distilled skill rule

Write tests as clear examples of behavior, with names and fixtures that communicate intent.


---

# 8. Refactor in the Green

## Core teaching

After tests pass, improve design while preserving behavior. Red-green-refactor uses tests as a safety net for continuous design improvement.

## Codex trigger

Apply after Codex gets a failing test to pass or adds functionality in a simple form.

## Signals and smells

- First-pass messy code left forever
- Refactor attempted while tests red
- Duplication introduced by TDD but never removed
- Design deteriorates despite tests

## Desired Codex behavior

Codex should make the simplest passing implementation, then refactor while tests are green.

## Implementation guidance

- Get green with minimal code
- Remove duplication
- Improve names
- Move responsibilities toward clearer owners
- Simplify tests and production code
- Keep tests passing

## Review guidance

- Did Codex stop after green without design improvement?
- Are tests green before refactor?
- Was duplication removed?
- Did names improve?

## Testing / verification guidance

- Run tests continuously during refactor
- Add missing tests if refactor exposes gaps
- Keep acceptance tests stable
- Verify no behavior change

## Tradeoffs and cautions

Do not over-refactor toward imagined future needs. Let design emerge from real behavior.

## Example transformation

Before: after passing test, leave hardcoded branching and duplicated setup.

After: with tests green, extract named policy, remove duplication, simplify fixtures.

## Distilled skill rule

After making tests pass, refactor while green to improve design without changing behavior.


---

# Compression Candidates for Future `SKILL.md`

```text
Use tests as a design tool: specify behavior first, implement simply, then refactor with feedback.
```

```text
For new systems or major workflows, establish a minimal end-to-end walking skeleton before adding breadth.
```

```text
Assign behavior to the object/module that owns the responsibility and invariant.
```

```text
Prefer intention-revealing behavior over exposing internals for outside code to manipulate.
```

```text
Mock meaningful collaborator roles, not incidental internal implementation details.
```

```text
Use acceptance tests for external behavior and unit tests for internal design feedback.
```

```text
Write tests as clear examples of behavior, with names and fixtures that communicate intent.
```

```text
After making tests pass, refactor while green to improve design without changing behavior.
```
