# Extracted Codex-Skill Training Material
## Source: _Data and Reality_ — William Kent

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

This extraction is intentionally written as **operational guidance for an AI coding agent**, not as a human-facing book summary.

Primary engineering domains:

```text
data architecture
data modeling
conceptual modeling
database design
semantic modeling
senior engineering judgment
domain analysis
data governance
```

Secondary domains:

```text
requirements analysis
product engineering
analytics architecture
master data management
metadata management
data quality
schema design
API design
```

Core source angle:

```text
Data models are imperfect representations of a messy reality. Good data modeling requires careful thinking about meaning, identity, categories, relationships, context, ambiguity, time, and the limits of formal structure.
```

Important note for Codex extraction:

```text
This source is not mainly about warehouse patterns, pipelines, or tools. Its value for Codex is conceptual discipline: do not treat tables, entities, IDs, categories, and relationships as obvious. Ask what they mean in the real world and what ambiguities the model is hiding.
```

---

# 1. Data Models Are Representations, Not Reality

## Core teaching

The central teaching is that data structures are not reality itself. They are simplified representations of reality created for a purpose. Every model chooses what to include, what to ignore, what to simplify, and what assumptions to encode.

The engineering behavior being taught is:

```text
Before creating a schema, entity, API, or data product, identify what real-world concept is being represented and what simplifications the model is making.
```

For Codex, this means not blindly turning nouns into tables or JSON fields into columns. It should recognize that data modeling is interpretation.

## Codex trigger

Apply this when Codex is:

- designing database schemas
- creating domain models
- creating APIs
- modeling data products
- designing warehouse dimensions/facts
- creating forms and validation rules
- merging entities from multiple systems
- defining business metrics
- building import/export formats
- creating canonical models

## Signals and smells

Codex should notice:

- schema is copied directly from a form without domain analysis
- entity names sound obvious but are undefined
- table mixes real-world concept with workflow state
- field names are ambiguous
- categories are treated as natural facts when they are business decisions
- data model cannot handle real exceptions
- one ID is assumed to equal one real-world object
- model hides uncertainty
- users disagree about what an entity means
- schema assumes idealized cases only
- model is designed around current UI rather than durable meaning

## Desired Codex behavior

Codex should explicitly separate:

```text
real-world concept
model representation
purpose of representation
assumptions
known exceptions
ambiguities
```

It should ask:

```text
What real-world thing or event is this?
Why are we modeling it?
What does this model simplify?
What edge cases exist?
What meanings are ambiguous?
What will break if reality does not fit the model?
```

## Implementation guidance

When writing or modifying code, Codex should:

- name entities and fields in domain language
- document non-obvious meanings
- avoid encoding assumptions without stating them
- allow for real-world exceptions where important
- separate operational workflow state from conceptual identity
- avoid overfitting the model to one screen or report
- validate with examples and counterexamples
- use comments/docs/ADRs for important modeling assumptions

## Review guidance

Codex should ask:

- What reality does this model represent?
- Is the concept clearly defined?
- What simplifications are being made?
- Are exceptions handled or intentionally excluded?
- Does the model reflect the business domain or only the UI/database source?
- Are assumptions documented?
- Would a domain expert agree with the terms?

## Testing / verification guidance

Codex should recommend:

- example-based tests using realistic domain cases
- edge-case tests for exceptions
- data validation tests for known constraints
- model review with domain users/stewards
- migration tests for existing messy data
- import tests for imperfect source records
- semantic tests for metric/entity definitions

## Tradeoffs and cautions

Do not paralyze simple implementation with philosophical modeling. Some systems only need a practical approximation. But for core data, shared entities, analytics, identity, compliance, and long-lived systems, conceptual clarity pays off.

## Example transformation

**Before:**

```text
Codex creates:
Student(id, name, class_id, parent_name)
```

because a form has those fields.

**After:**

```text
Codex asks:
- Is “student” a child currently enrolled, an applicant, an alumnus, or any child ever recorded?
- Can one student have multiple guardians?
- Can a student change class?
- Does class assignment have history?
- Is parent a person entity or just contact text?

Then models Student, Person/Guardian, Family, Registration, and ClassAssignment separately if the domain requires it.
```

## Distilled skill rule

Treat every data model as a purposeful simplification of reality; define the real-world concept, assumptions, and exceptions before encoding it.

---

# 2. Identity Is Harder Than IDs

## Core teaching

An identifier in a database is not the same thing as real-world identity. A real entity can have multiple identifiers, identifiers can change, duplicates can exist, and different systems may identify the same thing differently.

The engineering behavior being taught is:

```text
Do not assume that one ID column equals one stable real-world entity.
```

For Codex, this is essential in schema design, data integration, master data, deduplication, and APIs.

## Codex trigger

Apply this when Codex is:

- creating primary keys
- integrating multiple systems
- designing master data
- modeling users/customers/students/families/products
- deduplicating records
- importing data
- designing identity matching
- building APIs around entities
- choosing business keys
- creating warehouse dimensions/Hubs

## Signals and smells

Codex should notice:

- source database ID treated as universal identity
- same person/entity appears in multiple systems
- natural key can change
- duplicate records exist
- ID can be reused
- one real person has multiple roles/records
- two people share same name/date of birth
- entity identity is based on mutable attributes
- imported spreadsheet lacks stable keys
- merging duplicates loses history
- identity rules are not documented

## Desired Codex behavior

Codex should distinguish:

```text
technical key
source-system key
business key
natural key
surrogate key
real-world identity
identity resolution rule
```

It should ask:

```text
What makes this entity the same thing over time?
Can identifiers change?
Can duplicates exist?
Can two entities share apparent identifiers?
Are there multiple source IDs?
Who decides merges/splits?
```

## Implementation guidance

Codex should:

- use surrogate keys for internal persistence where appropriate
- preserve source identifiers for lineage
- define business keys carefully
- avoid mutable attributes as sole identity
- create cross-reference/mapping tables for multi-source identity
- support merge/split workflows when duplicates are likely
- audit identity corrections
- document identity matching rules
- avoid deleting duplicate history without stewardship decision

## Review guidance

Codex should ask:

- Is this ID technical or business meaning?
- Is the key stable?
- What happens if the key changes?
- How are duplicates handled?
- Can one real entity have multiple records?
- Can one record represent multiple real things?
- Are source IDs preserved?
- Is merge/split auditable?

## Testing / verification guidance

Codex should recommend:

- uniqueness tests on chosen keys
- duplicate detection tests
- merge/split workflow tests
- source key mapping tests
- identity change tests
- import tests with duplicate/ambiguous records
- audit tests for identity corrections
- regression tests for entity matching rules

