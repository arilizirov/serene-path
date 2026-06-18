# Extracted Codex-Skill Training Material
## Source: Clean Code

This file is raw source-extraction material for a future Codex skill. It is not a finished `SKILL.md`.

Source: *Clean Code: A Handbook of Agile Software Craftsmanship* by Robert C. Martin.

Primary engineering domains:
- refactoring
- maintainability
- readability
- testing
- architecture
- debugging
- senior engineering judgment
- product engineering

Core extraction goal:
Convert the book’s maintainability and craftsmanship ideas into operational behavior for an AI coding agent. The agent should write, modify, and review code in ways that improve clarity, reduce hidden complexity, preserve behavior, and make future change safer.

---

# 1. Clean Code as Professional Responsibility

## Core teaching

Code is read, changed, debugged, extended, and maintained far more than it is first written. Professional engineering means treating readability and maintainability as real delivery requirements, not decorative preferences.

Clean code is not merely pretty formatting. It is code whose intent, structure, dependencies, and behavior are understandable enough that another developer can safely change it.

## Codex trigger

Apply this when Codex is:

- writing new production code
- modifying existing code
- reviewing a pull request
- cleaning up generated code
- adding a feature into a messy area
- fixing a bug in unclear logic
- creating public APIs, domain models, services, tests, or utilities

## Signals and smells

Codex should notice:

- code that works but is hard to understand
- functions with unclear purpose
- names that hide intent
- comments compensating for confusing code
- duplicated logic
- large classes or methods
- mixed abstraction levels
- hidden side effects
- risky changes made without tests
- quick fixes that increase future change cost

## Desired Codex behavior

Codex should treat code clarity as part of correctness. When it writes code, it should prefer explicit intent, small units, clear names, and tests around behavior. When it reviews code, it should identify areas where future developers are likely to misunderstand or break behavior.

## Implementation guidance

Codex should:

- write code for the next human reader
- preserve behavior when refactoring
- keep changes focused and reviewable
- avoid cleverness that obscures intent
- use names that reveal domain meaning
- keep functions small and cohesive
- separate business rules from plumbing
- add tests before risky restructuring
- remove dead code instead of leaving confusing paths

## Review guidance

Codex should ask:

- Is the intent obvious from the code itself?
- Would a future developer know where to make a related change?
- Is this change making the system easier or harder to modify?
- Is the code organized around domain concepts or incidental mechanics?
- Are we hiding complexity behind vague names or comments?

## Testing / verification guidance

Codex should recommend:

- regression tests before refactoring risky logic
- characterization tests for unclear legacy behavior
- focused unit tests for small units of behavior
- integration tests where behavior crosses boundaries
- reviewable diffs that separate behavior change from cleanup

## Tradeoffs and cautions

Do not refactor unrelated areas during urgent fixes unless the messy area blocks the fix. Do not turn simple code into over-abstracted architecture. Clean code should reduce cognitive load, not increase it through excessive patterns.

## Example transformation

Before:

```csharp
public void DoIt()
{
    // lots of mixed validation, database updates, notifications, and formatting
}
```

After:

```csharp
public void RegisterStudent(RegisterStudentRequest request)
{
    ValidateRegistrationRequest(request);
    var student = CreateStudentRecord(request);
    AssignInitialClassPlacement(student, request);
    QueueRegistrationNotifications(student);
}
```

Why:
The second version communicates intent and separates concepts without forcing the reader to parse all details at once.

## Distilled skill rule

Optimize code for safe future change: clear intent, focused structure, tested behavior, and minimal hidden complexity.

---

# 2. Meaningful Names

## Core teaching

Names are a primary design tool. Good names reveal intent, domain meaning, scope, and responsibility. Poor names force readers to reverse-engineer purpose from implementation details.

## Codex trigger

Apply this when Codex is:

- creating or renaming variables, functions, classes, interfaces, tests, files, modules, tables, or endpoints
- reviewing unclear code
- generating DTOs, services, repositories, or domain models
- extracting methods or classes
- translating business requirements into code

## Signals and smells

Codex should notice:

- vague names like `data`, `info`, `manager`, `helper`, `processor`, `thing`, `obj`, `temp`
- misleading names that do not match behavior
- names that encode implementation instead of intent
- abbreviations that are not standard in the domain
- names that differ slightly but mean the same thing
- one-letter variables outside tiny local scopes
- functions named after how they work rather than what they mean
- boolean names that read ambiguously
- classes named as generic containers of unrelated behavior

## Desired Codex behavior

Codex should choose names that explain why the code exists and what domain role it serves. It should prefer domain language over generic technical language.

## Implementation guidance

Codex should:

- use intention-revealing names
- name booleans as predicates, such as `isActive`, `hasOutstandingBalance`, or `canEnroll`
- name functions with verbs or verb phrases
- name classes with nouns or domain concepts
- avoid generic suffixes unless they clarify architectural role
- keep terminology consistent across code, tests, database, and API contracts
- rename when extracting methods so the extracted method describes the concept, not the mechanics

