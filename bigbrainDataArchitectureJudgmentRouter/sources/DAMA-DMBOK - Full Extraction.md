# Extracted Codex-Skill Training Material
## Source: _DAMA-DMBOK: Data Management Body of Knowledge_ — DAMA International

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

This extraction is intentionally written as **operational guidance for an AI coding agent**, not as a human-facing book summary.

Primary engineering domains:

```text
data architecture
data management
data governance
data quality
metadata management
master data management
reference data management
data modeling
data warehousing
data security
senior engineering judgment
```

Secondary domains:

```text
product engineering
architecture
testing
production readiness
compliance
data engineering
analytics architecture
lifecycle management
```

Core source angle:

```text
Data is an organizational asset that requires governance, architecture, quality controls, metadata, stewardship, security, lifecycle management, and alignment with business meaning—not just storage, pipelines, or schemas.
```

Important note for Codex extraction:

```text
This source is not primarily a coding book. Its value for Codex is teaching data-management judgment: ownership, governance, quality, definitions, metadata, lifecycle, security, master/reference data, and enterprise data architecture.
```

---

# 1. Treat Data as a Managed Asset

## Core teaching

The foundational teaching is that data should be managed as an organizational asset. It is not merely a byproduct of application code, database tables, APIs, logs, or pipelines.

The engineering behavior being taught is:

```text
When building systems that create, transform, expose, or consume data, Codex should treat data as something with ownership, meaning, quality, security, lifecycle, and business value.
```

For Codex, this means not stopping at “create a table” or “write an API.” It should consider who owns the data, what it means, how it is used, how it is protected, how it changes, and how trust is maintained.

## Codex trigger

Apply this when Codex is:

- designing a database schema
- building a data pipeline
- creating reports or dashboards
- creating APIs that expose data
- designing data products
- integrating multiple systems
- defining metrics
- modifying core business data
- building admin tools
- creating imports/exports
- handling customer/student/payment/employee/product data
- changing data retention or deletion behavior

## Signals and smells

Codex should notice:

- no clear data owner
- no definition of important fields
- same data means different things in different places
- no data quality checks
- no privacy/security classification
- no retention policy
- no metadata or lineage
- no stewardship for shared data
- schema designed only around immediate code needs
- reports disagree because definitions differ
- data is copied without ownership or sync plan
- no distinction between source of truth and derived data

## Desired Codex behavior

Codex should widen data-related work from implementation to stewardship.

It should ask:

```text
What business asset is this data?
Who owns it?
What does it mean?
Who uses it?
What quality level is required?
Is it sensitive?
Where is the source of truth?
How is it governed?
How long is it retained?
How is lineage tracked?
```

Codex should not treat data as anonymous technical storage.

## Implementation guidance

When writing or modifying code, Codex should:

- make source of truth explicit
- use business-aligned names and definitions
- define ownership for critical shared data
- add validation and data quality checks
- include audit/lineage metadata where appropriate
- classify sensitive data
- protect access based on roles/permissions
- avoid uncontrolled copies of data
- document important data definitions
- define lifecycle/retention behavior for important records

## Review guidance

Codex should ask:

- What data asset is being created or changed?
- Who owns this data?
- Is the definition clear?
- Is this authoritative or derived?
- Is this sensitive or regulated?
- What quality controls exist?
- What downstream systems depend on this?
- How is this data retained, archived, or deleted?
- Is lineage visible?

## Testing / verification guidance

Codex should recommend:

- validation tests
- data quality tests
- uniqueness/non-null tests for critical fields
- referential integrity tests
- authorization tests
- lineage/audit field tests
- retention/deletion tests
- source-to-target reconciliation tests
- metadata/catalog checks where applicable

## Tradeoffs and cautions

Do not create heavyweight governance for tiny throwaway data. But when data is shared, sensitive, decision-making, regulated, or business-critical, Codex should include management concerns.

## Example transformation

**Before:**

```text
Codex adds a `students` table with fields needed by one screen.
No owner, no field definitions, no validation, no retention plan.
```

**After:**

```text
Codex defines Student as a core data asset:
- owner: Enrollment/Admin domain
- source of truth: school management database
- sensitive fields: ID number, address, parent contact
- required quality rules: unique student identity, valid date of birth, parent relationship
- lineage: created_by, created_at, source_import_id
- access: role-based
- lifecycle: active, graduated, archived
```

## Distilled skill rule

When creating or changing important data, define its business meaning, ownership, quality expectations, sensitivity, source of truth, and lifecycle.

---

# 2. Data Governance Defines Decision Rights and Accountability

## Core teaching

Data governance is the system of decision rights, responsibilities, policies, standards, and accountability for data. It clarifies who can define, change, access, approve, and resolve issues around data.

The engineering behavior being taught is:

```text
Do not leave important data decisions implicit; assign accountability and decision rights.
```

For Codex, this means that shared data definitions, access rules, quality expectations, and lifecycle decisions should not be buried inside random code.

## Codex trigger

Apply this when Codex is:

- defining shared business entities
- creating enterprise metrics
- changing core data fields
- designing cross-team APIs
- building data products
- creating data warehouse dimensions
- resolving conflicting definitions
- designing role-based access
- building import/export workflows
- creating admin override tools
- handling sensitive data

## Signals and smells

Codex should notice:

- no owner for critical data
- different teams define same metric differently
- field changes break downstream reports
- access decisions are ad hoc
- data quality issues have no escalation path
- no approval process for sensitive changes
- business rules scattered across systems
- schema changes made without stakeholder review
- glossary terms missing or disputed
- no one knows who may correct data

## Desired Codex behavior

Codex should identify governance needs proportional to the data’s importance.

It should define:

```text
data owner
data steward
data consumer
decision authority
access policy owner
quality issue owner
definition owner
change approval process
```

Codex should not over-formalize every field, but should add governance for shared, critical, sensitive, or decision-driving data.

## Implementation guidance

Codex should:

- document ownership of critical entities/metrics
- define approval path for changes to shared definitions
- separate technical owner from business owner where useful
- include data steward responsibilities in docs
- add CODEOWNERS/review rules for critical data models
- define escalation for data quality issues
- make access control policy explicit
- log administrative corrections
- avoid silent schema/metric changes that affect consumers

## Review guidance

Codex should ask:

- Who owns this data definition?
- Who approves changes?
- Who resolves quality issues?
- Who is allowed to correct it?
- Who can access it?
- Who is affected downstream?
- Is there a governance process proportional to risk?
- Is governance encoded in docs, workflow, or code checks?

## Testing / verification guidance

Codex should recommend:

- permission tests
- audit log tests
- workflow approval tests for sensitive changes
- data definition contract tests
- downstream compatibility tests
- ownership documentation checks
- alert/escalation tests for quality issues where applicable

## Tradeoffs and cautions

Too much governance can slow delivery and frustrate teams. Codex should scale governance by risk:

```text
low-risk local data → lightweight ownership
shared metrics/sensitive data → explicit governance
regulated/high-impact data → formal controls
```

## Example transformation

**Before:**

```text
Any developer can change how “active student” is calculated in a dashboard query.
```

**After:**

```text
“Active student” is a governed metric:
- definition stored in semantic layer/docs
- owner: Enrollment
- changes require review from Reporting and Enrollment
- tests compare old/new metric output
- dashboard uses the governed definition
```

