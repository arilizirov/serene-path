# Extracted Codex-Skill Training Material
## Source: _Modeling the Agile Data Warehouse with Data Vault_ — Hans Hultgren

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

This extraction is intentionally written as **operational guidance for an AI coding agent**, not as a human-facing book summary.

Primary engineering domains:

```text
data architecture
data warehousing
data modeling
data vault modeling
enterprise data integration
historical data management
auditability
ETL/ELT
data governance
senior engineering judgment
```

Secondary domains:

```text
analytics architecture
metadata management
data quality
testing
lineage
agile data engineering
schema evolution
production readiness
```

Core source angle:

```text
Data Vault is a modeling approach for agile, auditable, historical enterprise data warehousing. It separates business keys, relationships, and descriptive context into Hubs, Links, and Satellites so data from multiple sources can be integrated over time without losing history or lineage.
```

Important note for Codex extraction:

```text
This source is not about replacing dimensional models for BI presentation. It is mainly about the raw/integrated warehouse layer: historized, auditable, source-traceable, scalable integration that can feed downstream marts, semantic layers, and analytics products.
```

---

# 1. Separate Business Keys, Relationships, and Descriptive Context

## Core teaching

The central Data Vault teaching is that enterprise warehouse data becomes more agile and auditable when it separates three concerns:

```text
Hub: durable business key / core business identity
Link: relationship or transaction connecting business keys
Satellite: descriptive attributes and historical context
```

The engineering behavior being taught is:

```text
Do not collapse identity, relationships, and descriptive history into one brittle warehouse table.
```

For Codex, this means that when modeling an integrated historical warehouse, it should not build one wide table per entity that mixes identity, relationships, source attributes, history, and audit metadata. It should separate the stable business key from volatile descriptive data and relationships.

## Codex trigger

Apply this when Codex is:

- designing an enterprise data warehouse integration layer
- integrating multiple source systems
- modeling historical data
- designing auditable warehouse structures
- handling schema evolution
- preserving source lineage
- building a warehouse foundation before dimensional marts
- modeling master-like business entities from many sources
- creating data models that must survive changing source systems

## Signals and smells

Codex should notice:

- one wide warehouse table stores key, attributes, relationships, and history together
- source changes force table redesign
- descriptive attributes change often
- relationships change independently from entity attributes
- multiple sources provide different attributes for same business key
- source history needs to be preserved
- auditability is important
- schema evolution breaks downstream structures
- hard to track which source produced which value
- integration layer is confused with presentation mart
- warehouse table updates overwrite prior context

## Desired Codex behavior

Codex should identify whether a Data Vault-style separation is useful.

It should ask:

```text
What are the durable business keys?
What relationships connect them?
Which descriptive attributes change over time?
Which source supplied each attribute?
What history must be preserved?
What needs audit lineage?
```

Codex should model identity, relationships, and descriptive context separately when integration/history demands it.

## Implementation guidance

When writing or modifying data models, Codex should:

- create Hubs for core business keys
- create Links for relationships/transactions between Hubs
- create Satellites for descriptive attributes and historized context
- include load date/timestamp and record source metadata
- avoid mixing unrelated attribute change rates in one satellite
- avoid using satellites as business-facing dimensions directly without transformation
- feed downstream marts/views from vault structures
- preserve raw source values and lineage where useful
- avoid overwriting history unless explicitly modeled as correction/restatement

## Review guidance

Codex should ask:

- Is this an integration/historical layer or a BI presentation layer?
- Are business keys separated from attributes?
- Are relationships modeled separately?
- Are descriptive attributes historized?
- Is source lineage captured?
- Are volatile attributes isolated from stable identifiers?
- Does the model support new source systems without major redesign?

## Testing / verification guidance

Codex should recommend:

- hub business key uniqueness tests
- link relationship uniqueness tests
- satellite historization tests
- load timestamp tests
- record source non-null tests
- source-to-vault reconciliation
- duplicate business key detection
- source lineage checks
- history preservation tests

## Tradeoffs and cautions

Data Vault adds modeling complexity. For a small single-source reporting system, a dimensional mart or simple staging model may be enough.

Use Data Vault when the system needs enterprise integration, auditability, historization, source traceability, and agility under source change.

## Example transformation

**Before:**

```text
student_warehouse:
student_id
student_name
family_id
class_id
address
phone
registration_status
source_system
updated_at
```

This one table mixes identity, relationships, current attributes, and changing history.

**After:**

```text
hub_student:
student_hk
student_business_key
load_dts
record_source

hub_family:
family_hk
family_business_key
load_dts
record_source

link_student_family:
student_family_hk
student_hk
family_hk
load_dts
record_source

sat_student_profile:
student_hk
name
date_of_birth
status
load_dts
record_source
hashdiff

sat_student_contact:
student_hk
address
phone
load_dts
record_source
hashdiff
```

## Distilled skill rule

In historical enterprise integration layers, separate business keys, relationships, and descriptive history into Hub, Link, and Satellite-style structures.

---

# 2. Hubs Represent Stable Business Identity

## Core teaching

A Hub stores a unique list of business keys for a core business concept. It represents durable identity, not descriptive attributes.

The engineering behavior being taught is:

```text
Model the stable business identity separately from changing descriptions and source-specific attributes.
```

A Hub answers:

```text
What business thing exists?
What is its durable business key?
Where did this key come from?
When did we first load it?
```

For Codex, Hubs should not become wide entity tables.

## Codex trigger

Apply this when Codex is modeling:

- customer
- student
- family
- product
- account
- order
- invoice
- employee
- supplier
- location
- class/course
- policy/claim
- any durable business entity integrated across sources

## Signals and smells

Codex should notice:

- same business entity appears in multiple source systems
- entity has one or more natural/business identifiers
- descriptive attributes change over time
- source-specific IDs need reconciliation
- warehouse needs identity anchor independent of attributes
- model uses source surrogate IDs as enterprise identity without thought
- duplicate entities appear due to source key differences
- no clear anchor for historical satellites/links

## Desired Codex behavior

Codex should create Hub structures for durable business concepts.

Hub should include:

```text
hub hash key / surrogate key
business key
load timestamp
record source
optional metadata
```

Codex should avoid putting descriptive attributes in Hubs.

## Implementation guidance

Codex should:

- identify real business key, not just database row ID
- create one Hub per core business concept
- preserve source system identifiers when relevant
- generate deterministic hash keys if following hash-key pattern
- enforce uniqueness of business key
- store load date and record source
- avoid mutable descriptive fields in Hub
- handle multi-part business keys consistently
- document key semantics and source mapping

## Review guidance

Codex should ask:

- What business concept does this Hub represent?
- What is the business key?
- Is the key stable?
- Is it source-specific or enterprise-wide?
- Are descriptive attributes incorrectly stored in the Hub?
- Can multiple sources provide this key?
- How are duplicate/alternate keys handled?

## Testing / verification guidance

Codex should recommend:

- uniqueness tests on business key
- non-null business key tests
- hash key consistency tests
- source mapping tests
- duplicate detection tests
- record source/load timestamp tests
- multi-source identity resolution tests where needed

## Tradeoffs and cautions

Choosing the wrong business key is dangerous. Some source keys are technical identifiers, not true business keys. If identity is uncertain, Codex should preserve source keys and avoid premature master identity claims.

A Hub is not a full entity dimension; downstream dimensional models may reshape Hub+Satellite data into dimensions.

## Example transformation

**Before:**

```text
student_dim_like_table:
student_source_id
name
address
class
status
birthdate
```

**After:**