## Review guidance

Codex should ask:

- Does this name tell the truth about the code?
- Would a new developer understand the domain meaning?
- Are two different names being used for the same concept?
- Are we using the same name for two different concepts?
- Does the name expose unnecessary implementation detail?

## Testing / verification guidance

Naming changes should preserve behavior. Codex should recommend running existing tests after renames and avoiding public contract renames unless compatibility is handled.

## Tradeoffs and cautions

Do not rename public APIs, database fields, or serialized message fields casually. If a name is part of a contract, rename through a staged compatibility plan.

## Example transformation

Before:

```csharp
var list = GetData(id);
if (flag) Process(list);
```

After:

```csharp
var enrolledStudents = GetStudentsForClass(classId);
if (shouldSendWelcomeMessages) SendWelcomeMessages(enrolledStudents);
```

Why:
The revised names expose domain meaning and decision intent.

## Distilled skill rule

Use names that reveal domain intent and responsibility; avoid vague, misleading, or purely mechanical names.

---

# 3. Small, Focused Functions

## Core teaching

Functions should do one coherent thing at one level of abstraction. A function is clean when its name accurately describes its entire behavior and the reader can understand it without tracking unrelated concerns.

## Codex trigger

Apply this when Codex is:

- writing methods/functions
- extracting logic
- reviewing long functions
- adding validation, persistence, logging, notifications, or formatting
- modifying controller actions or service methods
- encountering deeply nested logic

## Signals and smells

Codex should notice:

- long functions with multiple responsibilities
- functions with sections separated by comments
- functions that validate, transform, persist, notify, and render all in one place
- multiple abstraction levels in one function
- deeply nested conditionals
- boolean flags that make one function do multiple different things
- many parameters
- repeated local helper logic
- functions whose name only describes part of what they do

## Desired Codex behavior

Codex should split behavior into small, intention-revealing functions while preserving behavior. It should make the high-level function read like a sequence of domain steps.

## Implementation guidance

Codex should:

- keep functions focused on one purpose
- extract lower-level details behind well-named helpers
- avoid boolean parameters that switch behavior
- prefer early returns when they reduce nesting
- keep validation, domain decisions, persistence, and side effects distinguishable
- pass clear inputs rather than large mutable context objects when practical
- avoid excessive fragmentation where extraction makes code harder to follow

## Review guidance

Codex should ask:

- Can the function’s name honestly describe everything it does?
- Are there multiple reasons this function might need to change?
- Are abstraction levels mixed?
- Would extracting a named helper clarify intent?
- Is this function hard to test because it does too much?

## Testing / verification guidance

Codex should recommend:

- tests around the original behavior before extracting risky legacy code
- focused unit tests for extracted pure logic
- integration tests for orchestration functions with side effects
- regression tests for edge cases in complex conditionals

## Tradeoffs and cautions

Do not split code into tiny functions with meaningless names. Extraction should improve readability. Avoid making readers jump through many files for simple logic.

## Example transformation

Before:

```csharp
public async Task SubmitRegistration(RegistrationDto dto)
{
    // validate dto
    // check duplicate student
    // create family
    // create student
    // assign class
    // send email
    // return response
}
```

After:

```csharp
public async Task SubmitRegistration(RegistrationDto dto)
{
    ValidateRegistration(dto);
    await EnsureStudentIsNotDuplicate(dto.StudentTz);
    var family = await CreateOrUpdateFamily(dto);
    var student = await RegisterStudent(family, dto);
    await AssignDefaultPlacement(student);
    await QueueRegistrationConfirmation(student);
}
```

Why:
The orchestration now communicates workflow while details live behind named operations.

## Distilled skill rule

Write functions that do one coherent thing at one abstraction level; extract named steps when a function mixes responsibilities.

---

# 4. Comments and Self-Explaining Code

## Core teaching

Comments are sometimes useful, but they often compensate for unclear code. The best default is to improve names and structure so the code explains itself. Comments should explain why, warn about non-obvious constraints, or document external contracts—not restate obvious mechanics.

## Codex trigger

Apply this when Codex is:

- adding comments
- reviewing commented code
- explaining tricky logic
- documenting public APIs or contracts
- leaving TODOs
- working with legacy code

## Signals and smells

Codex should notice:

- comments that repeat what the code says
- outdated comments contradicting code
- commented-out code
- TODOs with no owner or context
- comments explaining confusing code that could be renamed or extracted
- large banner comments dividing a function into responsibilities
- misleading comments around business rules
- comments used instead of tests

## Desired Codex behavior

Codex should first try to make code clearer through naming and structure. It should add comments only when they convey information not obvious from the code.

## Implementation guidance

Codex should:

- remove commented-out dead code
- replace explanatory comments with better names where possible
- keep comments close to the reason they exist
- comment non-obvious business rules, external constraints, performance tradeoffs, or safety warnings
- include links or references only when useful and stable
- avoid noisy comments generated for every method