## Tradeoffs and cautions

Identity resolution can become complex. Do not build enterprise MDM for a tiny system unless needed. But do not pretend identity is solved by a single auto-increment integer when the business depends on real-world identity.

## Example transformation

**Before:**

```text
student.id from one school system is used everywhere as the permanent identity of a child.
```

**After:**

```text
student_internal_id is a surrogate.
source_student_ids table preserves IDs from each source.
student_identity_rules define matching.
merge/split workflow is audited.
Business-facing identity is documented separately from source IDs.
```

## Distilled skill rule

Separate technical IDs from real-world identity; preserve source identifiers and define explicit rules for matching, merging, splitting, and identity changes.

---

# 3. Categories Are Human Decisions, Not Natural Facts

## Core teaching

Many data categories are not objective facts. They are classifications made for a purpose: customer type, status, segment, product category, student type, risk level, active/inactive, priority, etc.

The engineering behavior being taught is:

```text
Model categories as governed definitions with context, not as self-evident labels.
```

For Codex, this means that statuses, enums, flags, and classifications need definitions, ownership, and sometimes history.

## Codex trigger

Apply this when Codex is:

- creating enums/status fields
- designing reference data
- defining metrics
- creating classification logic
- building dashboards
- modeling lifecycle states
- integrating systems with different categories
- creating filters/segments
- building AI/ML labels or risk bands

## Signals and smells

Codex should notice:

- category values are free-text strings
- category meanings are undefined
- same category means different things in different contexts
- status and type are mixed
- enum changes break historical records
- category logic duplicated
- “active” is used without definition
- classifications overwrite prior classifications
- categories are treated as universal when they are local/business-specific
- no owner for reference values

## Desired Codex behavior

Codex should define category semantics.

It should ask:

```text
What does this category mean?
Who defines it?
Is it stable or changing?
Is it mutually exclusive?
Can multiple categories apply?
Is this a lifecycle state, type, label, or derived classification?
Does history matter?
```

## Implementation guidance

Codex should:

- use reference tables/enums intentionally
- document category definitions
- avoid free-text category fields for governed values
- distinguish type from status from label from derived segment
- model many-to-many categories where multiple labels can apply
- preserve history for changing classifications when needed
- centralize category logic
- define allowed transitions for lifecycle states
- map external categories explicitly

## Review guidance

Codex should ask:

- Is this category defined?
- Is it governed reference data?
- Does it represent state, type, segment, or label?
- Are values mutually exclusive?
- Can values change over time?
- Are historical classifications preserved?
- Are external mappings explicit?
- Who owns the category set?

## Testing / verification guidance

Codex should recommend:

- accepted-value tests
- state transition tests
- category mapping tests
- history/versioning tests
- many-to-many category tests
- metric tests using classifications
- invalid category import tests
- reference data ownership checks

## Tradeoffs and cautions

Not every dropdown needs heavy governance. But categories used in reporting, workflow, compliance, billing, or decisions should be explicit and controlled.

## Example transformation

**Before:**

```text
student.status = "active" / "inactive" / "pending" / "left" / "old"
```

with unclear meaning.

**After:**

```text
registration_status_reference:
code
display_name
definition
allowed_next_statuses
is_terminal
owner
effective_from
effective_to

Student identity is separate from registration lifecycle status.
```

## Distilled skill rule

Treat statuses, types, and classifications as defined, governed categories with context, ownership, and history when they affect workflow or decisions.

---

# 4. Relationships Have Meaning, Cardinality, and Time

## Core teaching

Relationships are not just foreign keys. They have business meaning, cardinality, optionality, time boundaries, roles, and sometimes their own attributes.

The engineering behavior being taught is:

```text
Model relationships as first-class concepts when their meaning, history, or attributes matter.
```

For Codex, this prevents burying important relationships inside single mutable foreign keys.

## Codex trigger

Apply this when Codex is:

- designing relational schemas
- modeling many-to-many relationships
- creating junction tables
- modeling ownership/membership/assignment
- designing historical relationships
- integrating family/account/customer hierarchies
- creating APIs around relationships
- building warehouse Links/bridges

## Signals and smells

Codex should notice:

- relationship stored as one nullable foreign key but can change over time
- many-to-many relationship flattened into comma-separated IDs
- relationship has attributes but no table
- role names unclear
- relationship history overwritten
- relationship cardinality not enforced
- same entity appears in multiple roles
- start/end dates needed but absent
- relationship means different things in different contexts
- parent/child/owner/member roles are ambiguous

## Desired Codex behavior

Codex should define relationship semantics.

It should ask:

```text
What does this relationship mean?
Is it one-to-one, one-to-many, or many-to-many?
Is it optional or required?
Does it change over time?
Does it have roles?
Does the relationship have attributes?
Do we need historical periods?
```

## Implementation guidance

Codex should:

- use junction tables for many-to-many relationships
- model relationship attributes on the relationship table
- add role names where same entity type participates multiple ways
- include effective start/end dates when history matters
- enforce cardinality with constraints where possible
- avoid comma-separated relationship fields
- document relationship meaning
- test relationship uniqueness and validity

## Review guidance

Codex should ask:

- Is the relationship meaning clear?
- Is cardinality correct?
- Are roles named?
- Are relationship attributes misplaced on an entity?
- Is relationship history preserved if needed?
- Are constraints enforcing the intended relationship?
- Could this relationship become many-to-many?

## Testing / verification guidance

Codex should recommend:

- referential integrity tests
- cardinality/uniqueness tests
- relationship effective-date tests
- no-overlap tests for time-bound relationships
- role validity tests
- many-to-many query tests
- import tests for relationship ambiguity

## Tradeoffs and cautions

Do not turn every simple foreign key into a complex relationship object. Use first-class relationship modeling when the relationship has business meaning, attributes, multiplicity, or time behavior.

## Example transformation

**Before:**

```text
student.class_id stores the current class. Moving class overwrites history.
```

**After:**

```text
student_class_assignment:
student_id
class_id
role/status
effective_start_date
effective_end_date
assigned_by
assignment_reason
```

## Distilled skill rule

Model relationships explicitly when they have business meaning, multiplicity, roles, attributes, or historical time boundaries.

---

# 5. Context Changes Meaning

## Core teaching

The same data value can mean different things in different contexts. A “date” might be creation date, event date, approval date, posting date, effective date, or load date. A “status” might be operational status, billing status, registration status, or document status.

The engineering behavior being taught is:

```text
Name and model data with enough context to prevent false equivalence.
```