```text
hub_student:
student_hk
student_business_key        -- e.g. stable school/student identity
load_dts
record_source

sat_student_demographics:
student_hk
name
birthdate
...
```

## Distilled skill rule

Use Hubs to anchor stable business keys only; keep changing descriptive attributes in Satellites.

---

# 3. Links Represent Relationships and Transactions Between Business Keys

## Core teaching

Links model associations between Hubs. They capture business relationships, events, or transactions that connect durable business identities.

The engineering behavior being taught is:

```text
Model relationships explicitly instead of burying them inside entity attributes.
```

For Codex, this is critical when relationships have their own history, source lineage, or many-to-many nature.

## Codex trigger

Apply this when Codex is modeling:

- student-family relationship
- student-class enrollment
- order-customer relationship
- invoice-payment relationship
- product-supplier relationship
- account-customer relationship
- shipment-order relationship
- many-to-many relationships
- transactional relationships between business entities

## Signals and smells

Codex should notice:

- relationship stored as mutable foreign key on one entity
- many-to-many relationship flattened into attributes
- relationship changes over time
- historical relationship matters
- relationship has its own source and load metadata
- one source reports relationship differently from another
- transactions connect multiple entities
- downstream reporting needs relationship history
- same relationship appears in multiple systems

## Desired Codex behavior

Codex should create Links when a relationship or event connects two or more Hubs and needs historical/auditable representation.

A Link should include:

```text
link key
hub keys participating in relationship
load timestamp
record source
```

Descriptive attributes about the relationship belong in a Link Satellite.

## Implementation guidance

Codex should:

- identify participating Hubs
- define relationship grain
- create Link for relationship/event
- include record source and load timestamp
- avoid descriptive attributes in the Link itself
- add Link Satellites for relationship context/status/effective dates
- test relationship uniqueness at declared grain
- model many-to-many relationships explicitly
- avoid overwriting historical relationships without versioning

## Review guidance

Codex should ask:

- What relationship/event is this Link modeling?
- Which Hubs participate?
- What is the relationship grain?
- Is this relationship historical?
- Are relationship attributes in a Satellite?
- Does the Link represent a real business association?
- Is the relationship many-to-many or time-dependent?

## Testing / verification guidance

Codex should recommend:

- link key uniqueness tests
- participating hub foreign key tests
- relationship duplicate tests
- record source/load timestamp tests
- relationship historization tests
- source reconciliation for relationship rows
- many-to-many join tests

## Tradeoffs and cautions

Do not create Links for trivial technical joins that have no business meaning. Links should represent business relationships or events that matter analytically/integrationally.

Highly transactional Links can become large; model grain and loading strategy carefully.

## Example transformation

**Before:**

```text
student.current_class_id is overwritten when the student moves.
```

**After:**

```text
hub_student
hub_class

link_student_class:
student_class_hk
student_hk
class_hk
load_dts
record_source

sat_student_class_assignment:
student_class_hk
assignment_status
effective_start_date
effective_end_date
load_dts
record_source
hashdiff
```

## Distilled skill rule

Use Links to model meaningful business relationships or transactions between Hubs, with relationship context historized in Link Satellites.

---

# 4. Satellites Store Descriptive Attributes and History

## Core teaching

Satellites store descriptive context, attributes, and history for Hubs or Links. They capture how descriptive data changes over time and where it came from.

The engineering behavior being taught is:

```text
Keep volatile descriptive data separate and historized instead of overwriting enterprise context.
```

For Codex, Satellites are where most attribute history and lineage lives.

## Codex trigger

Apply this when Codex is modeling:

- changing descriptive attributes
- source-specific attributes
- historical context
- status changes
- address/contact changes
- product/category changes
- relationship details
- audit/source lineage
- descriptive context around Hubs or Links

## Signals and smells

Codex should notice:

- descriptive columns stored directly in Hub or Link
- old values overwritten
- different attributes change at different rates
- multiple sources provide different descriptions
- no record of which source provided an attribute
- wide tables with many unrelated attribute groups
- updates modify rows in place
- no load date/hashdiff/effective tracking
- reporting needs “as was” history

## Desired Codex behavior

Codex should create Satellites to store attribute groups with history.

A Satellite should include:

```text
parent hub/link key
descriptive attributes
load timestamp
record source
hashdiff/change detection
optional end date/effective dating depending pattern
```

Codex should group satellite attributes by source, rate of change, security classification, or semantic cohesion.

## Implementation guidance

Codex should:

- store descriptive attributes in Satellites
- attach Satellite to Hub or Link
- include load timestamp and record source
- use hashdiff/change detection to avoid duplicate unchanged rows
- split Satellites when attributes have different change rates or sources
- separate sensitive attributes where access differs
- preserve historical rows
- avoid updating old Satellite rows except for controlled end-dating if using that pattern
- document Satellite source and meaning

## Review guidance

Codex should ask:

- What parent Hub/Link does this describe?
- Are attributes cohesive?
- Do they come from same source?
- Do they change at similar rate?
- Are sensitive attributes separated?
- Is history preserved?
- Is change detection reliable?
- Is record source captured?

## Testing / verification guidance

Codex should recommend:

- satellite parent key tests
- no duplicate unchanged hashdiff tests
- load timestamp tests
- record source tests
- history preservation tests
- attribute validity tests
- change detection tests
- satellite split/cohesion review

## Tradeoffs and cautions

Too many Satellites can complicate querying and downstream transformations. Too few create wide, volatile, mixed-purpose tables. Codex should split Satellites for meaningful reasons: source, rate of change, security, or semantic grouping.

## Example transformation

**Before:**

```text
hub_student includes:
student_key
name
birthdate
phone
address
medical_notes
registration_status
```

**After:**

```text
hub_student:
student_hk
student_business_key
load_dts
record_source

sat_student_identity:
student_hk
name
birthdate
load_dts
record_source
hashdiff

sat_student_contact:
student_hk
phone
address
load_dts
record_source
hashdiff

sat_student_sensitive_notes:
student_hk
medical_notes
load_dts
record_source
hashdiff
```

## Distilled skill rule

Use Satellites to store historized descriptive attributes with load metadata, source lineage, and coherent attribute grouping.

---

# 5. Record Source and Load Timestamp Are Mandatory Audit Foundations

## Core teaching

Data Vault emphasizes auditability. Every inserted record should be traceable to when it was loaded and where it came from.

The engineering behavior being taught is:

```text
Never load enterprise warehouse data without source and load metadata.
```

For Codex, this means data models and pipelines must include lineage fields from the beginning.

## Codex trigger

Apply this when Codex is:

- creating Hub/Link/Satellite tables
- writing ETL/ELT loads
- integrating sources
- building warehouse foundations
- designing auditability
- reconciling data issues
- supporting compliance/trust requirements

## Signals and smells

Codex should notice:

- warehouse rows lack source system
- no load timestamp
- no batch/run ID
- cannot trace bad data to source
- multiple sources merged without lineage
- no way to know when value arrived
- pipeline debugging depends on logs only
- corrections cannot be audited
- analysts cannot explain differences by source

## Desired Codex behavior

Codex should include audit metadata in every vault structure.

Common metadata:

```text
load_dts
record_source
load_batch_id / run_id
hashdiff
source_record_id where useful
extract_dts where useful
```

## Implementation guidance

Codex should:

- add load_dts and record_source to Hubs, Links, and Satellites
- add batch/run metadata for operational traceability
- preserve source identifiers where useful
- store source system name consistently
- avoid defaulting record_source to vague values like “unknown”
- make pipeline runs queryable
- use metadata in reconciliation and debugging
- include audit fields in tests