## Review guidance

Codex should ask:

- Does this comment explain why rather than what?
- Would a rename or extraction eliminate the need for this comment?
- Is the comment still true?
- Is this TODO actionable?
- Is a test a better way to document the expected behavior?

## Testing / verification guidance

Codex should recommend tests for commented business rules or edge cases. If a comment says “must never happen,” Codex should ask whether there is a guard, invariant, or test.

## Tradeoffs and cautions

Do not remove comments that explain important domain constraints, regulatory requirements, compatibility reasons, security warnings, or surprising performance decisions.

## Example transformation

Before:

```csharp
// Check if student has already been registered
if (db.Students.Any(s => s.TzNumber == tz))
{
    throw new DuplicateStudentException();
}
```

After:

```csharp
if (StudentAlreadyRegistered(tz))
{
    throw new DuplicateStudentException();
}
```

Why:
The method name carries the intent; no comment is needed.

## Distilled skill rule

Prefer clearer code over explanatory comments; use comments only for non-obvious intent, constraints, warnings, or contracts.

---

# 5. Formatting and Local Readability

## Core teaching

Formatting communicates structure. Consistent layout, spacing, ordering, and proximity reduce cognitive load and make relationships visible.

## Codex trigger

Apply this when Codex is:

- editing any source file
- generating new files
- reviewing diffs
- organizing imports/usings
- arranging class members
- formatting tests

## Signals and smells

Codex should notice:

- inconsistent indentation or spacing
- unrelated concepts placed together
- related declarations spread apart
- huge files with no clear organization
- inconsistent ordering of methods or fields
- unnecessary blank lines or cramped code
- diffs dominated by formatting noise
- generated code that ignores project conventions

## Desired Codex behavior

Codex should follow the project’s existing style and use formatting to reveal structure without creating noisy, unrelated changes.

## Implementation guidance

Codex should:

- preserve existing formatting conventions unless asked to standardize
- keep related code close together
- avoid reformatting unrelated files
- organize imports/usings according to project conventions
- separate logical blocks with minimal whitespace
- place high-level orchestration before low-level helpers when consistent with local style
- keep line lengths readable

## Review guidance

Codex should ask:

- Does the formatting make structure obvious?
- Are related things close together?
- Did this change create unnecessary diff noise?
- Does the file follow nearby project conventions?

## Testing / verification guidance

Codex should recommend running formatters/linters where the project already uses them. It should avoid introducing a new formatting tool without user approval.

## Tradeoffs and cautions

Do not perform broad formatting changes during a behavior change unless the task explicitly includes formatting. Mixing formatting with logic changes makes review harder.

## Example transformation

Before:

```csharp
public class StudentService{
public void Register(){...}


private void Validate(){...} public void Delete(){...}}
```

After:

```csharp
public class StudentService
{
    public void Register()
    {
        // ...
    }

    public void Delete()
    {
        // ...
    }

    private void Validate()
    {
        // ...
    }
}
```

Why:
Consistent formatting makes structure easier to scan.

## Distilled skill rule

Format code to reveal structure and follow local conventions; avoid unrelated formatting noise.

---

# 6. Objects, Data Structures, and Boundaries of Responsibility

## Core teaching

Objects expose behavior while hiding internal data. Data structures expose data and carry little behavior. Confusing the two leads to anemic models, leaky abstractions, and scattered business rules.

## Codex trigger

Apply this when Codex is:

- designing classes, entities, DTOs, services, repositories, or domain models
- deciding where business rules belong
- creating API responses
- moving logic between layers
- working with ORMs

## Signals and smells

Codex should notice:

- domain entities with only getters/setters and no behavior
- business rules duplicated in controllers, UI, and services
- DTOs used as domain models
- persistence models leaked through API contracts
- classes exposing internal collections for mutation
- service methods manipulating object internals from outside
- objects with public mutable state and hidden invariants
- data containers pretending to be behavior-rich domain objects

## Desired Codex behavior

Codex should keep responsibilities explicit. Domain behavior should live near the data and invariants it protects. DTOs should be treated as boundary shapes, not core domain models.

## Implementation guidance

Codex should:

- distinguish DTOs from domain models
- avoid exposing mutable internals unnecessarily
- put invariant-preserving behavior on domain objects or domain services
- keep controllers thin
- map between persistence/API shapes and domain concepts where needed
- avoid leaking database schema directly into public APIs
- use data structures intentionally for simple transport or read models

## Review guidance

Codex should ask:

- Where is this business rule enforced?
- Can invalid state be created from outside the object?
- Is this class behavior-rich or just a bag of data?
- Is this DTO being used as the domain model?
- Is the API exposing persistence details unnecessarily?

## Testing / verification guidance

Codex should recommend:

- invariant tests on domain behavior
- mapping tests for DTO/domain conversion where important
- controller tests that verify orchestration but not domain internals
- tests preventing invalid states