## Distilled skill rule

For shared or critical data, define decision rights, ownership, stewardship, and change control instead of leaving data governance implicit.

---

# 3. Data Architecture Connects Business Meaning to Technical Structure

## Core teaching

Data architecture is the discipline of designing how data is collected, stored, integrated, transformed, distributed, secured, and used across the organization.

The engineering behavior being taught is:

```text
Design data structures and flows from business meaning, usage, and lifecycle—not only from application implementation details.
```

For Codex, this means that schemas, pipelines, APIs, and analytics models should fit into a broader data architecture, especially when data crosses systems.

## Codex trigger

Apply this when Codex is:

- designing schemas
- integrating systems
- building data pipelines
- designing reporting layers
- creating APIs
- creating event streams
- moving data between systems
- defining source of truth
- building a data platform
- designing operational + analytical data flows

## Signals and smells

Codex should notice:

- no clear source of truth
- same entity modeled differently in every system
- point-to-point integrations everywhere
- data flows undocumented
- reporting depends directly on operational tables
- analytical and operational needs conflict
- data duplicated without ownership
- no separation between raw, curated, and presentation layers
- no architecture for historical data
- no lifecycle or archival strategy

## Desired Codex behavior

Codex should propose data architecture that clarifies:

```text
data domains
systems of record
data flows
integration patterns
data stores
operational vs analytical models
master/reference data
metadata and lineage
security boundaries
lifecycle states
```

Codex should not design each table/pipeline in isolation.

## Implementation guidance

Codex should:

- identify data domains and sources of truth
- map operational data flows
- separate operational, integration, and analytical layers where useful
- define data contracts for APIs/events/pipelines
- avoid uncontrolled point-to-point data movement
- use appropriate models for OLTP vs analytics
- document data flow and ownership
- define authoritative vs derived datasets
- include lifecycle/retention/archival considerations

## Review guidance

Codex should ask:

- What data domain is this?
- What is the system of record?
- Where does data flow?
- Who consumes it?
- Is this operational or analytical?
- Is the model appropriate for the workload?
- Is data duplicated intentionally?
- Is lineage and ownership clear?

## Testing / verification guidance

Codex should recommend:

- source-to-target reconciliation tests
- contract tests for data interfaces
- schema compatibility tests
- lineage validation
- data flow smoke tests
- quality tests at each layer
- retention/archive tests
- integration tests across data boundaries

## Tradeoffs and cautions

Small applications may not need elaborate enterprise architecture diagrams. But even small systems benefit from explicit source-of-truth and ownership decisions.

## Example transformation

**Before:**

```text
A reporting job reads directly from production tables, transforms data in a spreadsheet, and emails numbers to managers.
```

**After:**

```text
Data architecture:
- School app is system of record for enrollment.
- Raw extracts land in staging.
- Curated enrollment model standardizes definitions.
- Dimensional reporting layer exposes registration facts and student/class dimensions.
- Dashboard reads governed model.
```

## Distilled skill rule

Design data architecture by identifying domains, systems of record, flows, consumers, ownership, and workload-specific models.

---

# 4. Data Modeling Must Capture Business Rules and Meaning

## Core teaching

Data models are not just tables and columns. They are representations of business concepts, relationships, rules, constraints, and meaning.

The engineering behavior being taught is:

```text
Model data so the structure reflects real business semantics and protects important rules.
```

For Codex, this means it should avoid mechanically creating schemas from UI forms or JSON payloads.

## Codex trigger

Apply this when Codex is:

- creating database schemas
- modeling domain entities
- designing API payloads
- creating warehouse dimensions/facts
- adding constraints
- normalizing/denormalizing data
- resolving ambiguous entities
- defining master/reference data
- building imports

## Signals and smells

Codex should notice:

- table mirrors form fields without domain analysis
- IDs and statuses stored as arbitrary strings
- relationships unclear
- no uniqueness constraints
- business rules only in UI code
- entity identity ambiguous
- many nullable columns for unrelated cases
- mixed concepts in one table
- inconsistent names for same concept
- “type” column controls many unrelated fields
- no history strategy for changing attributes

## Desired Codex behavior

Codex should clarify:

```text
entity identity
relationships
cardinality
required vs optional fields
constraints
reference values
lifecycle states
history requirements
ownership
source of truth
```

Codex should model the domain, not merely the current screen.

## Implementation guidance

Codex should:

- define entities and relationships explicitly
- add primary keys, unique constraints, and foreign keys where appropriate
- use reference tables/enums for governed values
- avoid ambiguous string status fields
- represent many-to-many relationships with junction tables
- model lifecycle/status transitions intentionally
- choose normalization/denormalization based on workload
- document non-obvious business rules
- add validation in database and application layers appropriately

## Review guidance

Codex should ask:

- What real-world concept does this table/entity represent?
- What uniquely identifies it?
- What relationships exist?
- What states can it be in?
- What rules must always hold?
- Where are constraints enforced?
- Is this field actually a separate entity/reference?
- Does this model support history if needed?

## Testing / verification guidance

Codex should recommend:

- schema constraint tests
- uniqueness tests
- referential integrity tests
- lifecycle transition tests
- invalid-state tests
- seed data representing real relationships
- migration tests
- data model review with domain users

## Tradeoffs and cautions

Over-modeling can slow simple systems. But under-modeling critical concepts creates data quality, reporting, and integration pain later.

Codex should choose the simplest model that protects important meaning and expected change.

## Example transformation

**Before:**

```text
registration_form table:
student_name
parent_name
class_name
status_text
payment_info
transport_info
```

**After:**

```text
students
families
parents
classes
registrations
registration_status_reference
payments
transport_assignments

Each concept has identity, relationships, constraints, and lifecycle rules.
```

## Distilled skill rule

Model data around real business concepts, identities, relationships, constraints, and lifecycle states—not just UI fields or payload shape.

---

# 5. Metadata Makes Data Understandable and Governable

## Core teaching

Metadata is data about data: definitions, lineage, ownership, quality rules, classifications, schemas, transformations, usage, and context. Without metadata, data becomes difficult to trust, reuse, govern, and debug.

The engineering behavior being taught is:

```text
Capture enough metadata so humans and systems can understand, trace, secure, and manage data.
```

For Codex, this means important datasets should not be self-explanatory only to the original developer.

## Codex trigger

Apply this when Codex is:

- creating datasets
- building pipelines
- defining metrics
- exposing APIs
- creating warehouse models
- designing data products
- creating dashboards
- changing schemas
- adding sensitive fields
- creating imports/exports

## Signals and smells

Codex should notice:

- unclear column meanings
- no data owner
- no lineage from source to dashboard
- no classification of sensitive fields
- no glossary or business terms
- no transform documentation
- dashboards disagree and no one knows why
- pipeline failure cannot be traced
- users do not know if dataset is fresh
- no schema/version history

## Desired Codex behavior

Codex should create or recommend metadata proportional to importance.

Useful metadata includes:

```text
business definition
technical schema
owner/steward
source system
lineage
update frequency
freshness
quality rules
sensitivity classification
retention period
allowed use
known limitations
metric formula
```

## Implementation guidance

Codex should:

- add schema comments/docs for important tables/columns
- document metrics in a semantic layer or glossary
- include lineage fields in pipelines
- tag sensitive fields
- record source system and load timestamps
- document transformation logic
- expose freshness metadata for dashboards
- update metadata when schema changes
- use catalog-friendly naming conventions where possible