## Review guidance

Codex should ask:

- Can this row be traced to a source?
- Can we tell when it was loaded?
- Can we associate it with a pipeline run?
- Can bad data be isolated by source?
- Are source names standardized?
- Is audit metadata present in all vault tables?

## Testing / verification guidance

Codex should recommend:

- non-null load_dts tests
- non-null/accepted record_source tests
- batch ID tests
- source reconciliation tests
- lineage query tests
- pipeline run metadata tests
- audit completeness checks

## Tradeoffs and cautions

Audit metadata increases storage slightly, but it is foundational to Data Vault’s value. Do not omit it from enterprise integration structures.

## Example transformation

**Before:**

```text
student_sat:
student_hk
name
address
```

No traceability.

**After:**

```text
sat_student_contact:
student_hk
phone
address
load_dts
record_source
load_batch_id
hashdiff
```

## Distilled skill rule

Every enterprise warehouse record should include load timestamp and record source metadata so data is auditable and traceable.

---

# 6. Preserve History Through Insert-Only Loading Where Practical

## Core teaching

Data Vault commonly favors insert-only historization: new changes are inserted as new rows rather than overwriting old ones. This preserves historical truth and makes loads auditable.

The engineering behavior being taught is:

```text
Do not overwrite descriptive history in the integration layer unless a deliberate correction/restatement pattern exists.
```

For Codex, this protects historical analysis and auditability.

## Codex trigger

Apply this when Codex is:

- loading Satellites
- processing changed source records
- handling status changes
- designing warehouse history
- preserving audit history
- reconciling source changes
- implementing incremental loads

## Signals and smells

Codex should notice:

- pipeline updates existing Satellite row in place
- old values lost
- no hashdiff/change detection
- source correction and true historical change are not distinguished
- users need as-of reporting
- current-state overwrite table is called historical
- no record of when a value was loaded
- late-arriving changes overwrite newer context

## Desired Codex behavior

Codex should use insert-only patterns for historical descriptive changes.

It should:

```text
compare incoming hashdiff to latest known value
insert new row only when value changed
preserve prior rows
capture load timestamp and source
derive current view downstream if needed
```

## Implementation guidance

Codex should:

- compute hashdiff for Satellite attribute set
- compare to latest Satellite row per parent key/source
- insert new Satellite row on change
- avoid duplicate rows for unchanged data
- create current views if consumers need latest value
- handle late-arriving records based on business/load rules
- document correction/restatement behavior
- avoid destructive updates in raw vault

## Review guidance

Codex should ask:

- Are old values preserved?
- Is this a true change or correction?
- Does load logic avoid duplicate unchanged rows?
- Is current-state derived rather than overwriting history?
- How are late-arriving changes handled?
- Is hashdiff computed consistently?

## Testing / verification guidance

Codex should recommend:

- unchanged source rerun creates no duplicate Satellite row
- changed attribute inserts new row
- old values remain queryable
- current view returns latest row
- hashdiff consistency tests
- late-arriving data tests
- idempotent load tests

## Tradeoffs and cautions

Insert-only history can grow large. Codex should consider partitioning, retention, and archiving. Some legal/business corrections may require restatement patterns, but those should be explicit and audited.

## Example transformation

**Before:**

```text
UPDATE student_profile SET address = new_address WHERE student_hk = ...
```

**After:**

```text
If incoming hashdiff differs from latest sat_student_contact row:
INSERT new sat_student_contact row with new address, load_dts, record_source, hashdiff.
```

## Distilled skill rule

Preserve integration-layer history with insert-only Satellite changes and derive current views downstream.

---

# 7. Hash Keys and Hashdiffs Support Scalable, Repeatable Loading

## Core teaching

Data Vault implementations often use hash keys for deterministic business-key-based joins and hashdiffs for efficient change detection. These support parallel loading, idempotency, and cross-environment consistency.

The engineering behavior being taught is:

```text
Use deterministic keys and change fingerprints to make warehouse loading repeatable and scalable.
```

For Codex, this means being careful with key generation and hashing rules.

## Codex trigger

Apply this when Codex is:

- designing Data Vault table keys
- loading Hubs/Links/Satellites
- implementing ELT jobs
- detecting changes in Satellites
- enabling parallel loads
- integrating multiple sources
- creating deterministic keys across environments

## Signals and smells

Codex should notice:

- sequence-generated keys block parallel/cross-system loads
- hash keys computed inconsistently
- null/trim/case rules differ
- same business key creates different hash in different jobs
- hashdiff includes audit columns accidentally
- unchanged source rows create duplicate Satellite rows
- join keys depend on load order
- hash collision risk ignored entirely

## Desired Codex behavior

Codex should define deterministic hashing standards.

It should specify:

```text
business key normalization
attribute ordering
null handling
case handling
delimiter/escaping
hash algorithm
hashdiff column set
collision strategy
```

## Implementation guidance

Codex should:

- normalize business keys before hashing
- document hash rules centrally
- use same hashing macro/function across pipelines
- exclude load metadata from hashdiff
- include only descriptive attributes in hashdiff
- compute Link hash key from ordered participating Hub keys/business keys
- test hash determinism
- consider collision detection/monitoring for critical systems
- avoid changing hash algorithm casually

## Review guidance

Codex should ask:

- Are hash keys deterministic?
- Are normalization rules consistent?
- Is hashdiff based only on descriptive attributes?
- Are nulls/case/whitespace handled consistently?
- Are Link keys ordered consistently?
- Is collision handling considered?
- Is hashing implemented in shared utility/macro?

## Testing / verification guidance

Codex should recommend:

- hash determinism tests
- same input/same hash across environments
- null/whitespace/case normalization tests
- hashdiff unchanged/changed tests
- link hash order tests
- duplicate business key collision checks
- load idempotency tests

## Tradeoffs and cautions

Hash keys add complexity and require strict standardization. For very small warehouses, simple surrogate keys may be sufficient. But if using Data Vault at scale, inconsistent hash logic is dangerous.

## Example transformation

**Before:**

```text
student_hk = random database identity.
satellite change detected by comparing all columns manually.
```

**After:**

```text
student_hk = hash(normalize(student_business_key))
hashdiff = hash(normalized descriptive attributes)
Incoming row inserts new Satellite version only if hashdiff changed.
```

## Distilled skill rule

Use standardized deterministic hash keys and hashdiffs for repeatable Data Vault loading and change detection.

---

# 8. Split Satellites by Source, Rate of Change, Semantics, or Security

## Core teaching

Satellites should not become giant dumping grounds. Splitting Satellites helps manage different source systems, different change rates, sensitive data, and semantic groupings.

The engineering behavior being taught is:

```text
Group Satellite attributes by why they change, where they come from, how they are governed, and who may access them.
```

For Codex, this prevents wide brittle Satellites that are hard to maintain and secure.

## Codex trigger

Apply this when Codex sees:

- wide Satellite with many unrelated columns
- attributes from multiple sources in one Satellite
- sensitive attributes mixed with non-sensitive ones
- some attributes change frequently and others rarely
- one change causes many unrelated hashdiff updates
- different attribute groups have different quality/governance rules
- downstream consumers need only one subset

## Signals and smells

Codex should notice:

- Satellite has hundreds of columns
- address, demographics, medical notes, status, and source flags all together
- high-churn fields cause frequent new rows for stable attributes
- PII mixed with non-PII
- multiple record sources in same Satellite row without clear rules
- many nulls because sources provide different attributes
- hashdiff changes too often for unrelated reasons

## Desired Codex behavior

Codex should split Satellites intentionally.

Split by:

```text
source system
change rate
semantic cohesion
security classification
data quality/ownership
record source rules
```

## Implementation guidance

Codex should:

- create separate Satellites for cohesive attribute groups
- keep source-specific attributes in source-specific Satellites where useful
- isolate sensitive data in restricted Satellites
- separate high-volatility attributes from stable attributes
- compute hashdiff per Satellite
- document split rationale
- avoid over-fragmentation
- create downstream views when consumers need combined current state

## Review guidance

Codex should ask:

- Do these attributes belong together?
- Do they come from the same source?
- Do they change at the same rate?
- Do they share security/access rules?
- Is the Satellite too wide?
- Is it split so much that loading/querying becomes unnecessarily complex?

## Testing / verification guidance

Codex should recommend:

- hashdiff tests per Satellite
- source-specific load tests
- access tests for sensitive Satellites
- change-rate tests/monitoring if relevant
- current-state view tests combining Satellites
- metadata documenting Satellite purpose

## Tradeoffs and cautions

Too many Satellites can make querying and ETL orchestration harder. Split for clear reasons, not for every field.

## Example transformation

**Before:**

```text
sat_student_all:
name
birthdate
address
phone
medical_notes
registration_status
last_login
source_specific_flag
```

**After:**

```text
sat_student_identity
sat_student_contact
sat_student_sensitive_health
sat_student_registration_status
sat_student_activity
```

## Distilled skill rule

Split Satellites when attribute groups differ by source, volatility, semantics, security, or governance.

---

# 9. Raw Vault and Business Vault Serve Different Purposes

## Core teaching

A Raw Vault preserves source data with minimal business transformation, auditability, and history. A Business Vault applies derived rules, calculations, business logic, quality enrichment, and integration logic.

The engineering behavior being taught is:

```text
Separate source-traceable raw history from derived business interpretation.
```

For Codex, this prevents business rules from corrupting the auditable raw integration layer.

## Codex trigger

Apply this when Codex is:

- designing vault layers
- adding business rules
- deriving metrics
- standardizing source values
- calculating classifications
- reconciling source truth vs business truth
- creating presentation marts from vault
- implementing transformations

## Signals and smells

Codex should notice:

- raw vault table contains heavily transformed business logic
- no preserved source value
- business-derived classifications overwrite source data
- downstream marts depend on raw source quirks
- no place to store derived calculations
- users cannot trace final value back to source
- business rules change and historical derivations need restatement
- data quality corrections mixed into raw loads

## Desired Codex behavior

Codex should distinguish raw and business layers.

Raw Vault:

```text
source-aligned
historical
auditable
minimal transformation
source lineage
```

Business Vault:

```text
derived rules
standardization
calculations
business logic
quality enrichments
point-in-time/current constructs
bridges
```

## Implementation guidance

Codex should:

- load raw source values into Raw Vault with audit metadata
- avoid destructive transformation in Raw Vault
- apply business derivations in Business Vault or downstream marts
- document derivation rules
- version business rules where historical restatement matters
- create derived Satellites/Links/PIT/bridge tables as needed
- preserve lineage from derived values to raw sources
- test derived logic separately

## Review guidance

Codex should ask:

- Is this raw source history or derived business interpretation?
- Are source values preserved?
- Where are business rules applied?
- Can derived values be recalculated?
- Is lineage from business vault to raw vault clear?
- Are rule changes versioned or restated?

## Testing / verification guidance

Codex should recommend:

- raw source reconciliation tests
- business rule transformation tests
- derived value tests
- lineage tests from business to raw
- rule version/restatement tests
- raw-vs-business comparison tests
- mart derivation tests

## Tradeoffs and cautions

Layer separation adds complexity. For small warehouses, a lighter pattern may suffice. But for auditable enterprise data, preserving raw history separately from business interpretation is valuable.

## Example transformation

**Before:**

```text
Raw load transforms multiple source registration statuses into “Active/Inactive” and discards original source status.
```

**After:**

```text
Raw Vault stores original source registration_status.
Business Vault derives standardized_registration_status using governed mapping rules.
Dimensional mart uses standardized status.
```

## Distilled skill rule

Preserve source-traceable history in Raw Vault and apply derived business rules in Business Vault or downstream presentation layers.

---

# 10. Point-in-Time and Bridge Structures Improve Queryability

## Core teaching

Raw Data Vault structures can require many joins and “latest row” logic. Point-in-Time (PIT) and Bridge tables are helper structures that improve performance and usability for downstream consumption.

The engineering behavior being taught is:

```text
Keep the vault auditable, then build governed helper structures for efficient querying.
```

For Codex, this means not forcing BI queries to directly navigate raw Hubs, Links, and Satellites every time.

## Codex trigger

Apply this when Codex sees:

- downstream queries repeatedly need current/latest Satellite values
- many Satellite joins with load date logic
- reporting performance issues on vault structures
- complex relationship navigation
- dimensional marts derived from vault
- current-state views over historical vault data
- bridge relationships needed for hierarchy or many-to-many paths

## Signals and smells

Codex should notice:

- every query repeats same “latest satellite row” logic
- consumers join 10+ vault tables manually
- BI directly queries Raw Vault
- performance suffers due to historized joins
- current-state views are duplicated inconsistently
- relationship traversal logic copied across marts
- PIT/Bridge logic embedded in dashboards

## Desired Codex behavior

Codex should recommend PIT/Bridge/helper structures where they add query performance and consistency.

PIT tables:

```text
precompute relevant Satellite row pointers for a Hub/Link at a point in time
```

Bridge tables:

```text
precompute relationship paths or many-to-many structures
```

## Implementation guidance

Codex should:

- create PIT tables for common current/as-of queries
- create Bridge tables for common relationship traversals
- refresh helper tables through controlled pipelines
- document snapshot/as-of semantics
- reconcile PIT/Bridge rows to source vault structures
- use helpers to feed marts/views
- avoid making PIT/Bridge the raw source of truth
- test refresh completeness and correctness

## Review guidance

Codex should ask:

- Are consumers repeatedly solving same vault join problem?
- Is PIT/Bridge needed for performance or consistency?
- What as-of date/point does PIT represent?
- Is helper structure derived and rebuildable?
- Are refresh rules documented?
- Is BI shielded from raw vault complexity?

## Testing / verification guidance

Codex should recommend:

- PIT current/as-of correctness tests
- Bridge relationship path tests
- helper rebuild tests
- reconciliation to Hub/Link/Satellite base tables
- performance tests
- downstream mart derivation tests
- refresh freshness tests

## Tradeoffs and cautions

PIT/Bridge tables are derived structures and add maintenance. Do not create them before query patterns justify them.

## Example transformation

**Before:**

```text
Each dashboard query joins hub_student to sat_student_identity, sat_student_contact, sat_student_status and manually selects latest rows.
```

**After:**

```text
pit_student_current:
student_hk
identity_sat_load_dts
contact_sat_load_dts
status_sat_load_dts
as_of_dts

Current student view joins through PIT consistently.
```

## Distilled skill rule

Use PIT and Bridge structures to make historized vault data queryable and performant without compromising raw auditability.

---

# 11. Data Vault Supports Agile Source Evolution

## Core teaching

Data Vault is designed to adapt when new sources, attributes, and relationships arrive. By separating Hubs, Links, and Satellites, new descriptive context can be added without redesigning the whole warehouse.

The engineering behavior being taught is:

```text
Model the warehouse so new source systems and changing attributes can be added incrementally.
```

For Codex, this is one of Data Vault’s main advantages over brittle wide integrated tables.

## Codex trigger