For Codex, this means avoiding generic field names and ambiguous joins/metrics.

## Codex trigger

Apply this when Codex sees:

- generic field names like date, status, type, amount, name, id
- same concept used across domains
- multiple roles for same entity/dimension
- metrics with unclear filters
- imported data with ambiguous column names
- APIs with vague payload fields
- dashboards with unexplained labels
- cross-domain integration

## Signals and smells

Codex should notice:

- `date` column with unclear meaning
- `status` used for multiple lifecycles
- `amount` without currency or sign convention
- `id` without entity/source context
- `name` without legal/display/preferred distinction
- reports join fields that are named similarly but mean different things
- context lost during transformation
- source column renamed into overly generic warehouse field

## Desired Codex behavior

Codex should preserve and clarify context.

It should ask:

```text
Date of what?
Status of what process?
Amount in what currency and sign convention?
ID of which entity and source?
Name used for what purpose?
Is this current, historical, effective, or loaded value?
```

## Implementation guidance

Codex should:

- use contextual column names
- distinguish role-playing fields
- document semantic meaning
- include units/currency/timezone where relevant
- avoid collapsing different statuses into one generic status
- preserve source context during transformations
- create separate fields/entities for distinct meanings
- validate that similarly named fields are truly equivalent before merging

## Review guidance

Codex should ask:

- Is the field name specific enough?
- Could consumers misinterpret this?
- Are there multiple concepts being collapsed?
- Is unit/timezone/currency explicit?
- Are role-playing dimensions named by role?
- Does metadata explain meaning?

## Testing / verification guidance

Codex should recommend:

- semantic tests for field mappings
- timezone/currency/unit tests
- role-specific date tests
- mapping tests for ambiguous source fields
- dashboard label review
- data catalog documentation checks

## Tradeoffs and cautions

Overly long names can be annoying, but ambiguity is worse in shared data. Use clear names in public/shared interfaces and concise local names only where context is obvious.

## Example transformation

**Before:**

```text
registration.date
registration.status
payment.amount
```

**After:**

```text
registration.submitted_at
registration.approved_at
registration_status_code
document_review_status_code
payment_amount_ils
payment_posted_at
payment_received_at
```

## Distilled skill rule

Use context-rich names and metadata so fields like date, status, amount, name, and ID cannot be misread across domains.

---

# 6. Null, Unknown, Missing, and Not Applicable Are Different

## Core teaching

Absence of data can mean many things. A null might mean unknown, not applicable, not yet collected, refused, unavailable, invalid, intentionally blank, or not loaded yet.

The engineering behavior being taught is:

```text
Do not let one null value silently represent many different meanings.
```

For Codex, this matters for database design, analytics, validation, APIs, imports, and data quality.

## Codex trigger

Apply this when Codex is:

- defining nullable columns
- designing forms
- importing data
- creating APIs
- building analytics models
- handling optional fields
- writing validation logic
- creating data quality tests
- interpreting missing values

## Signals and smells

Codex should notice:

- many nullable columns without explanation
- null used for both unknown and not applicable
- reports filter nulls inconsistently
- missing source data treated as zero
- no reason code for missing value
- API omits fields ambiguously
- optional field actually required in some contexts
- default values hide missingness
- data quality checks cannot distinguish valid blanks from errors

## Desired Codex behavior

Codex should model missingness intentionally.

It should ask:

```text
Why can this be missing?
Is it unknown, not applicable, not collected, pending, refused, or invalid?
Should there be a reason/status field?
Should a default be used?
Should the field be nullable at all?
```

## Implementation guidance

Codex should:

- avoid nullable fields unless meaningful
- document null semantics
- use reason/status fields for important missing values
- distinguish zero from unknown
- distinguish empty string from null
- use special dimension members like Unknown/Not Applicable in analytics where appropriate
- validate required fields by lifecycle state/context
- avoid silently coercing missing values into defaults
- surface missingness in data quality reports

## Review guidance

Codex should ask:

- What does null mean here?
- Are multiple meanings collapsed?
- Should missing reason be stored?
- Is missingness valid in all states?
- Are reports handling null correctly?
- Are defaults hiding data quality problems?
- Is optionality documented?

## Testing / verification guidance

Codex should recommend:

- nullability tests by context/state
- missing reason tests
- zero-vs-null tests
- import tests for blank/unknown/not-applicable
- analytics unknown-member tests
- API serialization tests for omitted/null fields
- data quality tests for missingness rates

## Tradeoffs and cautions

Do not over-model every optional field with complex reason codes. Use explicit missingness modeling when absence affects decisions, quality, compliance, workflow, or analytics.

## Example transformation

**Before:**

```text
student.parent_phone = null
```

Could mean no phone, not collected, parent refused, import failed, or not applicable.

**After:**

```text
parent_phone
parent_phone_status_code:
- PROVIDED
- NOT_COLLECTED
- REFUSED
- UNKNOWN
- NOT_APPLICABLE
```

only if the distinction matters to workflow/reporting.

## Distilled skill rule

Model missing values explicitly when meaning matters; do not let null collapse unknown, not applicable, not collected, invalid, and pending states.

---

# 7. Time Changes Data Meaning

## Core teaching

Data is often time-dependent. Attributes, relationships, categories, names, statuses, and rules change over time. A model that stores only current state may fail to answer historical questions.

The engineering behavior being taught is:

```text
Decide whether a data value represents current truth, event-time truth, effective-time truth, or load-time truth.
```

For Codex, this connects conceptual modeling to historical data architecture.

## Codex trigger

Apply this when Codex is:

- modeling changing attributes
- designing history tables
- creating audit trails
- building analytics
- creating effective-dated relationships
- designing metrics over time
- handling source corrections
- creating event models
- building slowly changing dimensions

## Signals and smells

Codex should notice:

- current value overwrites historical value
- no effective dates
- no event timestamp
- no load timestamp
- old reports change unexpectedly
- relationship changes are not captured
- source corrections confused with historical changes
- business rules change but old classifications are lost
- “as of” questions cannot be answered
- timestamps have ambiguous meaning

## Desired Codex behavior

Codex should define time semantics.

It should distinguish:

```text
event time: when business event happened
effective time: when value is valid in real world/business
load/processing time: when system learned or loaded it
transaction time: when database recorded it
current state: latest known value
```

## Implementation guidance

Codex should:

- include event/effective/load timestamps where needed
- use history tables or effective-dated rows for changing values
- distinguish corrections from new changes
- preserve event facts for immutable events
- create current views derived from history
- define timezone standards
- document time semantics in schema
- test as-of queries
- avoid ambiguous `created_at`/`updated_at` for all time needs