## Tradeoffs and cautions

Not every app needs a rich domain model. For simple CRUD, plain data structures may be sufficient. Codex should not force domain-driven patterns where they add ceremony without protecting meaningful rules.

## Example transformation

Before:

```csharp
student.Status = "Graduated";
student.ClassId = nextClassId;
student.GraduationDate = DateTime.UtcNow;
```

After:

```csharp
student.GraduateTo(nextClassId, clock.UtcNow);
```

Why:
The domain operation protects the invariant and names the business action.

## Distilled skill rule

Keep business rules near the data and invariants they protect; do not leak DTOs or persistence shapes into the domain by default.

---

# 7. Error Handling

## Core teaching

Error handling should be clear, intentional, and separated from normal logic. Errors are part of design. Poor error handling hides failures, corrupts state, or makes code unreadable.

## Codex trigger

Apply this when Codex is:

- adding try/catch blocks
- handling validation, persistence, network, file, or external API failures
- designing service results
- creating exceptions
- reviewing broad error handling
- modifying transactional workflows

## Signals and smells

Codex should notice:

- empty catch blocks
- catching broad exceptions without context
- returning null for errors without explanation
- mixing error handling deeply into business logic
- swallowing exceptions after logging only
- exposing internal exception details to users
- throwing generic exceptions for domain cases
- inconsistent error formats
- no rollback/compensation path after partial failure

## Desired Codex behavior

Codex should make errors explicit and diagnosable. It should preserve the clarity of the happy path while handling known failure modes deliberately.

## Implementation guidance

Codex should:

- catch specific exceptions where recovery or translation is possible
- include useful context in logs without leaking secrets
- use domain-specific errors for expected business failures
- avoid returning null for exceptional or ambiguous cases
- fail fast on invalid configuration or impossible states
- keep error responses consistent at API boundaries
- avoid hiding failures that require caller action
- separate validation failures from system failures

## Review guidance

Codex should ask:

- Is this error expected or exceptional?
- Can the caller recover?
- Is the error logged with enough context?
- Are we leaking sensitive internals?
- Does the catch block preserve or destroy useful debugging information?
- Could this leave partial state behind?

## Testing / verification guidance

Codex should recommend:

- tests for expected validation failures
- tests for dependency failure paths
- transaction rollback tests
- API error contract tests
- tests for not leaking sensitive details
- tests for retry/idempotency if relevant

## Tradeoffs and cautions

Do not overcomplicate error handling for simple local code. Do not convert every exception into custom exception types. Use custom errors when they clarify business meaning or boundary behavior.

## Example transformation

Before:

```csharp
try
{
    SaveStudent(student);
}
catch (Exception)
{
    return false;
}
```

After:

```csharp
try
{
    SaveStudent(student);
    return RegistrationResult.Success(student.Id);
}
catch (DuplicateStudentException ex)
{
    logger.LogInformation(ex, "Duplicate student registration for TZ {TzNumber}", student.TzNumber);
    return RegistrationResult.DuplicateStudent();
}
```

Why:
The expected business error is handled intentionally and remains diagnosable.

## Distilled skill rule

Handle errors explicitly and close to the boundary where they can be translated, recovered from, logged, or allowed to fail fast.

---

# 8. Boundaries and Third-Party Code

## Core teaching

External libraries, frameworks, APIs, databases, and generated clients should be isolated behind clear boundaries. This protects the domain from vendor-specific details and makes change/testing easier.

## Codex trigger

Apply this when Codex is:

- integrating a third-party library
- calling an external API
- using framework-specific APIs inside domain logic
- adding database/ORM code
- creating SDK clients
- wrapping infrastructure services
- writing tests around external dependencies

## Signals and smells

Codex should notice:

- third-party types spread through domain code
- framework attributes driving business logic
- external API response models used as internal domain models
- direct calls to payment/email/AI services from controllers
- tests requiring real external services for basic domain behavior
- no adapter around unstable dependencies
- business code tightly coupled to infrastructure details

## Desired Codex behavior

Codex should create thin, purposeful boundaries around external systems and keep domain logic independent from infrastructure when practical.

## Implementation guidance

Codex should:

- wrap external services behind interfaces/adapters
- map external DTOs into internal models
- keep framework-specific details at the edges
- write contract/integration tests for adapters
- avoid leaking external library types across the codebase
- centralize configuration and error translation for external clients
- preserve simple direct use when abstraction would be pointless

## Review guidance

Codex should ask:

- If this library/API changes, how much of the codebase changes?
- Are external response shapes leaking into business logic?
- Can this code be tested without the real external dependency?
- Is the boundary too generic or too vendor-specific?
- Does this wrapper add clarity or just ceremony?

## Testing / verification guidance

Codex should recommend:

- unit tests against the internal interface
- integration tests for the real adapter
- fake/stub external service responses
- tests for malformed or failed external responses
- contract tests where provider compatibility matters