Apply this when:

- source systems change often
- new sources will be integrated
- warehouse must evolve over time
- business adds new attributes
- new relationships appear
- agile delivery of data warehouse increments is needed
- schema evolution is a recurring pain

## Signals and smells

Codex should notice:

- adding a new source requires altering many tables
- integrated table has many nullable source-specific fields
- source-specific attributes clutter enterprise model
- schema changes break existing marts
- new relationship requires redesign of entity table
- warehouse release cycles are slow
- data model is too rigid for incremental delivery

## Desired Codex behavior

Codex should use vault extensibility principles.

It should:

```text
anchor stable Hubs
add new Satellites for new source attributes
add new Links for new relationships
preserve existing structures
avoid breaking existing consumers
derive updated marts downstream
```

## Implementation guidance

Codex should:

- identify stable business keys early
- add source-specific Satellites instead of altering core structures unnecessarily
- add Links for new relationships
- maintain backward-compatible derived views/marts
- version downstream contracts when necessary
- document new source mappings
- test new source load independently
- avoid over-integrating uncertain attributes too early

## Review guidance

Codex should ask:

- Does this change require redesign or can it be added as Satellite/Link?
- Are existing Hubs stable?
- Does new source provide known business keys?
- Are source-specific fields isolated?
- Are downstream consumers protected?
- Is lineage for new source clear?

## Testing / verification guidance

Codex should recommend:

- new source reconciliation tests
- new Satellite load tests
- new Link relationship tests
- backward compatibility tests
- downstream mart regression tests
- metadata/catalog update checks
- load idempotency tests

## Tradeoffs and cautions

Data Vault agility depends on good business key choices and disciplined modeling. If Hubs are wrong, later agility suffers.

## Example transformation

**Before:**

```text
Adding transport spreadsheet data requires altering student_warehouse table with route_code, pickup_time, driver_name, transport_notes.
```

**After:**

```text
Existing hub_student remains unchanged.
Add:
hub_route
link_student_route
sat_student_route_assignment
sat_route_details

Existing registration/payment marts keep working.
```

## Distilled skill rule

Support agile warehouse evolution by adding new Satellites and Links around stable Hubs instead of redesigning integrated tables for every source change.

---

# 12. Data Vault Is Not the Presentation Layer

## Core teaching

Data Vault structures are excellent for integration, history, and auditability, but they are not usually the ideal shape for end-user BI. Presentation layers such as dimensional marts, semantic models, or data products should be derived from the vault.

The engineering behavior being taught is:

```text
Do not expose raw vault complexity directly to business users unless they are technical consumers who need it.
```

For Codex, this prevents turning BI users into Data Vault join experts.

## Codex trigger

Apply this when:

- dashboards query Hubs/Links/Satellites directly
- analysts struggle with vault schema
- user asks for reports from Data Vault
- building marts from vault
- designing semantic layer
- creating data products over vault
- deciding what warehouse layer consumers should use

## Signals and smells

Codex should notice:

- BI queries join many Hubs/Links/Satellites manually
- users duplicate latest-row logic
- raw technical names exposed to business consumers
- performance is poor
- metric definitions scattered across vault queries
- reports disagree due to different vault interpretations
- no dimensional/presentation layer over vault

## Desired Codex behavior

Codex should derive consumer-friendly models from vault structures.

Options:

```text
dimensional marts
wide current-state views
semantic models
data products
aggregated facts
business vault helper structures
```

## Implementation guidance

Codex should:

- use vault as auditable integration source
- build dimensional marts for BI analytics
- create semantic layer for metrics
- expose curated data products for domain consumers
- hide raw audit columns from general users
- preserve lineage from mart/product back to vault
- test mart derivation from vault
- document grain and definitions in presentation layer

## Review guidance

Codex should ask:

- Who is the consumer?
- Should they query Raw Vault directly?
- Is there a presentation model?
- Are metrics defined outside raw vault queries?
- Is lineage preserved from presentation to vault?
- Are PIT/Bridge structures needed?

## Testing / verification guidance

Codex should recommend:

- mart-to-vault reconciliation
- semantic metric tests
- current view correctness tests
- lineage tests
- dashboard acceptance tests
- performance tests
- user-facing documentation checks

## Tradeoffs and cautions

Some technical/data engineering consumers may need direct vault access. But broad BI should usually use curated presentation layers.

## Example transformation

**Before:**

```text
Finance dashboard joins hub_family, hub_student, link_family_student, sat_payment_status, sat_family_contact, hub_payment, link_payment_family manually.
```

**After:**

```text
Data Vault feeds:
payment_fact
family_dim
student_dim
date_dim

Finance dashboard uses dimensional mart with governed metrics.
```

## Distilled skill rule

Use Data Vault as an auditable integration foundation and derive user-friendly marts, views, or data products for consumption.

---

# 13. Business Keys Require Careful Discovery and Stewardship

## Core teaching

Data Vault depends heavily on business keys. Poor key choices create duplicates, bad integration, and painful downstream modeling.

The engineering behavior being taught is:

```text
Treat business key selection as a domain and governance decision, not just a technical column choice.
```

For Codex, this means it must not casually use a database ID as a business key without checking meaning and stability.

## Codex trigger

Apply this when Codex is:

- creating Hubs
- integrating multiple sources
- modeling master data
- resolving identity
- designing enterprise keys
- merging datasets
- mapping source identifiers
- loading warehouse foundations

## Signals and smells

Codex should notice:

- source table primary key used as enterprise business key automatically
- same real entity has multiple IDs
- source IDs are reused or unstable
- natural key changes over time
- business key contains source-specific technical meaning
- no cross-source identity rules
- duplicate Hubs created for same business entity
- composite keys not documented
- business cannot explain what key represents

## Desired Codex behavior

Codex should analyze business keys carefully.

It should ask:

```text
What uniquely identifies this business concept?
Is the key stable?
Is it globally unique or source-specific?
Can it change?
Can multiple sources provide it?
How are duplicates/matches resolved?
Who governs identity?
```

## Implementation guidance

Codex should:

- document business key semantics
- preserve source identifiers separately
- avoid assuming technical surrogate IDs are business keys
- use composite keys when necessary and standardized
- include source system in key when key is source-scoped
- create identity mapping/cross-reference structures where needed
- involve domain/stewardship for ambiguous keys
- test for duplicates and collisions

## Review guidance

Codex should ask:

- Is this a true business key?
- Is it stable and unique?
- Is it source-specific?
- Is identity resolution needed?
- Are duplicate/matching rules defined?
- Is the business key documented?
- What happens if source changes the key?

## Testing / verification guidance

Codex should recommend:

- key uniqueness tests
- key null/format tests
- duplicate entity detection
- cross-source matching tests
- source-scoped key tests
- key change tests
- hub load idempotency tests

## Tradeoffs and cautions

Sometimes no perfect business key exists. Codex should preserve source keys and model identity uncertainty rather than inventing false certainty.

## Example transformation

**Before:**

```text
hub_student uses source database row id as student_business_key.
```

**After:**

```text
Codex evaluates:
- Is TZ available?
- Is TZ allowed/safe to use?
- Is school-assigned student number stable?
- Are multiple source IDs mapped?
- Is identity matching needed?

hub_student stores chosen stable business key and keeps source IDs in mapping/metadata.
```

## Distilled skill rule

Select Hub business keys through explicit domain analysis, source mapping, and stewardship; never assume technical source IDs are enterprise identity.

---

# 14. Data Vault Loading Should Be Idempotent and Parallelizable

## Core teaching