## Review guidance

Codex should ask:

- What time does this timestamp represent?
- Do we need current or historical truth?
- Can this value change?
- Do we need effective dates?
- Are corrections handled separately?
- Can users query “as of” a date?
- Are timezone assumptions explicit?

## Testing / verification guidance

Codex should recommend:

- as-of query tests
- effective date non-overlap tests
- event-time vs load-time tests
- timezone boundary tests
- correction/restatement tests
- slowly changing dimension tests
- current view tests
- historical report regression tests

## Tradeoffs and cautions

Full bitemporal modeling is expensive and often unnecessary. Codex should add the level of temporal modeling required by business questions, audit needs, and risk.

## Example transformation

**Before:**

```text
family.address is overwritten whenever the family moves.
```

**After:**

```text
family_address_history:
family_id
address
effective_start_date
effective_end_date
loaded_at
source

current_family_address view selects the active row.
```

## Distilled skill rule

Define time semantics explicitly—event time, effective time, load time, and current state—when data changes or history matters.

---

# 8. The Same Real Thing Can Play Multiple Roles

## Core teaching

A real-world entity can appear in different roles: a person can be student, parent, teacher, emergency contact, payer, employee, or user. Modeling each role as a separate unrelated entity can create duplication and confusion.

The engineering behavior being taught is:

```text
Separate real-world identity from the roles that entity plays in different contexts.
```

For Codex, this matters in person/customer/account modeling, permissions, relationships, and data integration.

## Codex trigger

Apply this when Codex is:

- modeling people or organizations
- designing user/customer/student/employee schemas
- handling parent/student/teacher relationships
- integrating identity across systems
- creating role-based access
- designing contact models
- resolving duplicate person records
- creating party/account models

## Signals and smells

Codex should notice:

- separate tables duplicate same person attributes
- one person can play multiple roles but schema forbids it
- role-specific data mixed with identity data
- user account confused with person
- customer confused with account
- parent info copied into student record
- role changes overwrite identity
- permissions modeled as identity attributes
- same email/phone appears in multiple entity tables

## Desired Codex behavior

Codex should consider a core identity/party/person entity plus role-specific relationships when the domain requires it.

It should ask:

```text
Is this a real entity or a role?
Can one real person have multiple roles?
Which attributes belong to identity?
Which attributes belong to the role?
Can roles change over time?
```

## Implementation guidance

Codex should:

- separate Person/Organization identity from role tables where useful
- model role assignments explicitly
- store role-specific attributes on role/relationship tables
- avoid duplicating shared identity/contact fields
- allow multiple roles per identity when valid
- track role effective periods if needed
- keep user authentication account separate from person identity where appropriate
- document role semantics

## Review guidance

Codex should ask:

- Is this table a real entity or a role?
- Could one person/entity appear in multiple roles?
- Are attributes duplicated across role tables?
- Are role-specific fields separated?
- Is role history needed?
- Are permissions confused with identity?

## Testing / verification guidance

Codex should recommend:

- role assignment tests
- duplicate identity tests
- multi-role entity tests
- role-specific validation tests
- effective-date tests for roles
- permission tests if roles affect access
- import tests for same person in multiple roles

## Tradeoffs and cautions

Do not overbuild party-role models for simple systems. If roles are truly separate and never overlap, separate tables may be simpler. Use role separation when overlap, duplication, identity resolution, or lifecycle complexity appears.

## Example transformation

**Before:**

```text
students table has parent_name, parent_phone.
teachers table has name, phone.
users table has name, phone.
Same person can appear in multiple places.
```

**After:**

```text
person:
person_id
name
phone
email

student_role:
person_id
student_number

guardian_relationship:
student_person_id
guardian_person_id
relationship_type

teacher_role:
person_id
employment_id

user_account:
person_id
login_email
```

## Distilled skill rule

Separate real-world identity from contextual roles when one entity can play multiple roles or shared identity would otherwise be duplicated.

---

# 9. Attributes May Belong to Entities, Relationships, or Events

## Core teaching

A common modeling mistake is placing an attribute on the wrong thing. Some attributes describe an entity, some describe a relationship, and some describe an event.

The engineering behavior being taught is:

```text
Attach data to the concept it actually describes.
```

For Codex, this prevents schemas where relationship/event-specific fields are stored on entities incorrectly.

## Codex trigger

Apply this when Codex is:

- deciding table columns
- modeling junction tables
- designing event tables
- moving fields during refactor
- creating fact tables
- modeling audit/history
- designing APIs/forms
- reviewing bloated entities

## Signals and smells

Codex should notice:

- entity table has fields that only apply in one relationship
- relationship-specific attributes stored on one side of relationship
- event timestamp stored as current entity attribute
- many nullable columns because attributes apply only sometimes
- same attribute repeated for each relationship
- field changes when relationship changes, not entity itself
- event details overwritten by latest state
- lifecycle attributes mixed into identity table

## Desired Codex behavior

Codex should classify each attribute:

```text
entity attribute
relationship attribute
event attribute
derived attribute
classification/status
metadata/audit attribute
```

It should place the attribute accordingly.

## Implementation guidance

Codex should:

- move relationship-specific attributes to relationship/junction tables
- move event-specific attributes to event/fact tables
- keep stable identity attributes on entity
- avoid bloated entity tables with context-specific columns
- model lifecycle/event history separately when needed
- document attribute ownership
- validate null patterns that reveal misplaced attributes

## Review guidance

Codex should ask:

- What concept does this field describe?
- Does it belong to the entity itself?
- Does it belong to a relationship?
- Does it belong to an event?
- Is it derived from other data?
- Is it only meaningful in certain contexts?
- Are nulls showing misplaced attributes?

## Testing / verification guidance

Codex should recommend:

- schema tests for required fields by concept
- relationship attribute tests
- event history tests
- null-pattern analysis
- migration tests after moving attributes
- API contract tests
- report reconciliation tests

## Tradeoffs and cautions

Sometimes denormalization copies attributes for performance or historical snapshot reasons. That is acceptable when source/meaning is clear and duplication is managed.

## Example transformation

**Before:**

```text
student.pickup_time
student.route_id
```

These describe the student’s transport assignment, not the student identity.

**After:**

```text
student_transport_assignment:
student_id
route_id
pickup_time
effective_start_date
effective_end_date
```

## Distilled skill rule

Place attributes on the entity, relationship, or event they actually describe; do not overload core entities with context-specific fields.

---

# 10. Names Are Not Definitions

## Core teaching