## Review guidance

Codex should ask:

- Can a new user understand this dataset?
- Is the owner known?
- Is the source known?
- Is lineage traceable?
- Are sensitive fields classified?
- Are metric definitions documented?
- Is freshness visible?
- Are known limitations documented?

## Testing / verification guidance

Codex should recommend:

- metadata completeness checks
- schema documentation checks
- lineage validation
- freshness tests
- sensitivity tag checks
- metric definition tests
- catalog integration checks where applicable

## Tradeoffs and cautions

Do not create huge documentation for temporary data. Focus metadata effort on shared, reused, sensitive, decision-making, or externally exposed data.

## Example transformation

**Before:**

```text
Table: active_count
Columns: cnt, dt, type
No one knows what “active” means.
```

**After:**

```text
Dataset: active_student_daily_snapshot
Definition: count of students with active registration status on each school day.
Owner: Enrollment
Source: registrations table
Freshness: updated nightly
Quality rule: one row per date/school/class
Sensitivity: aggregate, non-PII
```

## Distilled skill rule

For important datasets, capture metadata for definition, owner, source, lineage, freshness, quality rules, and sensitivity.

---

# 6. Data Quality Must Be Engineered, Not Assumed

## Core teaching

Data quality is the degree to which data is fit for its intended use. Quality must be designed, measured, monitored, and corrected. It is not guaranteed by storing data in a database.

The engineering behavior being taught is:

```text
Build quality controls into data capture, transformation, storage, and consumption.
```

For Codex, this means adding tests and checks for data correctness, completeness, validity, uniqueness, consistency, timeliness, and accuracy.

## Codex trigger

Apply this when Codex is:

- creating data ingestion pipelines
- designing schemas
- loading warehouse facts/dimensions
- building imports
- creating forms
- integrating external data
- defining metrics
- creating reports
- modifying validation rules
- reconciling systems

## Signals and smells

Codex should notice:

- duplicate records
- missing required values
- invalid statuses
- inconsistent reference values
- impossible dates/amounts
- stale dashboards
- source and target row counts differ
- metrics do not reconcile
- bad data silently loaded
- no validation at data entry
- no quality owner
- no error quarantine path

## Desired Codex behavior

Codex should identify quality dimensions relevant to the use case:

```text
accuracy
completeness
consistency
timeliness
validity
uniqueness
integrity
conformity
reasonableness
```

Codex should add checks where bad data would mislead decisions or break workflows.

## Implementation guidance

Codex should:

- validate data at entry and ingestion
- enforce database constraints for critical rules
- add pipeline tests for nulls, uniqueness, accepted values, ranges
- reconcile source and target counts/sums
- quarantine invalid records when appropriate
- expose data quality metrics
- alert on quality thresholds
- document known quality limitations
- assign ownership for quality remediation

## Review guidance

Codex should ask:

- What quality problems are likely?
- Which fields must be complete/valid?
- What constraints can enforce correctness?
- What checks happen at ingestion?
- Are source and target reconciled?
- What happens to bad records?
- Who fixes quality issues?
- Is quality measured over time?

## Testing / verification guidance

Codex should recommend:

- null/not-null tests
- uniqueness tests
- accepted-value tests
- range/reasonableness tests
- referential integrity tests
- freshness tests
- source-to-target reconciliation
- anomaly detection for critical metrics
- duplicate detection
- bad-record quarantine tests

## Tradeoffs and cautions

Too many quality checks can produce alert fatigue. Codex should focus on checks tied to business impact and known failure modes.

Quality rules must distinguish between truly invalid data and legitimately unknown/not-applicable values.

## Example transformation

**Before:**

```text
CSV import accepts all student rows and inserts them.
Bad TZ numbers, duplicate students, missing birthdates, and invalid class codes enter the system.
```

**After:**

```text
Import pipeline:
- validates required fields
- checks TZ format/uniqueness
- validates class code against reference data
- quarantines invalid rows with reason
- reports imported/skipped/failed counts
- allows corrected rerun
```

## Distilled skill rule

Engineer data quality through validation, constraints, reconciliation, monitoring, ownership, and remediation paths.

---

# 7. Master Data Requires Clear Source of Truth and Stewardship

## Core teaching

Master data represents core business entities shared across systems, such as customer, student, product, supplier, employee, account, location, or family. Master data requires identity resolution, stewardship, governance, and consistent use.

The engineering behavior being taught is:

```text
Do not let every system invent its own version of core business entities.
```

For Codex, this means shared entities need clear identity, authoritative source, matching/merge rules, and stewardship.

## Codex trigger

Apply this when Codex is:

- modeling core entities
- integrating systems with overlapping entities
- deduplicating records
- creating APIs for shared entities
- building MDM-like functionality
- creating warehouse dimensions
- resolving “same customer/student/product” issues
- designing imports from multiple sources

## Signals and smells

Codex should notice:

- duplicate customers/students/products
- different systems have different IDs
- no authoritative record
- conflicting names/addresses/statuses
- manual merges without audit
- downstream systems use inconsistent entity definitions
- reports double-count people/products
- master entity attributes updated in multiple places
- no survivorship rules
- no steward for corrections

## Desired Codex behavior

Codex should identify master data and define governance around it.

It should ask:

```text
Is this a core shared entity?
What is the system of record?
How is identity matched?
How are duplicates merged?
Which attributes are authoritative from which source?
Who approves corrections?
How are changes distributed?
```

## Implementation guidance

Codex should:

- define master entity identity rules
- preserve source identifiers
- create cross-reference tables when integrating sources
- add uniqueness constraints where possible
- implement merge/split workflows with audit logs
- define survivorship rules for conflicting attributes
- expose master data through controlled APIs/events
- avoid uncontrolled local copies
- track data steward actions

## Review guidance

Codex should ask:

- Is this master data?
- What uniquely identifies the entity?
- Are duplicates possible?
- Which system owns each attribute?
- How are conflicts resolved?
- Is merge/split audited?
- How do downstream systems receive updates?
- Who stewards data quality?

## Testing / verification guidance

Codex should recommend:

- duplicate detection tests
- identity matching tests
- uniqueness tests
- merge/split workflow tests
- survivorship rule tests
- source cross-reference tests
- audit log tests
- downstream synchronization tests

## Tradeoffs and cautions

MDM can become complex quickly. For small systems, a clear system of record plus uniqueness constraints may be enough. Do not build enterprise MDM infrastructure unless multiple systems and shared identity problems justify it.

## Example transformation

**Before:**

```text
Student exists separately in registration, billing, transport, and reporting systems. Same child can appear under different spellings and IDs.
```

**After:**

```text
Student master:
- master_student_id
- source system IDs
- identity matching rules
- steward-approved merge process
- attribute ownership rules
- audit log for corrections
- downstream update events
```

## Distilled skill rule

For core shared entities, define master identity, system of record, matching/merge rules, stewardship, and downstream synchronization.

---

# 8. Reference Data Must Be Governed and Versioned

## Core teaching

Reference data is controlled vocabulary used to classify or constrain business data: status codes, country codes, class types, payment methods, product categories, school years, currencies, risk ratings, etc.

The engineering behavior being taught is:

```text
Do not scatter critical codes and classifications as hardcoded strings across the system.
```