A strong Data Vault load pattern should support repeatable, idempotent, and parallel loading. Hubs, Links, and Satellites can often be loaded independently because they use deterministic keys and insert-only patterns.

The engineering behavior being taught is:

```text
Design warehouse loads so reruns do not corrupt data and independent structures can load safely.
```

For Codex, this means avoiding fragile ETL dependencies and load-order assumptions where possible.

## Codex trigger

Apply this when Codex is:

- writing Data Vault load jobs
- designing ELT orchestration
- building incremental pipelines
- integrating multiple sources
- handling retries/backfills
- optimizing load performance
- recovering from failed loads

## Signals and smells

Codex should notice:

- rerunning a load creates duplicates
- load order depends on generated sequence IDs
- failed job leaves partial corrupt state
- Hubs/Links/Satellites cannot load independently
- no idempotency keys
- no duplicate detection
- batches cannot be replayed
- pipeline uses update-in-place without audit
- parallel loads create inconsistent keys

## Desired Codex behavior

Codex should design idempotent loading.

It should:

```text
derive keys deterministically
insert only new Hubs/Links
insert Satellite changes only when hashdiff differs
track batch/run metadata
support safe reruns
isolate failed batches
```

## Implementation guidance

Codex should:

- use deterministic hash keys or consistent keying
- use merge/insert-if-not-exists for Hubs/Links
- use hashdiff comparison for Satellites
- enforce uniqueness constraints
- record load batch metadata
- design jobs to rerun safely
- use staging tables for batch isolation
- load independent structures in parallel where safe
- reconcile after load

## Review guidance

Codex should ask:

- Can this job be rerun safely?
- Will duplicates be created?
- Are keys deterministic?
- Is load order unnecessarily strict?
- What happens after partial failure?
- Are batches tracked?
- Can backfill run without corrupting history?

## Testing / verification guidance

Codex should recommend:

- rerun/idempotency tests
- duplicate prevention tests
- partial failure/recovery tests
- parallel load tests where relevant
- hashdiff unchanged tests
- batch reconciliation tests
- backfill tests

## Tradeoffs and cautions

Some source systems and tools make perfect idempotency harder. Codex should still design explicit recovery and reconciliation.

## Example transformation

**Before:**

```text
Load job truncates and reloads all vault tables nightly. Failure halfway leaves inconsistent warehouse.
```

**After:**

```text
Load job:
- stages batch
- inserts new Hub keys if not exist
- inserts new Link keys if not exist
- inserts Satellite rows only on hashdiff change
- records batch status
- supports rerun of same batch
```

## Distilled skill rule

Design Data Vault loads to be deterministic, idempotent, batch-audited, and safely rerunnable.

---

# 15. Data Vault Helps Separate Integration from Interpretation

## Core teaching

An enterprise warehouse must integrate source data, but business interpretation can change. Data Vault allows raw integrated facts to remain stable while business rules, classifications, and downstream marts evolve.

The engineering behavior being taught is:

```text
Preserve source-aligned integrated history so changing business interpretations can be reapplied later.
```

For Codex, this is useful for metrics and classifications that may change over time.

## Codex trigger

Apply this when:

- business rules change often
- metrics definitions evolve
- source values need standardization
- historical reports may be restated
- multiple interpretations of same data exist
- raw source data should remain auditable
- downstream marts need recalculation

## Signals and smells

Codex should notice:

- raw values overwritten by current business mapping
- old data cannot be reclassified
- metric changes require re-extracting from source
- business rules mixed into raw load
- no audit trail for derived value
- historical interpretation changes silently
- source context lost

## Desired Codex behavior

Codex should preserve raw/integrated data and apply interpretations downstream.

It should ask:

```text
Is this source fact or business interpretation?
Could this rule change?
Do we need to restate historical outputs?
Can downstream products be rebuilt from raw vault?
```

## Implementation guidance

Codex should:

- store original source values in Raw Vault
- apply mappings/standardizations in Business Vault or marts
- version business rule mappings where needed
- keep derived values traceable to raw inputs
- allow recalculation of marts/products
- document interpretation rules
- test rule changes against historical data

## Review guidance

Codex should ask:

- Are raw values preserved?
- Where is business interpretation applied?
- Can interpretation be changed later?
- Is historical restatement possible?
- Is derived value lineage clear?
- Are mappings governed?

## Testing / verification guidance

Codex should recommend:

- raw preservation tests
- mapping/standardization tests
- rule version tests
- mart rebuild tests
- derived-to-raw lineage tests
- old/new metric comparison tests

## Tradeoffs and cautions

Keeping raw history plus derived interpretations adds layers. For simple stable rules, a direct transformation may be enough. But if auditability and changing definitions matter, preserve raw context.

## Example transformation

**Before:**

```text
Source registration statuses are immediately converted to `active`, `pending`, `cancelled`, and source status is discarded.
```

**After:**

```text
Raw Vault stores original status.
Business Vault applies status mapping v1.
If business definition changes, status mapping v2 can be applied to historical raw data and downstream mart can be restated.
```

## Distilled skill rule

Keep source-aligned integrated history separate from changing business interpretations so downstream products can be recalculated and audited.

---

# 16. Data Vault Requires Metadata Discipline

## Core teaching

Data Vault patterns rely heavily on metadata: business key definitions, source mappings, hash rules, load timestamps, record sources, Satellite groupings, lineage, and model relationships.

The engineering behavior being taught is:

```text
Data Vault without metadata becomes a maze of technical tables.
```

For Codex, this means every vault model must be documented and cataloged.

## Codex trigger

Apply this when Codex is:

- creating Data Vault models
- adding Hubs/Links/Satellites
- writing load jobs
- documenting data lineage
- creating source-to-vault mappings
- designing vault automation
- generating dbt/models/SQL

## Signals and smells

Codex should notice:

- Hub business key not documented
- Satellite split rationale unknown
- record_source values inconsistent
- hash logic hidden in code
- source-to-target mapping missing
- no lineage from source to vault to mart
- table names cryptic
- consumers do not know which Satellite to use
- no model diagram/catalog entry

## Desired Codex behavior

Codex should create metadata for vault structures.

Metadata should include:

```text
business key meaning
source systems
source columns
target Hub/Link/Satellite
hash key logic
hashdiff logic
load frequency
record source standard
Satellite purpose
relationship meaning
lineage to downstream marts
owner/steward
```

## Implementation guidance

Codex should:

- create source-to-vault mapping docs
- standardize table/column naming
- document Hub/Link/Satellite purpose
- store record_source accepted values
- centralize hash rules
- generate/catalog metadata where possible
- include model diagrams or relationship docs
- document downstream consumers/marts
- update metadata with model changes

## Review guidance

Codex should ask:

- Is the business key defined?
- Is the source mapping clear?
- Is hash logic documented?
- Is Satellite purpose clear?
- Is record_source standardized?
- Can a developer trace data to source and mart?
- Is metadata machine-readable where useful?

## Testing / verification guidance

Codex should recommend:

- metadata completeness tests
- accepted record_source tests
- hash rule consistency tests
- source mapping tests
- lineage validation
- catalog generation tests
- documentation review for new vault objects

## Tradeoffs and cautions

Metadata can become stale if manual. Codex should prefer metadata-driven generation and automated validation where possible.

## Example transformation

**Before:**

```text
sat_stu_02 exists with no explanation of source, fields, hashdiff, or purpose.
```

**After:**

```text
sat_student_contact metadata:
parent: hub_student
source: enrollment_system.student_contact
business meaning: contact attributes for student household
hashdiff columns: phone, email, address_line1, city
record_source: ENROLLMENT_DB
owner: Enrollment
downstream: student_dim_current
```