A clear-sounding name is not the same as a definition. Terms like customer, active, order, family, account, balance, current, status, net, and official can hide disagreement.

The engineering behavior being taught is:

```text
For important data terms, write definitions rather than relying on names alone.
```

For Codex, this means metadata, glossary, comments, and semantic definitions matter.

## Codex trigger

Apply this when Codex is:

- creating tables/columns
- defining metrics
- creating data products
- building dashboards
- designing APIs
- creating reference data
- resolving report disagreements
- integrating data across domains
- creating documentation

## Signals and smells

Codex should notice:

- business users disagree about a term
- metric name lacks formula
- field name is generic
- “active” or “current” appears without definition
- report labels are ambiguous
- same term used differently across systems
- API field name hides important assumptions
- no glossary/semantic layer
- data product docs repeat names but not meanings

## Desired Codex behavior

Codex should define important terms.

Definition should include:

```text
meaning
scope
inclusions/exclusions
grain
calculation if metric
owner
examples
edge cases
effective date/version if changing
```

## Implementation guidance

Codex should:

- add glossary entries for core terms
- include column/table comments for important fields
- define metrics with formulas and filters
- avoid ambiguous names
- include examples/counterexamples
- document edge cases
- version definitions if they change
- link definitions to tests where possible

## Review guidance

Codex should ask:

- Is this name enough to prevent misunderstanding?
- Is the term defined?
- Are inclusions/exclusions clear?
- Are edge cases explained?
- Who owns this definition?
- Do reports/APIs use the same definition?
- Does metadata exist?

## Testing / verification guidance

Codex should recommend:

- metric definition tests
- glossary completeness checks
- example/counterexample tests
- semantic layer tests
- dashboard label validation
- API documentation tests
- data contract tests

## Tradeoffs and cautions

Do not document every trivial column. Focus on terms that are shared, ambiguous, decision-driving, externally exposed, or historically disputed.

## Example transformation

**Before:**

```text
active_student_count
```

No definition.

**After:**

```text
active_student_count:
Count of distinct students with approved registration for the selected school year, excluding cancelled registrations and graduates, measured as of selected date.
Owner: Enrollment.
```

## Distilled skill rule

For important shared data terms and metrics, provide explicit definitions, scope, examples, owner, and tests; names alone are not enough.

---

# 11. The Model Should Expose Uncertainty When Uncertainty Matters

## Core teaching

Reality is often uncertain: unknown identity, approximate dates, disputed values, incomplete records, conflicting sources, provisional classifications, and unverified facts. Models that force false certainty can mislead users.

The engineering behavior being taught is:

```text
Represent uncertainty explicitly when decisions depend on confidence, source, or verification state.
```

For Codex, this means not always forcing ambiguous data into exact fields.

## Codex trigger

Apply this when Codex is:

- importing messy data
- integrating multiple sources
- matching identities
- building review workflows
- handling approximate dates
- classifying records
- storing user-submitted or third-party data
- designing analytics with uncertain values
- building AI-assisted extraction systems

## Signals and smells

Codex should notice:

- uncertain match stored as confirmed match
- approximate date stored as exact date
- conflicting source values overwrite each other
- AI-extracted value stored without confidence/review state
- unverified data used as authoritative
- “best guess” hidden in normal field
- no provenance/confidence/verification status
- manual review needed but not modeled

## Desired Codex behavior

Codex should include uncertainty metadata where important.

Possible fields:

```text
confidence_score
verification_status
source
source_priority
is_estimated
approximation_type
reviewed_by
reviewed_at
conflict_status
match_status
```

## Implementation guidance

Codex should:

- distinguish confirmed from inferred/estimated values
- preserve conflicting source values where needed
- add review workflows for uncertain matches
- prevent high-impact decisions from using unverified values silently
- expose uncertainty to consumers
- include confidence/provenance in AI extraction pipelines
- document uncertainty semantics
- test uncertain cases

## Review guidance

Codex should ask:

- Is this value known, inferred, estimated, or disputed?
- Does uncertainty matter to consumers?
- Should source/confidence be stored?
- Is manual review needed?
- Are conflicts preserved?
- Could false certainty cause harm?
- Is uncertainty visible downstream?

## Testing / verification guidance

Codex should recommend:

- uncertain match tests
- conflict resolution tests
- confidence threshold tests
- review workflow tests
- estimated date/value tests
- downstream filtering of unverified data
- audit tests for reviewed corrections

## Tradeoffs and cautions

Modeling uncertainty everywhere can be heavy. Use it where data is messy, integrated, AI-extracted, high-impact, or frequently disputed.

## Example transformation

**Before:**

```text
Imported student matched to existing student by name similarity and stored as definite same student.
```

**After:**

```text
student_match_candidate:
incoming_record_id
candidate_student_id
confidence_score
match_status: PENDING_REVIEW / CONFIRMED / REJECTED
reviewed_by
reviewed_at
```

## Distilled skill rule

When data is inferred, approximate, disputed, or source-conflicting, model uncertainty and verification state instead of storing guesses as facts.

---

# 12. Avoid Premature Universality

## Core teaching

Data modelers often try to create universal models that handle every possible case. Overly universal models become abstract, hard to understand, weakly constrained, and difficult to use.

The engineering behavior being taught is:

```text
Do not over-generalize the model beyond the domain understanding and use cases you actually have.
```

For Codex, this prevents generic entity-attribute-value structures and vague “thing/property/relationship” models unless truly justified.

## Codex trigger

Apply this when Codex is:

- designing flexible schemas
- handling many entity types
- proposing generic metadata models
- building extensible form systems
- modeling unknown future requirements
- creating configuration-heavy designs
- using JSON blobs/EAV patterns
- trying to unify many concepts

## Signals and smells

Codex should notice:

- tables named Entity, Object, Item, Type, Property, Value
- business constraints cannot be enforced
- queries become complex and untyped
- everything stored in JSON for flexibility
- model is hard for domain users to understand
- no clear entities
- validation pushed entirely into application code
- future-proofing dominates current needs
- generic design hides business meaning

## Desired Codex behavior

Codex should prefer concrete domain models until real variability demands abstraction.

It should ask:

```text
What variability is real now?
Which concepts are actually the same?
Which constraints would generic modeling lose?
Is flexibility worth weaker validation and harder queries?
Can extension points be localized?
```

## Implementation guidance

Codex should:

- model known domain concepts explicitly
- use generic structures only for genuine open-ended variability
- preserve constraints where possible
- isolate flexible/custom fields instead of making entire schema generic
- document why flexibility is needed
- provide typed views over generic storage when used
- avoid premature “universal data model” abstractions