For Codex, reference data should be explicit, governed, validated, and sometimes versioned.

## Codex trigger

Apply this when Codex sees:

- status strings
- type codes
- categories
- lookup values
- dropdown options
- classifications
- payment methods
- region/country/currency codes
- school/class/program types
- lifecycle states

## Signals and smells

Codex should notice:

- hardcoded strings in many places
- inconsistent spelling/capitalization
- invalid statuses in database
- business meaning of codes unclear
- no owner for code changes
- old codes removed but historical records still use them
- enum changes break reports/integrations
- reference values differ across systems
- no effective dates/versioning

## Desired Codex behavior

Codex should model reference data explicitly.

It should define:

```text
valid values
meaning
owner
lifecycle/status
effective dates if needed
mapping to external codes
allowed transitions if stateful
```

## Implementation guidance

Codex should:

- use reference tables or enums depending on change frequency and governance needs
- validate fields against reference values
- avoid magic strings
- centralize mappings to external systems
- preserve historical codes if old records reference them
- add effective dates/versioning for time-dependent classifications
- define state transition rules when statuses represent lifecycle
- document reference values

## Review guidance

Codex should ask:

- Is this a controlled vocabulary?
- Who owns these values?
- Can values change without deploy?
- Do historical records need old values?
- Are external codes mapped?
- Are invalid values prevented?
- Are lifecycle transitions valid?

## Testing / verification guidance

Codex should recommend:

- accepted-value tests
- foreign key tests to reference tables
- state transition tests
- external mapping tests
- effective-date tests
- no-hardcoded-string checks where useful
- migration tests for code changes

## Tradeoffs and cautions

Enums are simple and type-safe for stable technical values. Reference tables are better for business-managed or frequently changing values. Codex should choose based on governance and change frequency.

## Example transformation

**Before:**

```text
registration.status is free text:
"new", "New", "pending", "PENDING_DOCS", "waiting"
```

**After:**

```text
registration_status_reference:
code
display_name
description
is_active
allowed_next_statuses

registration.status_code references valid code.
```

## Distilled skill rule

Represent important codes, statuses, and classifications as governed reference data with validation, ownership, and history where needed.

---

# 9. Data Security and Privacy Must Be Built Into Data Design

## Core teaching

Data security is not only application authentication. Data architecture must classify sensitive data, restrict access, protect movement/storage, audit usage, and support privacy obligations.

The engineering behavior being taught is:

```text
Design data access and protection based on sensitivity, purpose, and least privilege.
```

For Codex, this means not casually exposing PII or sensitive fields in APIs, logs, dashboards, exports, or test data.

## Codex trigger

Apply this when Codex touches:

- personally identifiable information
- financial data
- health/education records
- authentication/authorization data
- student/family/customer records
- exports/imports
- logs
- analytics datasets
- admin tools
- data sharing APIs
- backups
- test fixtures

## Signals and smells

Codex should notice:

- sensitive fields in logs
- broad admin access
- exports include unnecessary PII
- production data copied to dev
- no field classification
- no masking/tokenization
- no access audit
- dashboards expose row-level personal data unnecessarily
- secrets or credentials in tables/files
- no retention/deletion policy
- sensitive data replicated to many systems

## Desired Codex behavior

Codex should classify data and apply protection.

Protection concerns:

```text
classification
least privilege
purpose limitation
masking
encryption
audit logging
retention/deletion
secure sharing
test data anonymization
access review
```

## Implementation guidance

Codex should:

- identify sensitive fields
- avoid logging sensitive values
- enforce role-based access
- mask/tokenize where appropriate
- encrypt data in transit/at rest where appropriate
- limit exports to necessary fields
- add audit logs for sensitive reads/writes/admin actions
- avoid using production PII in tests
- apply retention/deletion rules
- document sensitivity classification

## Review guidance

Codex should ask:

- Is this data sensitive?
- Who needs access and why?
- Is access least-privilege?
- Is sensitive data logged/exported?
- Is data masked in lower environments?
- Is usage audited?
- Is retention/deletion handled?
- Are downstream copies protected too?

## Testing / verification guidance

Codex should recommend:

- authorization tests
- forbidden access tests
- sensitive logging tests
- export field tests
- audit log tests
- masking/anonymization tests
- retention/deletion tests
- security scan/secret scan
- privacy review for high-risk data

## Tradeoffs and cautions

Security controls must be proportional. Avoid making legitimate business workflows impossible, but never expose sensitive data by default.

Codex should be especially careful with minors/student records, financial data, identity numbers, addresses, and contact information.

## Example transformation

**Before:**

```text
Admin dashboard returns full student TZ numbers, parent phone numbers, addresses, and notes to every staff role.
```

**After:**

```text
Dashboard uses role-based fields:
- general staff sees masked IDs and class info
- authorized admin sees full identity/contact details
- sensitive access is audited
- exports require elevated permission
- logs omit TZ/address/phone values
```

## Distilled skill rule

Classify sensitive data and enforce least-privilege access, masking, audit, retention, and safe logging by design.

---

# 10. Data Lifecycle Management Includes Creation, Retention, Archival, and Deletion

## Core teaching

Data has a lifecycle: creation, use, update, sharing, retention, archival, and deletion/disposal. Systems must deliberately manage lifecycle rather than keeping everything forever by accident.

The engineering behavior being taught is:

```text
Define how long data lives, when it changes state, and how it is archived or deleted.
```

For Codex, this means designing retention, archival, soft-delete, legal/audit preservation, and deletion workflows intentionally.

## Codex trigger

Apply this when Codex is:

- creating tables/entities
- designing file storage
- implementing deletes
- archiving old records
- handling logs/events
- storing exports
- designing backups
- handling user data deletion
- working with audit/compliance records
- creating data retention policies

## Signals and smells

Codex should notice:

- data stored forever by default
- no archive strategy
- soft-delete without purge
- logs grow indefinitely
- exports with PII remain accessible
- old records slow queries
- deletion breaks audit requirements
- no legal hold concept
- no retention distinction between operational and analytical data
- no lifecycle statuses

## Desired Codex behavior

Codex should define lifecycle behavior:

```text
active
inactive
archived
deleted/purged
retained for audit
legal hold
expired
```

It should consider business, legal, security, and operational needs.

## Implementation guidance

Codex should:

- add lifecycle/status fields where useful
- define retention periods for sensitive/large data
- implement archival strategy
- distinguish soft delete vs hard delete
- protect audit records from accidental deletion
- purge temporary files/exports/logs
- add cleanup jobs
- document retention rules
- test deletion/archival effects on reports and references

## Review guidance

Codex should ask:

- How long should this data be retained?
- Can it be deleted?
- Must it be preserved for audit/legal reasons?
- Should it be archived instead of active?
- What happens to dependent records?
- Are backups/exports included in deletion thinking?
- Is there a cleanup process?

## Testing / verification guidance

Codex should recommend:

- retention policy tests
- archival job tests
- deletion/purge tests
- soft-delete visibility tests
- audit preservation tests
- cleanup job idempotency tests
- backup/export retention checks
- referential integrity tests after deletion/archive

## Tradeoffs and cautions

Deleting too much can violate audit/business needs. Keeping too much increases cost, risk, and privacy exposure. Codex should avoid one-size-fits-all retention.

## Example transformation

**Before:**