## Tradeoffs and cautions

Do not create unnecessary abstractions around stable, simple framework calls. Boundaries are most valuable around volatile, external, expensive, slow, or business-critical dependencies.

## Example transformation

Before:

```csharp
var response = await stripeClient.Charges.CreateAsync(options);
student.PaymentProviderChargeId = response.Id;
```

After:

```csharp
var charge = await paymentGateway.ChargeRegistrationFee(student.Id, amount);
student.RecordSuccessfulPayment(charge.PaymentReference);
```

Why:
Domain logic depends on payment meaning, not the vendor SDK shape.

## Distilled skill rule

Keep third-party and framework details at system boundaries; translate them into domain concepts before they spread.

---

# 9. Unit Tests and Test Clarity

## Core teaching

Tests are part of the codebase and must be clean too. Good tests are readable, focused, fast, and trustworthy. They document behavior and make change safer.

## Codex trigger

Apply this when Codex is:

- adding tests
- modifying behavior
- refactoring legacy code
- fixing bugs
- reviewing test suites
- generating test data or fixtures

## Signals and smells

Codex should notice:

- tests that assert implementation details instead of behavior
- tests with unclear names
- overly broad tests that fail for many reasons
- fragile tests dependent on ordering/time/global state
- duplicated setup noise hiding the actual behavior
- no test for edge cases or failure paths
- tests that require real network/services unnecessarily
- tests that pass without meaningful assertions

## Desired Codex behavior

Codex should write tests that clearly describe expected behavior and fail for meaningful reasons. Tests should support refactoring instead of locking in accidental implementation details.

## Implementation guidance

Codex should:

- name tests by behavior or scenario
- use Arrange/Act/Assert or equivalent clarity
- keep each test focused
- avoid unnecessary mocks
- use fakes/builders to reduce setup noise
- test public behavior over private implementation
- add regression tests for bugs
- avoid brittle time-dependent tests by injecting clocks where needed

## Review guidance

Codex should ask:

- Does this test explain the behavior?
- Would this test catch the bug we care about?
- Is the assertion meaningful?
- Is setup hiding the important part?
- Is the test too coupled to implementation details?
- Will this test remain stable under safe refactoring?

## Testing / verification guidance

Codex should recommend:

- unit tests for pure/domain logic
- integration tests for boundaries
- regression tests before/after bug fixes
- characterization tests before refactoring unclear legacy code
- failure-path tests for important workflows

## Tradeoffs and cautions

Do not mock everything. Excessive mocking can make tests brittle and detached from real behavior. Do not chase 100% coverage at the expense of meaningful verification.

## Example transformation

Before:

```csharp
[Test]
public void Test1()
{
    var service = new StudentService(...lots of setup...);
    var result = service.DoThing(x);
    Assert.IsNotNull(result);
}
```

After:

```csharp
[Test]
public void RegisterStudent_WhenTzAlreadyExists_ReturnsDuplicateStudentResult()
{
    var service = CreateServiceWithExistingStudent(tzNumber: "123");

    var result = service.RegisterStudent(NewRegistration(tzNumber: "123"));

    Assert.That(result.Status, Is.EqualTo(RegistrationStatus.DuplicateStudent));
}
```

Why:
The test name, setup, action, and assertion all communicate behavior.

## Distilled skill rule

Write tests as readable behavior specifications that protect refactoring and catch meaningful regressions.

---

# 10. Classes and Cohesion

## Core teaching

Classes should have focused responsibilities and high cohesion. A class is hard to maintain when it has many reasons to change or mixes unrelated concepts.

## Codex trigger

Apply this when Codex is:

- creating or modifying classes
- reviewing large services/controllers/managers
- adding methods to existing classes
- extracting responsibilities
- designing modules
- working with domain services or application services

## Signals and smells

Codex should notice:

- large classes with unrelated methods
- names like `Manager`, `Helper`, `Utility`, or `Service` hiding many responsibilities
- fields used by only some methods
- many private helper methods for unrelated workflows
- classes that know too much about other classes
- low cohesion between data and behavior
- many reasons to change
- classes that both orchestrate and implement details

## Desired Codex behavior

Codex should keep classes cohesive and organized around a single responsibility or closely related set of responsibilities.

## Implementation guidance

Codex should:

- avoid dumping new behavior into already bloated classes
- extract new classes when a responsibility becomes distinct
- keep application orchestration separate from domain behavior and infrastructure details
- prefer small, named collaborators over one large god class
- use private methods to clarify internal steps, not to hide unrelated responsibilities
- avoid premature class explosion for tiny features

## Review guidance

Codex should ask:

- What is this class responsible for?
- How many reasons does it have to change?
- Are its methods using the same state and concepts?
- Is this class becoming a dumping ground?
- Should a responsibility be extracted?

## Testing / verification guidance

Codex should recommend:

- focused tests per responsibility
- characterization tests before splitting a risky large class
- integration tests to verify extracted collaborators still work together
- regression tests for public behavior

## Tradeoffs and cautions

Do not split classes mechanically by line count. Split when responsibilities, reasons to change, or testability indicate a real boundary.

## Example transformation

Before:

```csharp
public class SchoolManager
{
    public void RegisterStudent() { }
    public void ChargeTuition() { }
    public void SendWhatsApp() { }
    public void GenerateReport() { }
    public void ImportExcel() { }
}
```

After:

```csharp
public class StudentRegistrationService { }
public class TuitionBillingService { }
public class NotificationService { }
public class SchoolReportService { }
public class StudentImportService { }
```

Why:
The responsibilities change for different reasons and deserve separate concepts.

## Distilled skill rule

Keep classes cohesive: one clear responsibility, one main reason to change, and collaborators for distinct concerns.

---

# 11. Systems and Architecture Boundaries

## Core teaching

Clean systems separate construction, configuration, policy, and runtime behavior. High-level business rules should not depend directly on low-level details.

## Codex trigger

Apply this when Codex is:

- designing application structure
- wiring dependency injection
- creating services/controllers/repositories
- adding configuration
- introducing frameworks
- moving business logic across layers
- reviewing architecture

## Signals and smells

Codex should notice:

- business logic in startup/configuration code
- controllers doing domain decisions
- domain layer depending on web/database/framework details
- manual object construction scattered everywhere
- configuration hardcoded inside services
- service locator patterns hiding dependencies
- infrastructure code mixed with business policy
- tests requiring full app startup for simple domain behavior

## Desired Codex behavior

Codex should preserve separation between high-level policy and low-level details. It should wire dependencies at the edges and keep core logic testable without infrastructure.

## Implementation guidance

Codex should:

- keep composition root/startup wiring separate from domain behavior
- use dependency injection intentionally
- avoid hiding dependencies behind global access
- keep controllers thin and application services focused
- keep domain logic independent from database/web frameworks where practical
- put configuration in appropriate config objects/options
- keep framework-specific code near the boundary

## Review guidance

Codex should ask:

- Which layer owns this decision?
- Is business policy depending on infrastructure?
- Can the core behavior be tested without the full framework?
- Are dependencies explicit?
- Is configuration centralized and environment-aware?

## Testing / verification guidance

Codex should recommend:

- unit tests for core policies without infrastructure
- integration tests for wiring/configuration
- smoke tests for app startup
- boundary tests for controllers/adapters

## Tradeoffs and cautions

Do not create excessive layers for a tiny script or simple CRUD app. Architecture boundaries should make change easier, not force ceremony everywhere.

## Example transformation

Before:

```csharp
public class RegistrationController
{
    public async Task<IActionResult> Register(dto)
    {
        // validation, domain decisions, EF queries, email sending, response formatting
    }
}
```

After:

```csharp
public class RegistrationController
{
    public async Task<IActionResult> Register(dto)
    {
        var command = mapper.ToCommand(dto);
        var result = await registrationService.Register(command);
        return presenter.ToActionResult(result);
    }
}
```

Why:
The controller handles transport; application/domain services handle use-case behavior.

## Distilled skill rule

Keep high-level business policy independent from low-level framework, database, and configuration details.

---

# 12. Emergent Design and Simple Design Rules

## Core teaching

Good design emerges through tests, refactoring, duplication removal, clarity, and minimal necessary structure. The goal is not to predict the perfect architecture upfront but to keep the code easy to change.

## Codex trigger

Apply this when Codex is:

- adding features incrementally
- refactoring after tests pass
- removing duplication
- deciding whether to introduce abstractions
- cleaning up generated code
- working in a codebase with changing requirements

## Signals and smells

Codex should notice:

- duplication across methods/classes/tests
- abstraction introduced before there are multiple use cases
- code that passes tests but remains hard to understand
- behavior not covered by tests
- complex design for simple current needs
- repeated conditionals suggesting missing concept
- speculative extension points

## Desired Codex behavior

Codex should prefer the simplest design that passes tests, expresses intent, and removes meaningful duplication. It should refactor continuously but carefully.

## Implementation guidance

Codex should:

- add/maintain tests before refactoring
- remove duplication when it represents shared meaning
- avoid premature abstractions based on imagined future needs
- improve names and structure after getting behavior correct
- keep code minimal but not cryptic
- introduce abstractions when they reduce duplication, clarify policy, or isolate volatility

## Review guidance

Codex should ask:

- Are tests protecting this behavior?
- Is this design simpler than the alternatives?
- Is duplication accidental or meaningful?
- Is this abstraction justified by real variation?
- Does this code clearly express intent?

## Testing / verification guidance

Codex should recommend:

- test-first or test-near development for complex behavior
- regression tests before deduplicating risky logic
- focused tests for extracted abstractions
- mutation or edge-case thinking for critical rules

## Tradeoffs and cautions