## Review guidance

Codex should ask:

- Is this abstraction justified by real variation?
- Are we losing important constraints?
- Will queries/reporting become harder?
- Can domain users understand it?
- Could a concrete model plus extension fields work better?
- Is this future-proofing premature?

## Testing / verification guidance

Codex should recommend:

- constraint tests for concrete concepts
- validation tests for configurable fields
- query usability tests
- migration tests from flexible to concrete if needed
- performance tests for generic structures
- domain example tests

## Tradeoffs and cautions

Sometimes flexibility is required: custom forms, metadata systems, product attributes, extensible integrations. But generic models should be chosen deliberately with known costs.

## Example transformation

**Before:**

```text
entities:
entity_id
entity_type

attributes:
entity_id
attribute_name
attribute_value
```

for students, parents, classes, payments, and registrations.

**After:**

```text
students, guardians, classes, payments, registrations modeled concretely.
custom_form_answers table used only for truly variable optional intake questions.
```

## Distilled skill rule

Prefer concrete domain models over universal generic schemas unless real variability justifies the loss of constraints, clarity, and queryability.

---

# 13. Avoid False Precision

## Core teaching

Data systems often store precise-looking values that are not actually precise: estimated dates, rounded amounts, inferred addresses, guessed categories, incomplete counts, stale values, or sampled metrics.

The engineering behavior being taught is:

```text
Do not let the database format imply more certainty or precision than the data actually has.
```

For Codex, this means storing measurement method, precision, confidence, and as-of context when relevant.

## Codex trigger

Apply this when Codex is:

- storing measurements
- creating metrics
- importing approximate data
- using OCR/AI extraction
- building dashboards
- storing dates/times
- calculating balances/counts
- working with estimates/projections
- combining sampled/incomplete data

## Signals and smells

Codex should notice:

- approximate date stored as exact date
- estimated amount stored with no estimate flag
- dashboard shows stale metric without as-of timestamp
- AI-extracted field stored without confidence
- rounded values used as exact values
- sampled counts labeled as totals
- derived metric lacks calculation timestamp
- projections mixed with actuals

## Desired Codex behavior

Codex should preserve precision context.

It should ask:

```text
Is this exact, estimated, rounded, sampled, inferred, projected, or stale?
What is the unit/scale?
When was it measured?
What is the confidence?
Should consumers see precision limits?
```

## Implementation guidance

Codex should:

- add estimated/actual flags where needed
- include as_of timestamp for metrics/snapshots
- store unit/currency/scale
- include confidence for AI/inferred values
- distinguish actuals from forecasts
- document rounding rules
- avoid displaying stale derived data as live truth
- test precision-sensitive calculations

## Review guidance

Codex should ask:

- Does this value look more precise than it is?
- Is estimate/projection status clear?
- Is as-of time visible?
- Are units/scale/currency explicit?
- Is rounding documented?
- Are actuals and forecasts separated?

## Testing / verification guidance

Codex should recommend:

- estimate/actual flag tests
- as-of timestamp tests
- unit/currency tests
- rounding tests
- confidence threshold tests
- dashboard label tests
- stale-data warning tests

## Tradeoffs and cautions

Do not clutter every field with precision metadata. Apply this when precision affects decisions, trust, compliance, financials, science, forecasts, or AI extraction.

## Example transformation

**Before:**

```text
student.date_of_birth = '2021-01-01'
```

when only birth year was known.

**After:**

```text
date_of_birth = null
birth_year = 2021
birth_date_precision = 'YEAR_ONLY'
```

or equivalent representation.

## Distilled skill rule

Do not encode estimates, guesses, samples, stale values, or rounded measures as exact facts without precision/context metadata.

---

# 14. Data Design Should Preserve Provenance

## Core teaching

Knowing where data came from is often as important as the value itself. Provenance helps resolve conflicts, debug errors, assess trust, and support auditability.

The engineering behavior being taught is:

```text
Attach source/provenance information to data that is integrated, transformed, imported, or disputed.
```

For Codex, this connects conceptual modeling to lineage and trust.

## Codex trigger

Apply this when Codex is:

- importing files
- integrating sources
- merging records
- creating data pipelines
- resolving conflicting values
- storing third-party data
- using AI-extracted data
- building audit-sensitive systems
- designing data warehouses

## Signals and smells

Codex should notice:

- value exists but source is unknown
- conflicting values overwrite each other
- no source record ID
- no import batch ID
- no extraction timestamp
- no reviewed_by for manual corrections
- no lineage from derived value to input
- users ask “where did this number come from?”
- data quality issue cannot be traced

## Desired Codex behavior

Codex should preserve provenance appropriate to the data’s importance.

Provenance can include:

```text
source_system
source_record_id
source_file
import_batch_id
extracted_at
loaded_at
entered_by
reviewed_by
confidence
transformation_version
```

## Implementation guidance

Codex should:

- store source identifiers in staging/integration layers
- add batch/run metadata to imports
- preserve original values when transformations occur
- keep audit trail for manual edits
- document transformation lineage
- expose provenance to admins/analysts where useful
- avoid overwriting source-specific values without trace
- reconcile derived values to source inputs

## Review guidance

Codex should ask:

- Can this value be traced to source?
- Is provenance needed for trust or audit?
- What happens when sources conflict?
- Are manual corrections recorded?
- Is import/batch metadata stored?
- Can derived outputs be explained?

## Testing / verification guidance

Codex should recommend:

- provenance non-null tests for integrated data
- source-to-target mapping tests
- audit log tests
- conflict resolution tests
- import batch tests
- lineage validation
- manual correction tests

## Tradeoffs and cautions

Full field-level provenance can be expensive. Use the level of provenance that matches risk, integration complexity, and audit needs.

## Example transformation

**Before:**

```text
family.phone is updated from an imported spreadsheet, overwriting previous value with no trace.
```

**After:**

```text
family_contact_source_history:
family_id
phone
source_system/source_file
source_record_id
import_batch_id
loaded_at
confidence/status
```

Current phone view is derived according to survivorship rules.

## Distilled skill rule

Preserve provenance for imported, integrated, transformed, or disputed data so values can be traced, trusted, and corrected.

---

# 15. Conceptual Modeling Should Precede Physical Schema Choices

## Core teaching

Physical schemas, indexes, foreign keys, JSON columns, document structures, and APIs should follow conceptual understanding. If the concept is unclear, physical design will encode confusion.

The engineering behavior being taught is:

```text
Clarify concepts, identities, relationships, and rules before committing to physical schema shape.
```

For Codex, this means it should not immediately generate migrations for ambiguous domains.