## Distilled skill rule

Document Data Vault business keys, source mappings, hash rules, Satellite purpose, record sources, lineage, and ownership as part of the model.

---

# 17. Automate Data Vault Patterns Carefully

## Core teaching

Data Vault has repeatable patterns that can be automated, but automation depends on good metadata, standards, and review. Blind generation can produce many technically valid but semantically poor objects.

The engineering behavior being taught is:

```text
Use automation to enforce repeatable vault mechanics, but keep business modeling decisions explicit.
```

For Codex, this is especially relevant because Codex can generate many tables quickly. It must not create vault sprawl.

## Codex trigger

Apply this when Codex is:

- generating Data Vault schemas
- creating dbt/Data Vault models
- building scaffolds/templates
- automating Hub/Link/Satellite loads
- creating code generation rules
- using metadata-driven pipeline generation
- designing Codex skills for data architecture

## Signals and smells

Codex should notice:

- generated Hubs for every source table
- generated Links with no business meaning
- Satellites split mechanically without rationale
- naming inconsistent
- metadata missing
- generated code has no tests
- business key choices automated from primary keys blindly
- source staging copied directly into vault with no modeling review
- too many objects for little value

## Desired Codex behavior

Codex should automate mechanics, not judgment.

Automatable:

```text
hash key generation
hashdiff calculation
standard columns
load SQL templates
metadata validation
naming checks
tests
catalog generation
```

Human/architectural judgment required:

```text
business key selection
Hub boundaries
Link meaning
Satellite grouping
source conflict rules
data product/mart design
governance decisions
```

## Implementation guidance

Codex should:

- generate from validated metadata
- require business key definitions
- require relationship definitions
- include tests with generated models
- enforce naming standards
- avoid table-per-source automation without modeling review
- create review checklist for generated vault objects
- produce diagrams/docs from metadata
- allow exceptions with rationale

## Review guidance

Codex should ask:

- Is this generated object semantically justified?
- Was the business key chosen deliberately?
- Does this Link represent a real business relationship?
- Is Satellite grouping intentional?
- Are generated tests included?
- Is metadata complete?
- Is automation creating needless complexity?

## Testing / verification guidance

Codex should recommend:

- generated model compile tests
- metadata validation tests
- hash rule tests
- source-to-target reconciliation tests
- generated uniqueness/non-null tests
- link relationship tests
- satellite historization tests
- naming convention checks

## Tradeoffs and cautions

Automation can accelerate delivery but amplify bad modeling. Codex should not confuse code generation speed with architecture quality.

## Example transformation

**Before:**

```text
Codex automatically creates one Hub for every source table primary key and one Satellite for every source table.
```

**After:**

```text
Codex uses metadata:
- confirmed business keys
- confirmed relationships
- Satellite grouping rationale
- source mappings

Then generates load SQL, hashdiffs, tests, docs, and catalog entries.
```

## Distilled skill rule

Automate Data Vault mechanics from validated metadata, but require explicit business modeling decisions for Hubs, Links, and Satellites.

---

# 18. Data Vault and Dimensional Modeling Are Complementary

## Core teaching

Data Vault is strong for integrated, historical, auditable warehouse foundations. Dimensional modeling is strong for business-facing analytics and BI usability. They can work together.

The engineering behavior being taught is:

```text
Use Data Vault for historized integration and dimensional marts for consumption when both needs exist.
```

For Codex, this prevents false either/or decisions between Data Vault and Kimball.

## Codex trigger

Apply this when user asks:

- “Data Vault or dimensional modeling?”
- “Should BI query Data Vault?”
- “How do we build marts from vault?”
- “What warehouse architecture should we use?”
- “Should we use Kimball or Inmon/Data Vault?”
- “How do we support auditability and BI usability?”

## Signals and smells

Codex should notice:

- BI users forced to query vault structures
- star schema used as raw integration layer for many sources with complex history
- Data Vault proposed for simple dashboards only
- dimensional marts lack lineage/auditability
- debate frames Data Vault and Kimball as mutually exclusive
- historical integration and presentation needs are mixed

## Desired Codex behavior

Codex should select model by layer and purpose:

```text
Raw/staging: source capture
Data Vault: integrated historical auditable foundation
Business Vault: derived business logic/helpers
Dimensional marts: BI/query-friendly presentation
Semantic layer: governed metrics
```

## Implementation guidance

Codex should:

- build Hubs/Links/Satellites for integration/history
- derive dimensions/facts from vault for analytics
- define mart grain and metrics separately
- preserve lineage from mart to vault
- avoid exposing raw vault to broad BI users
- reconcile marts to vault/source
- document layer responsibilities
- choose simpler direct dimensional marts when Data Vault is unnecessary

## Review guidance

Codex should ask:

- What layer are we modeling?
- Is audit/history/source integration a major need?
- Is BI usability a major need?
- Should this be vault, mart, or semantic layer?
- Can marts be rebuilt from vault?
- Is Data Vault excessive here?

## Testing / verification guidance

Codex should recommend:

- vault load tests
- mart derivation tests
- mart-to-vault reconciliation
- lineage tests
- dimensional grain tests
- semantic metric tests
- performance tests for presentation layer

## Tradeoffs and cautions

Do not add Data Vault just because it sounds enterprise-grade. If there is one stable source and simple reporting, dimensional modeling may be enough.

## Example transformation

**Before:**

```text
Team chooses Data Vault and lets analysts query hub/link/satellite tables directly.
```

**After:**

```text
Raw Vault stores auditable source history.
Business Vault creates PIT/current structures.
Dimensional marts expose payment_fact, registration_fact, student_dim, class_dim.
Analysts query marts.
```

## Distilled skill rule

Use Data Vault for auditable historical integration and dimensional/semantic layers for business-facing analytics.

---

# 19. Data Vault Modeling Requires Clear Grain and Relationship Semantics

## Core teaching

Although Data Vault uses different structures than dimensional modeling, it still requires clear grain and relationship meaning. Hubs, Links, and Satellites must represent precise business concepts.

The engineering behavior being taught is:

```text
Do not create vague vault objects; every Hub, Link, and Satellite needs a clear business meaning and grain.
```

For Codex, this prevents Data Vault from becoming a mechanically generated table maze.

## Codex trigger

Apply this when Codex is:

- creating Hubs
- creating Links
- creating Satellites
- modeling transactions
- modeling many-to-many relationships
- designing relationship history
- reviewing generated vault models

## Signals and smells

Codex should notice:

- Link name does not describe relationship
- Link combines multiple relationship types
- Satellite attributes do not share a parent meaning
- Hub business key unclear
- one Link mixes transaction and relationship concepts
- relationship grain not documented
- many nulls due to multiple optional meanings
- consumers cannot explain what object represents

## Desired Codex behavior

Codex should define meaning and grain for each vault object.

Examples:

```text
Hub grain: one row per unique student business key.
Link grain: one row per student-class assignment relationship.
Satellite grain: one row per changed descriptive context for a student contact record.
```

## Implementation guidance

Codex should:

- write object descriptions during model creation
- name Hubs after business concepts
- name Links after relationships/events
- name Satellites after descriptive context
- avoid mixed-grain Links
- split Links/Satellites when meaning differs
- include grain in metadata/docs
- test uniqueness at object grain

## Review guidance

Codex should ask:

- What does one row mean?
- Is this a Hub, Link, or Satellite concern?
- Does this object combine multiple concepts?
- Is the grain testable?
- Is the name business-readable?
- Is the relationship real and useful?

## Testing / verification guidance

Codex should recommend:

- grain uniqueness tests
- duplicate relationship tests
- metadata grain documentation checks
- null-pattern tests revealing mixed meanings
- source reconciliation by object grain
- downstream derivation tests

## Tradeoffs and cautions

Some real-world data is messy and does not map cleanly. Codex should preserve source lineage and model uncertainty explicitly rather than forcing false clarity.

## Example transformation

**Before:**

```text
link_student_misc:
student_hk
class_hk
payment_hk
transport_hk
status
```

This mixes unrelated relationships.

**After:**

```text
link_student_class_assignment
link_student_payment_obligation
link_student_transport_assignment

Each Link has one relationship meaning and grain.
```

## Distilled skill rule

Every Data Vault object must have a clear business meaning and row grain; split objects that mix unrelated concepts.

---

# 20. Senior Engineering Judgment from _Modeling the Agile Data Warehouse with Data Vault_

## Core teaching

The deeper lesson is that enterprise warehouse integration must be agile without sacrificing auditability, history, lineage, and semantic discipline. Data Vault provides a pattern for stable business-key anchors, explicit relationships, historized descriptive context, and metadata-driven loading.

Codex should internalize this:

```text
When enterprise data must integrate many sources over time, preserve business identity, relationships, descriptive history, and source lineage separately so the warehouse can evolve safely.
```

## Codex trigger

Apply broadly when Codex is working on:

- enterprise warehouse foundations
- multi-source integration
- historized data modeling
- auditability
- source lineage
- Data Vault schema design
- source-to-target mapping
- warehouse automation
- downstream dimensional mart derivation
- data architecture strategy

## Signals and smells

Codex should notice:

- wide integrated tables mixing keys/attributes/relationships
- no source lineage
- descriptive history overwritten
- source changes force redesign
- business key ambiguity
- same entity from many sources
- relationships hidden in mutable attributes
- no load metadata
- raw source values lost after business transformations
- BI users querying raw vault complexity
- automated vault generation without semantic review

## Desired Codex behavior

Codex should:

- identify business keys and create Hubs
- model relationships/events as Links
- store descriptive history in Satellites
- include load_dts and record_source everywhere
- preserve raw source history before business interpretation
- split Satellites intentionally
- use deterministic keys/hashdiffs consistently
- design idempotent, rerunnable loads
- create PIT/Bridge helpers when query patterns justify
- derive dimensional marts/data products for consumption
- document metadata, lineage, grain, and source mappings
- avoid applying Data Vault where simpler modeling is enough

## Implementation guidance

Codex should:

- create source-to-vault mappings
- define Hub business key semantics
- define Link relationship grain
- define Satellite attribute group rationale
- add record_source/load_dts/load_batch_id
- implement hashdiff-based change detection
- preserve insert-only history
- test idempotent loads
- create current/PIT views only as derived helpers
- feed dimensional marts from vault where BI usability is needed
- catalog vault objects and downstream lineage

## Review guidance

Codex should check:

- Is Data Vault justified for this problem?
- Are business keys stable and documented?
- Are Hubs free of descriptive attributes?
- Do Links represent real relationships/events?
- Are Satellites cohesive and historized?
- Is source lineage captured?
- Are raw and business transformations separated?
- Are loads idempotent?
- Are presentation consumers shielded from vault complexity?
- Is metadata complete?

## Testing / verification guidance

Codex should recommend:

- Hub key uniqueness tests
- Link relationship uniqueness tests
- Satellite hashdiff/change tests
- load timestamp/source tests
- idempotent rerun tests
- source-to-vault reconciliation
- history preservation tests
- late-arriving data tests
- PIT/Bridge correctness tests
- vault-to-mart reconciliation
- metadata completeness tests
- access tests for sensitive Satellites

## Tradeoffs and cautions

Data Vault is powerful but not free. It introduces more tables, more joins, more metadata, and more modeling discipline. Codex should not recommend it for small, single-source, simple reporting systems unless audit/history/source-change needs justify it.

Use it when:

```text
many sources
uncertain/evolving source structures
strong auditability
historical preservation
enterprise integration
need for agile schema extension
source lineage
regulated or trust-sensitive data
```

Avoid or simplify it when:

```text
single source
simple reporting
small team
low historical/audit needs
BI users need quick dimensional marts
```

## Example transformation

**Before:**

```text
A school organization integrates registration app, billing spreadsheet, transport spreadsheet, and government export into one wide student_reporting table. Each new source adds columns. Old values are overwritten. Source lineage is unclear.
```

**After:**

```text
Data Vault foundation:
Hubs:
- hub_student
- hub_family
- hub_class
- hub_payment
- hub_route

Links:
- link_student_family
- link_student_class_assignment
- link_family_payment
- link_student_route_assignment

Satellites:
- sat_student_identity
- sat_student_contact
- sat_student_registration_status
- sat_payment_details
- sat_route_details

Metadata:
- load_dts
- record_source
- load_batch_id
- hashdiff

Downstream:
- registration_fact
- payment_fact
- student_dim
- family_dim
- class_dim
```

## Distilled skill rule

Use Data Vault when enterprise integration needs auditable, historized, source-traceable, agile modeling through Hubs, Links, Satellites, metadata, and downstream presentation marts.

---

# Compression Candidates for Future `SKILL.md`

These are candidate rules to compress into a future Codex skill:

```text
In historical enterprise integration layers, separate business keys, relationships, and descriptive history into Hub, Link, and Satellite-style structures.
```

```text
Use Hubs to anchor stable business keys only; keep changing descriptive attributes in Satellites.
```

```text
Use Links to model meaningful business relationships or transactions between Hubs, with relationship context historized in Link Satellites.
```

```text
Use Satellites to store historized descriptive attributes with load metadata, source lineage, and coherent attribute grouping.
```

```text
Every enterprise warehouse record should include load timestamp and record source metadata so data is auditable and traceable.
```

```text
Preserve integration-layer history with insert-only Satellite changes and derive current views downstream.
```

```text
Use standardized deterministic hash keys and hashdiffs for repeatable Data Vault loading and change detection.
```

```text
Split Satellites when attribute groups differ by source, volatility, semantics, security, or governance.
```

```text
Preserve source-traceable history in Raw Vault and apply derived business rules in Business Vault or downstream presentation layers.
```

```text
Use PIT and Bridge structures to make historized vault data queryable and performant without compromising raw auditability.
```

```text
Support agile warehouse evolution by adding new Satellites and Links around stable Hubs instead of redesigning integrated tables for every source change.
```

```text
Use Data Vault as an auditable integration foundation and derive user-friendly marts, views, or data products for consumption.
```

```text
Select Hub business keys through explicit domain analysis, source mapping, and stewardship; never assume technical source IDs are enterprise identity.
```

```text
Design Data Vault loads to be deterministic, idempotent, batch-audited, and safely rerunnable.
```

```text
Keep source-aligned integrated history separate from changing business interpretations so downstream products can be recalculated and audited.
```

```text
Document Data Vault business keys, source mappings, hash rules, Satellite purpose, record sources, lineage, and ownership as part of the model.
```

```text
Automate Data Vault mechanics from validated metadata, but require explicit business modeling decisions for Hubs, Links, and Satellites.
```

```text
Use Data Vault for auditable historical integration and dimensional/semantic layers for business-facing analytics.
```

```text
Every Data Vault object must have a clear business meaning and row grain; split objects that mix unrelated concepts.
```

```text
Use Data Vault when enterprise integration needs auditable, historized, source-traceable, agile modeling through Hubs, Links, Satellites, metadata, and downstream presentation marts.
```