```text
Uploaded parent ID documents are stored forever in public-ish file storage with no lifecycle.
```

**After:**

```text
Document lifecycle:
- stored encrypted/private
- access audited
- retained while student is active plus required period
- archived after graduation
- purged after retention unless legal hold
- cleanup job removes expired temporary previews
```

## Distilled skill rule

Define lifecycle, retention, archival, deletion, and audit preservation rules for important data instead of keeping everything forever by accident.

---

# 11. Data Integration Requires Contracts, Mapping, and Reconciliation

## Core teaching

Data integration connects systems with different models, meanings, keys, and quality levels. Good integration requires explicit contracts, mappings, transformations, and reconciliation.

The engineering behavior being taught is:

```text
Do not integrate systems by blindly copying fields; define meaning, mapping, ownership, and validation.
```

For Codex, this applies to APIs, file imports, ETL pipelines, event streams, and sync jobs.

## Codex trigger

Apply this when Codex is:

- importing CSV/Excel files
- syncing systems
- creating API integrations
- consuming external data
- publishing events
- mapping source data to target schema
- building ETL/ELT
- integrating government/third-party systems
- reconciling data across systems

## Signals and smells

Codex should notice:

- field mappings undocumented
- source and target meanings differ
- data copied without validation
- no idempotency for imports/sync
- no reconciliation
- no error handling/quarantine
- external codes hardcoded
- sync overwrites local corrections
- duplicate records created
- no lineage to source
- no contract/version handling

## Desired Codex behavior

Codex should define integration contracts and mappings.

It should specify:

```text
source fields
target fields
transformations
validation rules
reference mappings
identity matching
error handling
idempotency
lineage
reconciliation
ownership
```

## Implementation guidance

Codex should:

- write explicit source-to-target mappings
- validate incoming data
- use idempotency keys for imports/events
- preserve source identifiers
- handle rejected rows with reasons
- map external reference codes centrally
- reconcile counts/totals
- support reruns safely
- version integration contracts
- log batch/run metadata

## Review guidance

Codex should ask:

- What contract does the source provide?
- What does each field mean?
- How are source keys matched to target entities?
- What transformations occur?
- What happens to invalid records?
- Can the integration rerun safely?
- How do we reconcile source and target?
- What happens when source schema changes?

## Testing / verification guidance

Codex should recommend:

- mapping tests
- invalid input tests
- duplicate/idempotency tests
- source-to-target reconciliation
- external code mapping tests
- schema compatibility tests
- rerun tests
- rejected row tests
- lineage tests

## Tradeoffs and cautions

Integration design can become heavy. For one-time imports, a lightweight mapping and reconciliation report may be enough. For recurring integrations, robust contracts and monitoring are necessary.

## Example transformation

**Before:**

```text
Codex imports Excel rows directly into students table by matching columns by name.
```

**After:**

```text
Codex creates import mapping:
- source TZ → student_identity_number
- source class code → class reference mapping
- source parent phone → normalized phone
Validation:
- required fields
- duplicate TZ
- known class code
- rejected row report
- import_batch_id lineage
```

## Distilled skill rule

For data integration, define source-target mappings, validation, identity matching, error handling, lineage, idempotency, and reconciliation.

---

# 12. Data Warehousing and BI Need Governed Metrics and Definitions

## Core teaching

Business intelligence fails when metrics are calculated inconsistently. Data management requires governed definitions, semantic consistency, and trust in metrics.

The engineering behavior being taught is:

```text
Define shared metrics once, with clear ownership, grain, formula, and allowed use.
```

For Codex, this connects DMBOK governance with dimensional modeling.

## Codex trigger

Apply this when Codex is:

- creating dashboards
- defining KPIs
- writing metric SQL
- creating semantic layers
- building data marts
- reconciling reports
- creating data products
- reviewing analytics pipelines

## Signals and smells

Codex should notice:

- same metric has different formulas
- dashboard SQL embeds business logic repeatedly
- no metric owner
- “active user/student/customer” undefined
- percentages/averages calculated inconsistently
- reports disagree
- metric grain unclear
- filters differ silently
- BI users create local versions of official metrics

## Desired Codex behavior

Codex should define governed metric specs.

Metric spec should include:

```text
name
business definition
owner
grain
formula
source tables
filters/exclusions
allowed dimensions
refresh frequency
known limitations
validation/reconciliation
```

## Implementation guidance

Codex should:

- centralize metrics in semantic layer/dbt model/API where useful
- document formulas and grain
- avoid duplicating metric SQL in dashboards
- define default filters and exclusions
- classify additive/semi-additive/non-additive measures
- reconcile metrics to source systems
- add tests for metric logic
- require review for shared KPI changes

## Review guidance

Codex should ask:

- Is this metric defined once?
- What is the grain?
- Who owns it?
- What filters/exclusions apply?
- Can it be sliced by requested dimensions?
- Is it additive?
- Does it reconcile to trusted source?
- Are dashboards using the governed metric?

## Testing / verification guidance

Codex should recommend:

- metric unit tests
- reconciliation tests
- semantic layer tests
- dashboard regression tests
- grain/additivity tests
- known example calculations
- change-impact tests for metric updates

## Tradeoffs and cautions

Not every exploratory metric needs governance. But published KPIs, executive dashboards, financial/operational metrics, and cross-team metrics require governance.

## Example transformation

**Before:**

```text
Each dashboard calculates “registered students” differently:
- some count submitted forms
- some count approved forms
- some exclude cancelled
- some count students, others families
```

**After:**

```text
Governed metric:
registered_student_count

Definition:
Count distinct students with approved registration status for selected school year, excluding cancelled registrations.

Owner:
Enrollment

Implemented:
semantic model / dbt metric / reporting view

Tested:
known sample cases and dashboard reconciliation.
```

## Distilled skill rule

For shared BI metrics, define one governed metric with owner, grain, formula, filters, source, refresh, and tests.

---

# 13. Data Operations Need Monitoring, Incident Handling, and Recovery

## Core teaching

Data systems are production systems. Pipelines fail, schemas drift, data arrives late, metrics break, and dashboards go stale. Data operations require monitoring, alerting, recovery, and incident response.

The engineering behavior being taught is:

```text
Operate data pipelines and datasets with the same seriousness as application services.
```

For Codex, this means data work should include freshness checks, error visibility, rerun safety, and runbooks.

## Codex trigger

Apply this when Codex is:

- building ETL/ELT jobs
- creating scheduled data pipelines
- refreshing dashboards
- loading warehouse tables
- syncing data between systems
- creating imports/exports
- designing data products
- handling production analytics

## Signals and smells

Codex should notice:

- pipeline fails silently
- dashboard stale without warning
- no alert on missing source data
- rerun creates duplicates
- no runbook
- bad data loads into production reports
- no pipeline status table
- no SLA/freshness expectation
- no owner for failed job
- no backfill/recovery path

## Desired Codex behavior

Codex should design data operations:

```text
freshness monitoring
pipeline status
error handling
alerting
rerun/backfill
idempotency
runbook
ownership
data quality thresholds
incident response
```

## Implementation guidance

Codex should:

- add pipeline run metadata
- track row counts, failures, durations, freshness
- make jobs idempotent or safely rerunnable
- create quarantine/error tables
- alert on failed/stale pipelines
- define retry/backoff policies
- write runbooks for recovery
- expose status to operators
- log source schema changes