## Codex trigger

Apply this when Codex is:

- designing a new database area
- creating core domain entities
- integrating ambiguous data
- refactoring schemas
- creating API resources
- building data warehouse models
- designing canonical data models
- asked to “make the database”

## Signals and smells

Codex should notice:

- user gives a list of fields but not concepts
- entity boundaries unclear
- relationships ambiguous
- business rules unknown
- exceptions likely
- physical design chosen before conceptual model
- debate about table names reflects deeper meaning issue
- schema changes repeatedly because concepts were wrong
- generic JSON used to avoid understanding domain

## Desired Codex behavior

Codex should create or propose a conceptual model first.

It should define:

```text
core concepts/entities
identities
relationships
cardinalities
states/lifecycles
rules/constraints
time/history needs
terms/definitions
examples
```

Then choose physical schema.

## Implementation guidance

Codex should:

- sketch conceptual model in text/diagram/table
- validate with realistic examples
- identify ambiguous areas
- choose physical schema after concepts are clear enough
- document mapping from concept to tables/API
- avoid premature migration code when domain is unclear
- proceed with assumptions if required, but state them

## Review guidance

Codex should ask:

- Are concepts clear enough to model physically?
- Do table names map to real domain concepts?
- Are relationships/cardinality understood?
- Are lifecycle states defined?
- Are ambiguous terms resolved or documented?
- Are physical choices hiding conceptual confusion?

## Testing / verification guidance

Codex should recommend:

- domain example tests
- constraint tests based on conceptual rules
- lifecycle transition tests
- relationship cardinality tests
- schema migration tests
- domain expert review
- API examples matching conceptual model

## Tradeoffs and cautions

Do not spend weeks on abstract modeling before shipping a small feature. But for core data, conceptual modeling saves rework.

## Example transformation

**Before:**

```text
Codex immediately creates:
parents table
students table
school table
```

without understanding family/guardian/registration/class assignment.

**After:**

```text
Codex first defines:
Person
StudentRole
GuardianRelationship
Family/Household
Registration
ClassAssignment
SchoolYear

Then maps to tables based on actual needs.
```

## Distilled skill rule

Clarify conceptual entities, identities, relationships, states, and rules before committing to physical tables, APIs, or storage structures.

---

# 16. Models Should Be Tested Against Realistic Examples and Counterexamples

## Core teaching

A model that works only for ideal examples is fragile. Good modeling uses examples and counterexamples to reveal ambiguity, exceptions, and wrong assumptions.

The engineering behavior being taught is:

```text
Validate data models with concrete domain scenarios, including messy edge cases.
```

For Codex, this means not accepting a schema because it handles only the happy path.

## Codex trigger

Apply this when Codex is:

- designing schemas
- creating domain models
- modeling imports
- defining business rules
- creating metrics
- building validation
- designing APIs/forms
- reviewing data architecture

## Signals and smells

Codex should notice:

- only one simple example considered
- no edge cases
- no migration from existing messy data
- no test data with exceptions
- model assumes one parent, one address, one class, one status
- real users describe exceptions but schema ignores them
- data quality issues appear after launch
- constraints are too strict or too loose

## Desired Codex behavior

Codex should request or generate representative scenarios.

Examples should include:

```text
normal case
missing data
duplicate entity
changed relationship
historical change
conflicting sources
invalid input
multi-role entity
exception workflow
edge cardinality
```

## Implementation guidance

Codex should:

- create example records during modeling
- test model with counterexamples
- add constraints that match real rules
- avoid overfitting to happy path
- document unsupported cases
- design migration strategy for existing data
- include fixtures that reflect messy reality
- revise model when examples fail

## Review guidance

Codex should ask:

- What examples prove this model works?
- What counterexamples break it?
- Are messy real cases represented?
- Are constraints too idealized?
- Are unsupported cases documented?
- Does existing data fit?
- What happens when relationships change?

## Testing / verification guidance

Codex should recommend:

- fixture-based domain tests
- migration tests with messy data
- validation tests for edge cases
- property-based tests where useful
- import tests for malformed/conflicting records
- lifecycle tests
- relationship cardinality tests

## Tradeoffs and cautions

You cannot model every possible exception. Codex should focus on likely, high-impact, or known messy cases.

## Example transformation

**Before:**

```text
Model assumes each child has exactly two parents living at one address.
```

**After:**

```text
Codex tests examples:
- one guardian
- two guardians at different addresses
- divorced parents
- emergency contact who is not guardian
- missing parent ID
- guardian changed over time

Then decides what complexity the system must support now.
```

## Distilled skill rule

Validate data models with realistic examples and counterexamples before trusting the schema.

---

# 17. Avoid Confusing Operational Convenience with Semantic Truth

## Core teaching

A field or table may exist for operational convenience, but that does not mean it represents a durable business concept. Temporary workflow states, cached values, UI flags, and denormalized fields should not be mistaken for semantic truth.

The engineering behavior being taught is:

```text
Distinguish operational implementation artifacts from domain facts.
```

For Codex, this prevents building analytics, integrations, or core models on accidental implementation details.

## Codex trigger

Apply this when Codex is:

- using application tables for reporting
- exposing API fields externally
- creating warehouse models from OLTP
- defining metrics from workflow flags
- integrating systems
- refactoring schemas
- documenting source of truth

## Signals and smells

Codex should notice:

- UI flag used as business status
- cached total treated as authoritative
- denormalized display field used for identity
- workflow queue state used as domain lifecycle
- temporary import table used by dashboards
- internal enum exposed as public contract
- derived field updated inconsistently
- operational shortcut becomes reporting definition
- implementation-specific column name appears in data product

## Desired Codex behavior

Codex should classify fields/tables as:

```text
domain fact
operational workflow state
derived/cache
technical metadata
presentation/display value
temporary/import artifact
```

It should avoid promoting artifacts to semantic contracts accidentally.

## Implementation guidance

Codex should:

- identify authoritative domain facts
- keep derived/cached fields labeled and rebuildable
- avoid using UI flags as metrics unless defined
- create semantic views/models over operational data
- document source of truth
- hide internal fields from public APIs/data products
- validate derived fields against source facts
- avoid direct BI dependency on temporary tables

## Review guidance

Codex should ask:

- Is this value a real domain fact or implementation artifact?
- Is it authoritative or derived?
- Can it be rebuilt?
- Should consumers depend on it?
- Is it stable enough for external contract?
- Is there a better semantic source?

## Testing / verification guidance

Codex should recommend:

- derived-vs-source reconciliation tests
- cache rebuild tests
- semantic mapping tests
- API contract tests hiding internals
- dashboard tests against governed model
- source-of-truth checks

## Tradeoffs and cautions

Operational artifacts can be useful internally. The problem is exposing them as business truth without definition and controls.

## Example transformation

**Before:**

```text
registration.is_done_ui is used in management reports as “registered student count.”
```

**After:**

```text
registered_student_count is defined from registration lifecycle status:
APPROVED and active for school year, excluding cancelled.
UI completion flag remains internal workflow state.
```

## Distilled skill rule

Do not treat UI flags, caches, workflow states, or technical fields as semantic truth unless explicitly defined and governed.

---

# 18. Senior Engineering Judgment from _Data and Reality_

## Core teaching

The deeper lesson is humility in data modeling. Reality is messy, ambiguous, contextual, changing, and only partially captured by data. Strong data architecture requires conceptual clarity before physical design.

Codex should internalize this:

```text
Before encoding data, reason about meaning: identity, categories, relationships, time, context, missingness, provenance, uncertainty, and purpose.
```

## Codex trigger

Apply broadly when Codex is working on:

- core domain schemas
- data architecture
- warehouse models
- APIs
- data products
- imports/exports
- integrations
- master data
- reference data
- metrics
- analytics definitions
- AI extraction/storage
- schema refactors

## Signals and smells

Codex should notice:

- obvious-sounding entities are undefined
- ID assumed to equal real identity
- categories lack definitions
- relationships are oversimplified
- dates/statuses/amounts are ambiguous
- nulls have unclear meaning
- history is overwritten
- same entity has multiple roles
- attributes are on wrong table
- names replace definitions
- uncertain data stored as fact
- universal generic schema proposed too early
- false precision
- no provenance
- physical schema chosen before conceptual model
- happy-path-only examples

## Desired Codex behavior

Codex should:

- clarify real-world concepts before schema
- distinguish model from reality
- define identity and key semantics
- define categories/reference values
- model relationships with cardinality/time/roles
- use contextual names
- handle missingness intentionally
- define temporal semantics
- separate identities from roles
- place attributes on correct concepts
- write definitions for important terms
- expose uncertainty/provenance where needed
- avoid premature universal abstraction
- validate with examples/counterexamples

## Implementation guidance

Codex should:

- create conceptual model notes before migrations for core data
- document key definitions and assumptions
- add constraints aligned with domain rules
- use reference data for governed categories
- model relationship tables when relationships have meaning/history
- use explicit date/status/amount names
- add missing reason/status fields when needed
- add effective dates/history tables when needed
- preserve source/provenance metadata
- keep operational artifacts separate from semantic data
- write example fixtures representing messy cases

## Review guidance

Codex should check:

- What does this entity really mean?
- Is identity stable and explicit?
- Are categories defined and governed?
- Are relationships/cardinality/time clear?
- Could generic names mislead?
- What does null mean?
- Is history needed?
- Are roles confused with identity?
- Is uncertainty/provenance important?
- Are assumptions documented?
- Has the model been tested against messy examples?

## Testing / verification guidance

Codex should recommend:

- domain example/counterexample tests
- identity uniqueness/merge tests
- reference data tests
- relationship cardinality tests
- effective-date/history tests
- null/missingness tests
- provenance/lineage tests
- uncertainty/review workflow tests
- metric semantic tests
- migration tests with real messy data

## Tradeoffs and cautions

This book can lead to over-analysis if applied without discipline. Codex should use conceptual modeling depth proportional to data importance.

Use more rigor for:

```text
core business entities
shared data products
identity/master data
analytics metrics
sensitive/compliance data
long-lived schemas
multi-source integration
```

Use less rigor for:

```text
temporary scripts
throwaway prototypes
local UI-only fields
simple internal tables
```

## Example transformation

**Before:**

```text
Codex creates a generic school database from form fields:
students(parent1, parent2, class, status, phone, address, payment_status)
```

**After:**

```text
Codex recognizes modeling questions:
- Person vs StudentRole vs GuardianRole
- Family/household vs parent relationship
- Registration status vs student status
- Class assignment history
- Payment account relationship
- Contact data provenance
- Missing/unknown parent info
- School-year context

Then creates a model that reflects the domain’s actual concepts and documents assumptions.
```

## Distilled skill rule

Before encoding important data, reason about its real-world meaning, identity, context, time, relationships, missingness, uncertainty, provenance, and assumptions.

---

# Compression Candidates for Future `SKILL.md`

These are candidate rules to compress into a future Codex skill:

```text
Treat every data model as a purposeful simplification of reality; define the real-world concept, assumptions, and exceptions before encoding it.
```

```text
Separate technical IDs from real-world identity; preserve source identifiers and define explicit rules for matching, merging, splitting, and identity changes.
```

```text
Treat statuses, types, and classifications as defined, governed categories with context, ownership, and history when they affect workflow or decisions.
```

```text
Model relationships explicitly when they have business meaning, multiplicity, roles, attributes, or historical time boundaries.
```

```text
Use context-rich names and metadata so fields like date, status, amount, name, and ID cannot be misread across domains.
```

```text
Model missing values explicitly when meaning matters; do not let null collapse unknown, not applicable, not collected, invalid, and pending states.
```

```text
Define time semantics explicitly—event time, effective time, load time, and current state—when data changes or history matters.
```

```text
Separate real-world identity from contextual roles when one entity can play multiple roles or shared identity would otherwise be duplicated.
```

```text
Place attributes on the entity, relationship, or event they actually describe; do not overload core entities with context-specific fields.
```

```text
For important shared data terms and metrics, provide explicit definitions, scope, examples, owner, and tests; names alone are not enough.
```

```text
When data is inferred, approximate, disputed, or source-conflicting, model uncertainty and verification state instead of storing guesses as facts.
```

```text
Prefer concrete domain models over universal generic schemas unless real variability justifies the loss of constraints, clarity, and queryability.
```

```text
Do not encode estimates, guesses, samples, stale values, or rounded measures as exact facts without precision/context metadata.
```

```text
Preserve provenance for imported, integrated, transformed, or disputed data so values can be traced, trusted, and corrected.
```

```text
Clarify conceptual entities, identities, relationships, states, and rules before committing to physical tables, APIs, or storage structures.
```

```text
Validate data models with realistic examples and counterexamples before trusting the schema.
```

```text
Do not treat UI flags, caches, workflow states, or technical fields as semantic truth unless explicitly defined and governed.
```

```text
Before encoding important data, reason about its real-world meaning, identity, context, time, relationships, missingness, uncertainty, provenance, and assumptions.
```