Do not remove all duplication mechanically. Sometimes similar-looking code represents different concepts that may evolve separately. Do not avoid abstraction when duplication is already causing bugs or change friction.

## Example transformation

Before:

```text
Three controllers each calculate tuition discount slightly differently.
```

After:

```text
Extract TuitionDiscountPolicy with tests for discount rules.
Controllers call the shared policy.
```

Why:
The duplication represents one business rule and should have one tested home.

## Distilled skill rule

Let design emerge through tests, clarity, and removal of meaningful duplication; avoid speculative abstractions.

---

# 13. Concurrency

## Core teaching

Concurrent code is difficult because timing, shared state, ordering, and failure interleave in many ways. Clean concurrent code isolates shared state, limits synchronization complexity, and is tested for race conditions.

## Codex trigger

Apply this when Codex is:

- adding async/background work
- using threads, tasks, locks, timers, queues, or parallel processing
- modifying shared state
- implementing caches
- creating scheduled jobs
- handling multiple requests that can update the same data

## Signals and smells

Codex should notice:

- shared mutable state without synchronization
- lock usage mixed with business logic
- long-running work inside locks
- non-thread-safe collections in concurrent paths
- background jobs that can overlap
- async methods blocking synchronously
- fire-and-forget tasks without error handling
- race-prone check-then-act logic
- tests that only verify single-threaded behavior

## Desired Codex behavior

Codex should minimize shared mutable state, isolate concurrency concerns, and make concurrent workflows idempotent and testable.

## Implementation guidance

Codex should:

- prefer immutable data or local state where possible
- use thread-safe primitives intentionally
- keep lock scopes small
- avoid blocking async code
- make background job execution safe if run twice
- use database constraints/transactions for cross-request invariants
- centralize concurrency control rather than scattering locks
- expose failures from background tasks

## Review guidance

Codex should ask:

- What state is shared?
- Can two callers run this at the same time?
- What protects the invariant?
- Can this job overlap with itself?
- Are locks held while doing I/O?
- Are async errors observed?

## Testing / verification guidance

Codex should recommend:

- concurrent execution tests
- duplicate job tests
- race-condition tests around check-then-act logic
- idempotency tests
- cancellation tests for async workflows
- stress tests for critical concurrent paths

## Tradeoffs and cautions

Do not introduce threads or parallelism just for style. Concurrency should solve a real responsiveness, throughput, or isolation problem. Simpler sequential code is often safer.

## Example transformation

Before:

```csharp
if (!processedIds.Contains(id))
{
    processedIds.Add(id);
    await HandleMessage(message);
}
```

After:

```text
Use an atomic/durable processed-message record or database uniqueness constraint so duplicate concurrent handlers cannot both process the same message.
```

Why:
The original check-then-act is race-prone.

## Distilled skill rule

Treat concurrency as a correctness risk: isolate shared state, make work idempotent, and protect invariants with explicit synchronization or database guarantees.

---

# 14. Smells, Heuristics, and Refactoring Judgment

## Core teaching

Code smells are warning signs, not automatic rules. A senior engineer uses smells to decide where code is risky, unclear, duplicated, overcoupled, or hard to change.

## Codex trigger

Apply this when Codex is:

- reviewing existing code
- planning refactors
- explaining technical debt
- cleaning AI-generated code
- modifying legacy code
- deciding whether to extract, rename, move, or simplify

## Signals and smells

Codex should notice:

- duplicated code
- dead code
- speculative generality
- large functions/classes
- long parameter lists
- feature envy
- inappropriate intimacy between classes
- shotgun surgery for small changes
- divergent change in one class
- primitive obsession
- magic numbers/strings
- hidden temporal coupling
- inconsistent naming
- confusing conditionals
- comments explaining bad structure

## Desired Codex behavior

Codex should identify smells, explain why they matter, and propose targeted refactors that reduce risk without broad unnecessary rewrites.

## Implementation guidance

Codex should:

- refactor in small safe steps
- separate refactoring commits from behavior changes when possible
- preserve public contracts unless asked to change them
- add tests before risky refactors
- remove dead code when safe
- replace magic values with named constants or domain concepts
- reduce parameter lists through cohesive objects when meaningful
- move behavior closer to the data it uses

## Review guidance

Codex should ask:

- What smell is present?
- Is it causing real change risk or confusion?
- What is the smallest safe improvement?
- Are tests sufficient to refactor?
- Does the proposed abstraction reflect a real concept?

## Testing / verification guidance

Codex should recommend:

- characterization tests for legacy behavior
- regression tests around bug-prone smells
- incremental verification after each refactor step
- compile/lint/test runs after structural changes

## Tradeoffs and cautions

Do not treat smells as laws. Sometimes duplication is acceptable, a long method is clearer than fragmented helpers, or a primitive is fine for a simple boundary. Refactor for clarity and change safety, not ideology.

## Example transformation

Before:

```csharp
CalculateDiscount(order.Total, order.Customer.Type, order.Customer.Region, order.CreatedAt, true, false);
```

After:

```csharp
var discountContext = DiscountContext.From(order);
CalculateDiscount(discountContext);
```

Why:
A cohesive parameter object clarifies the concept and reduces positional-argument errors.

## Distilled skill rule

Use code smells as risk signals; refactor in small tested steps only when the change improves clarity, cohesion, or change safety.

---

# 15. Clean Code Behavior for AI-Generated Code

## Core teaching

AI-generated code often works superficially but can be verbose, generic, duplicated, poorly named, under-tested, over-abstracted, or inconsistent with the existing project. Codex should self-review its own output before presenting it as complete.

## Codex trigger

Apply this after Codex:

- generates code
- edits multiple files
- creates a new abstraction
- writes tests
- implements a feature from vague requirements
- performs a refactor

## Signals and smells

Codex should notice in its own output:

- generic names
- unnecessary helpers
- inconsistent style
- missing tests
- hidden behavior changes
- large diffs
- duplicated generated blocks
- public contracts changed accidentally
- too many abstractions for a small task
- comments that explain obvious code
- lack of error handling around important boundaries

## Desired Codex behavior

Codex should perform a clean-code pass before finalizing: simplify, rename, remove noise, align with local style, and verify behavior.

## Implementation guidance

Codex should:

- inspect nearby code conventions before adding new patterns
- keep generated code idiomatic for the project
- avoid adding frameworks/libraries unless justified
- remove unused code/imports
- avoid broad rewrites unless requested
- provide a concise explanation of behavior changes and risk areas
- include tests or explain why tests were not added

## Review guidance

Codex should ask itself:

- Did I solve the requested problem without unrelated rewrites?
- Did I preserve existing contracts?
- Are names specific to this domain?
- Is the code simpler than a human-maintained alternative?
- Did I add tests for meaningful behavior?

## Testing / verification guidance

Codex should run or recommend:

- existing test suite
- targeted tests for changed behavior
- compiler/type checks
- formatter/linter if already configured
- manual verification steps if automated tests are missing

## Tradeoffs and cautions

Do not endlessly polish. Stop when the code is clear, correct, tested enough for the risk, and consistent with the project.

## Example transformation

Before:

```text
Codex adds `StudentProcessingManagerHelperService` with broad methods and no tests.
```

After:

```text
Codex creates `StudentRegistrationService`, keeps methods focused, adds tests for duplicate registration and successful registration, and avoids unrelated changes.
```

Why:
The second output is domain-specific, reviewable, and safer to maintain.

## Distilled skill rule

After generating code, perform a self-review for names, cohesion, duplication, tests, style consistency, and accidental behavior changes.

---

# Compression Candidates for Future SKILL.md

These are not the final skill yet. They are candidate rules to keep when compressing this source into a Codex skill.

```text
Optimize code for safe future change: clear intent, focused structure, tested behavior, and minimal hidden complexity.
```

```text
Use names that reveal domain intent and responsibility; avoid vague, misleading, or purely mechanical names.
```

```text
Write functions that do one coherent thing at one abstraction level; extract named steps when a function mixes responsibilities.
```

```text
Prefer clearer code over explanatory comments; use comments only for non-obvious intent, constraints, warnings, or contracts.
```

```text
Format code to reveal structure and follow local conventions; avoid unrelated formatting noise.
```

```text
Keep business rules near the data and invariants they protect; do not leak DTOs or persistence shapes into the domain by default.
```

```text
Handle errors explicitly and close to the boundary where they can be translated, recovered from, logged, or allowed to fail fast.
```

```text
Keep third-party and framework details at system boundaries; translate them into domain concepts before they spread.
```

```text
Write tests as readable behavior specifications that protect refactoring and catch meaningful regressions.
```

```text
Keep classes cohesive: one clear responsibility, one main reason to change, and collaborators for distinct concerns.
```

```text
Keep high-level business policy independent from low-level framework, database, and configuration details.
```

```text
Let design emerge through tests, clarity, and removal of meaningful duplication; avoid speculative abstractions.
```

```text
Treat concurrency as a correctness risk: isolate shared state, make work idempotent, and protect invariants with explicit synchronization or database guarantees.
```

```text
Use code smells as risk signals; refactor in small tested steps only when the change improves clarity, cohesion, or change safety.
```

```text
After generating code, perform a self-review for names, cohesion, duplication, tests, style consistency, and accidental behavior changes.
```

---

# Possible Future Skill Structure

A future Codex skill based on this extraction could be organized as:

1. When to apply this skill
2. Clean-code operating principles
3. Naming rules
4. Function and class design rules
5. Comments and formatting rules
6. Error handling rules
7. Boundary and architecture rules
8. Testing rules
9. Refactoring rules
10. AI self-review checklist

The final skill should be much shorter than this file. This file is source material, not the final compressed instruction set.