## Review guidance

Codex should ask:

- How do we know the pipeline ran?
- How do we know data is fresh?
- What happens on failure?
- Can the job rerun safely?
- Are bad rows quarantined?
- Who gets alerted?
- Is there a runbook?
- Can backfill be performed?

## Testing / verification guidance

Codex should recommend:

- pipeline failure tests
- rerun/idempotency tests
- freshness tests
- row count anomaly tests
- backfill tests
- bad-row quarantine tests
- alert tests
- runbook dry run
- recovery tests

## Tradeoffs and cautions

Small manual reports may not need full observability. But recurring production dashboards and decision-critical pipelines require operational monitoring.

## Example transformation

**Before:**

```text
Nightly payment pipeline updates dashboard. If it fails, no one knows until someone complains.
```

**After:**

```text
Pipeline records run status, duration, row count, source total, target total, freshness timestamp, and failed rows. Alerts owner if stale or reconciliation fails. Rerun is idempotent.
```

## Distilled skill rule

Production data pipelines need freshness checks, status tracking, error handling, rerun safety, alerting, ownership, and recovery runbooks.

---

# 14. Data Ethics and Responsible Use Must Be Considered

## Core teaching

Data management includes responsible, ethical use of data. Data can harm people if used without purpose limitation, fairness, transparency, consent, access control, or quality.

The engineering behavior being taught is:

```text
Do not build data systems that enable misuse, overexposure, or misleading decisions.
```

For Codex, this means considering privacy, fairness, misuse, and decision impact—especially for sensitive personal data.

## Codex trigger

Apply this when Codex is:

- using personal data
- creating scoring/ranking systems
- building dashboards about people
- exposing sensitive attributes
- using AI/ML on user data
- creating exports
- designing access to student/customer/employee data
- combining datasets in new ways
- creating monitoring/surveillance-like tools

## Signals and smells

Codex should notice:

- data used beyond original purpose
- sensitive attributes exposed unnecessarily
- ranking/scoring without explanation
- low-quality data used for high-stakes decisions
- no access limitation
- no consent/legal basis considered
- hidden profiling
- aggregate report can re-identify individuals
- data copied to AI tools without safeguards
- “because we have the data” reasoning

## Desired Codex behavior

Codex should apply responsible data-use checks:

```text
purpose
necessity
proportionality
consent/legal basis where relevant
access limitation
quality for decision use
explainability
bias/fairness risk
minimization
retention
auditability
```

## Implementation guidance

Codex should:

- minimize sensitive data collection/exposure
- restrict high-risk reports/access
- avoid using low-quality data for high-stakes decisions
- add warnings/metadata about limitations
- aggregate or anonymize where appropriate
- audit sensitive access
- avoid sending private data to external AI/services unless approved
- document purpose and allowed use
- implement retention/deletion controls

## Review guidance

Codex should ask:

- What decision will this data influence?
- Is the data fit for that decision?
- Is sensitive data necessary?
- Could this harm or unfairly affect people?
- Can individuals be re-identified?
- Is use aligned with original purpose?
- Are access and audit controls sufficient?

## Testing / verification guidance

Codex should recommend:

- access control tests
- privacy/minimization review
- anonymization tests
- re-identification risk review for small aggregates
- data quality tests for high-impact metrics
- audit log tests
- model/input governance checks if AI/ML involved

## Tradeoffs and cautions

Ethical review should be proportional. But for personal, student, financial, health, employment, or scoring data, Codex should not ignore responsible-use issues.

## Example transformation

**Before:**

```text
Dashboard shows every student’s family financial balance to all staff.
```

**After:**

```text
Dashboard limits financial details to authorized billing/admin roles, shows aggregate class-level payment completion to teachers, masks sensitive details, and audits access.
```

## Distilled skill rule

For personal or decision-impacting data, minimize exposure, restrict access, document purpose, ensure quality, and consider misuse or harm.

---

# 15. Data Strategy Aligns Data Work with Business Goals

## Core teaching

Data management must support business goals. A data strategy prioritizes data capabilities, quality improvements, architecture investments, governance, and analytics work based on business value.

The engineering behavior being taught is:

```text
Do not improve data systems randomly; align data work with business outcomes and constraints.
```

For Codex, this means recommending data architecture work based on the user’s actual goals, not an abstract enterprise checklist.

## Codex trigger

Apply this when user asks:

- “what data architecture books next?”
- “how should we build our data platform?”
- “what should our data roadmap be?”
- “do we need a warehouse?”
- “how do we improve reporting?”
- “how do we clean our data?”
- “what data governance do we need?”
- “how should Codex plan data work?”

## Signals and smells

Codex should notice:

- data team/platform work not tied to decisions
- governance program with no business pain
- warehouse built before reports/metrics are known
- every possible data capability treated as urgent
- no prioritization
- high-effort cleanup on low-value data
- dashboards built without users or decisions
- data quality work not linked to consequences

## Desired Codex behavior

Codex should connect data work to business goals.

It should identify:

```text
business objective
decision/use case
data needed
current gap
risk/value
first useful slice
governance needed
success metric
```

## Implementation guidance

Codex should:

- prioritize high-value data domains
- start with decision-driving reports/metrics
- improve quality where bad data causes real harm
- avoid building broad platforms before use cases
- sequence data capabilities incrementally
- define success criteria
- document assumptions and revisit them

## Review guidance

Codex should ask:

- What business decision or workflow is improved?
- Who uses this data?
- What value does it create?
- What data gap blocks the goal?
- Is the work proportional?
- What is the first useful deliverable?
- How will success be measured?

## Testing / verification guidance

Codex should recommend:

- stakeholder validation of metrics/reports
- before/after decision quality or time-to-report
- dashboard usage/feedback
- quality improvement metrics
- delivery milestones
- data product adoption checks

## Tradeoffs and cautions

Data strategy can become abstract. Codex should keep it tied to concrete use cases and near-term value.

## Example transformation

**Before:**

```text
Codex recommends building full data governance, MDM, warehouse, catalog, and mesh all at once.
```

**After:**

```text
Codex recommends:
Goal: improve school registration visibility.
First data domain: registration.
First deliverable: registration fact + student/class/date dimensions + dashboard.
Governance: define registered_student_count and data owner.
Later: payments, attendance, full catalog.
```

## Distilled skill rule

Align data architecture and governance work with specific business decisions, users, risks, and measurable outcomes.

---

# 16. Data Stewardship Connects Business and Technical Responsibility

## Core teaching

Data stewards ensure data definitions, quality, usage, and issue resolution are managed. Stewardship bridges business meaning and technical implementation.

The engineering behavior being taught is:

```text
For important data, identify who maintains meaning and quality—not just who owns the code.
```

For Codex, this helps separate technical ownership from business accountability.

## Codex trigger

Apply this when:

- defining critical data fields
- resolving data quality issues
- creating shared metrics
- managing reference data
- handling master data corrections
- creating governance workflow
- building admin correction tools
- designing data catalogs

## Signals and smells

Codex should notice:

- developers decide business definitions alone
- no one resolves conflicting definitions
- data quality issues bounce between teams
- admin users correct data without audit
- reference data changes are ad hoc
- no business owner for KPI
- support tickets about bad data have no owner

## Desired Codex behavior

Codex should identify stewardship responsibilities.

A steward may own:

```text
business definition
acceptable values
quality thresholds
correction process
issue triage
metric definition
reference data changes
documentation
```

## Implementation guidance

Codex should:

- document data steward for critical datasets/metrics
- build workflows for corrections/approvals if needed
- audit steward changes
- expose quality issues to steward
- separate technical schema owner from business meaning owner
- create review process for governed definitions
- include steward in metric/data model validation

## Review guidance

Codex should ask:

- Who defines this data?
- Who resolves disputes?
- Who fixes quality issues?
- Who approves reference data changes?
- Who validates metric meaning?
- Is stewardship visible in docs/workflows?

## Testing / verification guidance

Codex should recommend:

- audit log tests for steward actions
- approval workflow tests
- reference data change tests
- quality issue routing tests
- metadata ownership checks
- dashboard definition approval checks

## Tradeoffs and cautions

In small teams, one person may play multiple roles. The important thing is not title ceremony, but explicit responsibility.

## Example transformation

**Before:**

```text
Developers change class status values whenever a screen needs a new option.
```

**After:**

```text
Class status is governed reference data:
- steward: school administration
- technical owner: app/data team
- new status requires definition and allowed transition
- change is audited
```

## Distilled skill rule

For important data, assign stewardship for definitions, quality, corrections, and reference values—not just technical code ownership.

---

# 17. Data Storage and Operations Must Match Workload and Lifecycle

## Core teaching

Different data stores and structures serve different needs: transactional consistency, analytics, search, archival, streaming, document storage, graph relationships, or cache access. Storage choices must match workload, governance, lifecycle, and operational needs.

The engineering behavior being taught is:

```text
Choose data storage based on access patterns, consistency, lifecycle, sensitivity, and management requirements.
```

For Codex, this overlaps with DDIA but adds governance/lifecycle/management concerns.

## Codex trigger

Apply this when Codex is:

- choosing database/storage
- designing file/object storage
- creating caches
- designing warehouse/lake/lakehouse layers
- storing logs/events
- building search indexes
- archiving data
- splitting operational and analytical stores

## Signals and smells

Codex should notice:

- analytical workload hitting OLTP database
- cache used as source of truth
- files stored with no metadata/retention
- search index treated as authoritative
- cold archive queried like hot store
- transactional store used for large scans
- sensitive data copied to uncontrolled storage
- no backup/restore plan
- no lifecycle tiering

## Desired Codex behavior

Codex should match store to workload.

It should consider:

```text
read/write pattern
transaction needs
query pattern
latency
scale
history
schema evolution
governance
security
backup/restore
retention
cost
operational maturity
```

## Implementation guidance

Codex should:

- use OLTP databases for transactional consistency
- use warehouses/marts for analytics
- use search indexes for search, not source of truth
- use object storage with metadata for files/data lake raw zones
- use caches for derived/temporary acceleration
- define authoritative source
- design backup/recovery and retention
- avoid unnecessary polyglot persistence
- document storage role

## Review guidance

Codex should ask:

- What workload is this storage serving?
- Is it source of truth or derived?
- What consistency is required?
- What retention/security applies?
- Can it be backed up/restored?
- Is operational complexity justified?
- Are consumers using the right store?

## Testing / verification guidance

Codex should recommend:

- backup/restore tests
- data consistency tests
- source-vs-derived reconciliation
- retention lifecycle tests
- performance/load tests
- security/access tests
- cache invalidation tests
- search index rebuild tests

## Tradeoffs and cautions

Adding specialized stores increases operational complexity. Codex should prefer simpler storage unless workload and governance needs justify another component.

## Example transformation

**Before:**

```text
Dashboard runs heavy monthly analytics directly on production registration tables.
```

**After:**

```text
OLTP database remains source of truth.
Nightly pipeline loads dimensional warehouse.
Dashboard queries warehouse.
Reconciliation validates warehouse totals against OLTP.
```

## Distilled skill rule

Choose data stores by workload, consistency, lifecycle, security, and operational requirements; distinguish source-of-truth stores from derived stores.

---

# 18. Document and Govern Data Lineage

## Core teaching

Lineage explains where data came from, how it was transformed, and where it is used. It is essential for trust, debugging, compliance, impact analysis, and governance.

The engineering behavior being taught is:

```text
Make data movement and transformation traceable across systems.
```

For Codex, lineage matters whenever data is copied, transformed, aggregated, or exposed downstream.

## Codex trigger

Apply this when Codex is:

- building ETL/ELT pipelines
- creating derived datasets
- creating dashboards
- exposing APIs
- changing schemas
- debugging wrong metrics
- performing impact analysis
- integrating systems
- migrating data

## Signals and smells

Codex should notice:

- no one knows where a dashboard number comes from
- schema change breaks unknown consumers
- transformations hidden in BI tool
- source field meaning lost
- no source identifiers
- no load batch metadata
- lineage exists only in developer memory
- data quality issue cannot be traced upstream
- impact of changing column unknown

## Desired Codex behavior

Codex should add lineage practices proportional to the data flow.

Lineage can include:

```text
source table/file/API
source field
transformation logic
target table/field
load job
batch ID
timestamp
downstream consumers
metric usage
```

## Implementation guidance

Codex should:

- preserve source identifiers in staging/warehouse
- add load batch/run metadata
- document source-to-target mappings
- avoid hiding transformations in dashboards
- use pipeline tools/catalogs where available
- include lineage comments/docs for important fields
- track downstream dependencies for breaking changes
- expose lineage for key metrics

## Review guidance

Codex should ask:

- Can this data be traced to source?
- Can source change impact be assessed?
- Are transformations visible?
- Are downstream consumers known?
- Does this dataset include load/run metadata?
- Is lineage automated or documented?

## Testing / verification guidance

Codex should recommend:

- source-to-target mapping tests
- lineage metadata non-null tests
- pipeline run metadata tests
- downstream dependency checks
- transformation unit tests
- metric lineage validation
- impact analysis before schema change

## Tradeoffs and cautions

Manual lineage can go stale. Automate where possible, but simple mapping docs are better than no lineage for critical flows.

## Example transformation

**Before:**

```text
Dashboard field “net revenue” is calculated in PowerBI from unclear tables.
```

**After:**

```text
Lineage:
source: payments, refunds
transformation: net_revenue = SUM(payments.amount) - SUM(refunds.amount)
model: finance_revenue_mart
owner: Finance
dashboard: Executive Revenue
tests: reconciliation to accounting export
```

## Distilled skill rule

Track lineage for important data so source, transformations, ownership, and downstream consumers are visible.

---

# 19. Data Architecture Requires Change Management

## Core teaching

Data structures and definitions change over time. Poorly managed data change breaks reports, integrations, APIs, ML models, and downstream consumers.

The engineering behavior being taught is:

```text
Treat schema, metric, and definition changes as contract changes when others depend on them.
```

For Codex, this means adding compatibility, migration, communication, and tests around data changes.

## Codex trigger

Apply this when Codex changes:

- database schema
- API payloads
- event schemas
- warehouse tables
- metrics definitions
- reference data values
- master data rules
- pipeline transformations
- dashboard models

## Signals and smells

Codex should notice:

- column removed/renamed without consumer check
- metric formula changed silently
- reference code deleted while history uses it
- dashboard breaks after schema change
- event consumers fail after payload change
- downstream dependencies unknown
- no deprecation process
- no migration/backfill plan

## Desired Codex behavior

Codex should treat shared data changes as versioned/managed changes.

It should define:

```text
impact analysis
compatibility strategy
migration/backfill
consumer communication
deprecation period
tests
rollback/forward-fix
```

## Implementation guidance

Codex should:

- prefer additive schema changes first
- maintain old and new fields during transition
- version APIs/events where needed
- add compatibility views for warehouse consumers
- update metadata/catalog/glossary
- run impact analysis before breaking changes
- backfill data safely
- communicate metric definition changes
- test downstream dashboards/contracts

## Review guidance

Codex should ask:

- Who consumes this data?
- Is this a breaking change?
- Can old and new versions coexist?
- Is backfill needed?
- Are metrics affected?
- Is metadata updated?
- Is there a rollback or forward-fix path?

## Testing / verification guidance

Codex should recommend:

- schema compatibility tests
- consumer contract tests
- migration/backfill tests
- dashboard regression tests
- old/new metric comparison
- reference data migration tests
- lineage/impact checks

## Tradeoffs and cautions

Internal private tables can change more freely. Shared, published, governed, or persisted data should change carefully.

## Example transformation

**Before:**

```text
Codex renames `student_status` to `registration_status` in warehouse table and updates one dashboard.
```

**After:**

```text
Codex:
1. Adds `registration_status` while keeping `student_status`.
2. Backfills.
3. Updates semantic layer.
4. Tests dashboards.
5. Deprecates old field after consumers migrate.
```

## Distilled skill rule

Manage shared data changes with impact analysis, compatibility, migration, metadata updates, and consumer validation.

---

# 20. Senior Engineering Judgment from DAMA-DMBOK

## Core teaching

The deeper lesson is that data systems succeed only when technical structures are connected to governance, meaning, quality, security, metadata, lifecycle, and business value.

Codex should internalize this:

```text
Data architecture is not just schemas and pipelines; it is the managed lifecycle of trusted business information.
```

## Codex trigger

Apply broadly when Codex is working on:

- business-critical data
- shared entities
- metrics
- dashboards
- data warehouses
- data pipelines
- system integrations
- APIs exposing data
- sensitive data
- imports/exports
- master/reference data
- data platform strategy

## Signals and smells

Codex should notice:

- no data owner
- no source of truth
- unclear definitions
- inconsistent metrics
- missing quality checks
- no metadata/lineage
- no lifecycle/retention
- sensitive data overexposed
- uncontrolled data copies
- no stewardship
- shared data changes without impact analysis
- pipeline failures invisible
- reports not trusted

## Desired Codex behavior

Codex should:

- identify data as an asset
- define ownership and stewardship
- clarify business definitions
- model data around meaning
- assign source of truth
- add data quality controls
- classify sensitivity
- protect access
- manage lifecycle/retention
- document metadata and lineage
- govern master/reference data
- manage data changes as contracts
- align data work with business outcomes

## Implementation guidance

Codex should:

- add constraints, validations, and quality tests
- document critical fields/metrics
- create source-to-target mappings
- include audit/lineage columns where useful
- add role-based access and masking for sensitive data
- use reference tables/enums intentionally
- define master identity rules for shared entities
- make pipelines observable and rerunnable
- add retention/archival cleanup behavior
- write ADRs/runbooks/checklists for important data decisions

## Review guidance

Codex should check:

- What does this data mean?
- Who owns it?
- Who uses it?
- Is it authoritative or derived?
- Is it sensitive?
- What quality checks exist?
- What metadata/lineage exists?
- How does it change?
- How long is it retained?
- What breaks if it is wrong?
- Are downstream consumers protected?

## Testing / verification guidance

Codex should recommend:

- data quality tests
- schema constraint tests
- referential integrity tests
- source-to-target reconciliation
- metadata completeness checks
- lineage tests
- authorization/access tests
- masking/logging tests
- retention/deletion tests
- pipeline freshness/status tests
- metric validation tests
- compatibility tests for data changes

## Tradeoffs and cautions

DMBOK-style data management can become bureaucratic if applied without judgment. Codex should scale practices to data importance:

```text
temporary/local data → lightweight controls
shared/reporting data → definitions, quality, lineage
sensitive/business-critical data → governance, security, stewardship, lifecycle, audit
```

## Example transformation

**Before:**

```text
Codex creates a new “families_export” table for reporting:
- no owner
- no field definitions
- includes full IDs and phone numbers
- refreshed by manual script
- no quality checks
- no retention policy
- dashboard depends on it
```

**After:**

```text
Codex designs a governed dataset:
family_contact_reporting_view
- owner: Family Administration
- source: Families/Parents system of record
- sensitivity: PII, role-restricted
- fields documented
- refresh job records status/freshness
- quality checks validate family_id, parent relationship, phone format
- lineage to source tables
- retention/export policy defined
- dashboard uses masked fields unless authorized
```

## Distilled skill rule

For important data, manage meaning, ownership, quality, security, metadata, lineage, lifecycle, and change impact—not just storage and code.

---

# Compression Candidates for Future `SKILL.md`

These are candidate rules to compress into a future Codex skill:

```text
When creating or changing important data, define its business meaning, ownership, quality expectations, sensitivity, source of truth, and lifecycle.
```

```text
For shared or critical data, define decision rights, ownership, stewardship, and change control instead of leaving data governance implicit.
```

```text
Design data architecture by identifying domains, systems of record, flows, consumers, ownership, and workload-specific models.
```

```text
Model data around real business concepts, identities, relationships, constraints, and lifecycle states—not just UI fields or payload shape.
```

```text
For important datasets, capture metadata for definition, owner, source, lineage, freshness, quality rules, and sensitivity.
```

```text
Engineer data quality through validation, constraints, reconciliation, monitoring, ownership, and remediation paths.
```

```text
For core shared entities, define master identity, system of record, matching/merge rules, stewardship, and downstream synchronization.
```

```text
Represent important codes, statuses, and classifications as governed reference data with validation, ownership, and history where needed.
```

```text
Classify sensitive data and enforce least-privilege access, masking, audit, retention, and safe logging by design.
```

```text
Define lifecycle, retention, archival, deletion, and audit preservation rules for important data instead of keeping everything forever by accident.
```

```text
For data integration, define source-target mappings, validation, identity matching, error handling, lineage, idempotency, and reconciliation.
```

```text
For shared BI metrics, define one governed metric with owner, grain, formula, filters, source, refresh, and tests.
```

```text
Production data pipelines need freshness checks, status tracking, error handling, rerun safety, alerting, ownership, and recovery runbooks.
```

```text
For personal or decision-impacting data, minimize exposure, restrict access, document purpose, ensure quality, and consider misuse or harm.
```

```text
Align data architecture and governance work with specific business decisions, users, risks, and measurable outcomes.
```

```text
For important data, assign stewardship for definitions, quality, corrections, and reference values—not just technical code ownership.
```

```text
Choose data stores by workload, consistency, lifecycle, security, and operational requirements; distinguish source-of-truth stores from derived stores.
```

```text
Track lineage for important data so source, transformations, ownership, and downstream consumers are visible.
```

```text
Manage shared data changes with impact analysis, compatibility, migration, metadata updates, and consumer validation.
```

```text
For important data, manage meaning, ownership, quality, security, metadata, lineage, lifecycle, and change impact—not just storage and code.
```
