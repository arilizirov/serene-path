# Extracted Codex-Skill Training Material
## Source: _Building the Data Warehouse_ — W. H. Inmon

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

This extraction is intentionally written as **operational guidance for an AI coding agent**, not as a human-facing book summary.

Primary engineering domains:

```text
data architecture
enterprise data warehousing
data integration
data modeling
historical data management
analytics architecture
data governance
senior engineering judgment
```

Secondary domains:

```text
data quality
metadata management
ETL/ELT
operational vs analytical systems
architecture
testing
production readiness
lifecycle management
```

Core source angle:

```text
An enterprise data warehouse should provide an integrated, subject-oriented, time-variant, non-volatile foundation for organizational decision support. It is not a copy of operational systems; it is an architectural layer designed to integrate historical data across the enterprise.
```

Important note for Codex extraction:

```text
This source represents the classic enterprise data warehouse / Corporate Information Factory perspective. It is most useful for teaching Codex centralized integration, subject orientation, historical foundations, separation of operational and analytical workloads, and enterprise-level data architecture.
```

---

# 1. Separate Operational Systems from Analytical Systems

## Core teaching

Operational systems and analytical systems serve different purposes. Operational systems support day-to-day transactions. Analytical systems support decision-making, history, trends, comparison, and cross-functional analysis.

The engineering behavior being taught is:

```text
Do not force transactional systems to serve as enterprise analytics systems.
```

Operational systems are optimized for:

```text
current state
transaction speed
update correctness
process execution
application workflows
high concurrency
normalized structures
```

Analytical systems are optimized for:

```text
historical analysis
integrated data
trend reporting
large scans
cross-domain questions
decision support
stable read access
```

For Codex, this means that when a user asks for reporting, BI, dashboards, or decision support, Codex should not simply add more queries against the live application database.

## Codex trigger

Apply this when Codex is:

- building dashboards
- writing reports
- designing analytics tables
- creating reporting APIs
- adding large read queries to production apps
- designing a data warehouse
- copying data from operational systems
- improving performance of business reporting
- combining data across systems
- designing school/business/admin reporting

## Signals and smells

Codex should notice:

- dashboards query OLTP tables directly
- reporting queries slow down production app
- reports require complex joins across normalized application schema
- historical data is overwritten by current state
- operational schema changes break reports
- business users need long-running queries on live database
- no separation between transaction workload and analytics workload
- reporting logic is embedded in application controllers
- users ask “what happened over time?” but database stores only current values
- system cannot answer cross-domain questions without harming operational performance

## Desired Codex behavior

Codex should separate operational and analytical concerns.

It should ask:

```text
Is this query supporting a transaction or a decision?
Does it need current state or historical trend?
Will this workload hurt the operational database?
Does the operational schema preserve the needed history?
Should this be served from a warehouse, mart, read model, or replica?
```

Codex should recommend analytical structures when reporting needs exceed simple operational views.

## Implementation guidance

When writing or modifying code, Codex should:

- keep transactional workflows in operational schema
- move heavy reporting to analytical/read-optimized structures
- create ETL/ELT or replication pipelines when reporting needs are recurring
- preserve operational performance by isolating long-running analysis
- avoid embedding complex BI logic in application code
- keep operational and analytical models separate even if they share source data
- define refresh frequency and freshness expectations for analytical copies
- document which store is source of truth and which is derived

## Review guidance

Codex should ask:

- Is this workload operational or analytical?
- Does this query belong on the production transaction database?
- Is history needed?
- Is the operational schema appropriate for this analysis?
- What is the performance impact on live workflows?
- Is a read replica, warehouse, data mart, or materialized view more appropriate?
- Is the analytical data clearly derived from the operational source?

## Testing / verification guidance

Codex should recommend:

- performance tests for heavy reports
- source-to-warehouse reconciliation
- freshness tests for analytical data
- dashboard query tests against analytical model
- regression tests proving operational behavior unaffected
- load testing if reports may hit production systems
- data-lag monitoring if using replicated/derived data

## Tradeoffs and cautions

For small applications, simple reporting views on operational tables may be sufficient. Do not build a full warehouse when a single indexed query or materialized view solves the problem.

But when reporting becomes cross-domain, historical, recurring, slow, or decision-critical, Codex should recommend analytical separation.

## Example transformation

**Before:**

```text
The admin dashboard calculates registration trends by running complex joins on live Students, Families, Classes, Payments, and Registrations tables.
```

**After:**

```text
Operational app remains optimized for registration workflows.
A nightly warehouse load creates integrated historical reporting tables:
- student registration history
- payment history
- class placement history
- family/account history

Dashboards query the warehouse/read model, not the live transaction schema.
```

## Distilled skill rule

Separate operational transaction systems from analytical decision-support systems when reporting needs are historical, heavy, cross-domain, or recurring.

---

# 2. Build an Integrated Enterprise Data Foundation

## Core teaching

A data warehouse should integrate data from multiple operational systems into a coherent enterprise foundation. It should resolve differences in keys, definitions, formats, codes, names, time, and business meaning.

The engineering behavior being taught is:

```text
Do not let each source system’s local structure and terminology become the enterprise truth.
```

For Codex, this means that data integration is not just moving rows. It involves standardization, mapping, reconciliation, and semantic alignment.

## Codex trigger

Apply this when Codex is:

- integrating multiple source systems
- designing a warehouse foundation
- creating enterprise reporting
- merging data from different departments
- resolving inconsistent customer/student/product/account data
- creating cross-system dashboards
- building ETL/ELT pipelines
- creating canonical data models
- designing a data platform

## Signals and smells

Codex should notice:

- same entity has different IDs in different systems
- codes differ across source systems
- field names look similar but mean different things
- reports depend on source-specific definitions
- dashboard combines data without reconciling definitions
- duplicated entities appear across systems
- each department has its own “truth”
- cross-system reports require manual spreadsheet cleanup
- no enterprise mapping layer
- no standard reference/master data
- no reconciliation between sources

## Desired Codex behavior

Codex should design integration deliberately.

It should ask:

```text
Which systems contribute data?
Which data entities overlap?
Which source is authoritative for each subject/attribute?
How are keys mapped?
How are codes standardized?
How are conflicts resolved?
How is integration tested and reconciled?
```

Codex should create an enterprise layer that is more coherent than the source systems.

## Implementation guidance

Codex should:

- identify source systems and subject areas
- define canonical/enterprise names and meanings
- preserve source identifiers for lineage
- map source keys to enterprise keys
- standardize reference codes
- handle conflicting values through rules/stewardship
- create integration tables/models where useful
- avoid exposing raw source inconsistency in presentation layer
- document source-to-target mappings
- reconcile integrated data to source totals/counts

## Review guidance

Codex should ask:

- Is this truly integrated or just co-located?
- Are keys reconciled?
- Are source-specific codes standardized?
- Are definitions consistent?
- Is source lineage preserved?
- Are conflicts handled intentionally?
- Who owns enterprise definitions?
- Can integrated data reconcile back to sources?

## Testing / verification guidance

Codex should recommend:

- source-to-target row count tests
- key mapping tests
- reference code mapping tests
- duplicate detection
- reconciliation by source system
- conflict/survivorship tests
- lineage field tests
- data quality tests for standardized fields

## Tradeoffs and cautions

Enterprise integration can be expensive. For a single-source system, full integration architecture may be unnecessary. But once multiple systems feed shared decisions, integration becomes critical.

Do not hide unresolved source conflicts by simply choosing one value arbitrarily.

## Example transformation

**Before:**

```text
Reports combine:
- school app student_id
- billing app child_id
- transport spreadsheet name field

Students are matched manually by name.
```

**After:**

```text
Warehouse integration layer:
- maps all source identifiers to enterprise_student_key
- preserves source_student_id, source_child_id, source_transport_id
- applies matching rules
- sends uncertain matches to review
- standardizes class and school-year codes
```

## Distilled skill rule

When integrating sources, standardize keys, definitions, codes, conflicts, and lineage instead of merely copying source tables into one place.

---

# 3. Subject Orientation Organizes Data Around Core Business Concepts

## Core teaching

A warehouse should be subject-oriented. Instead of being organized around applications or transactions, it should be organized around major business subjects such as customer, product, student, family, account, order, payment, class, supplier, employee, or location.

The engineering behavior being taught is:

```text
Organize enterprise analytical data around durable business subjects, not around temporary applications or screens.
```

For Codex, this means that warehouse foundations should reflect the organization’s major information assets.

## Codex trigger

Apply this when Codex is:

- designing enterprise data models
- creating warehouse subject areas
- integrating systems
- organizing data platform schemas
- creating a canonical model
- planning a data warehouse roadmap
- grouping data domains
- modeling long-lived entities

## Signals and smells

Codex should notice:

- warehouse schemas named after source apps only
- reporting tables organized by UI screens
- source systems define all structure
- same subject appears in multiple places
- entity history spread across departments
- no durable business domain organization
- reports about one subject require many unrelated application tables
- new application causes a new disconnected data silo

## Desired Codex behavior

Codex should identify durable subject areas and organize data around them.

Possible subject areas:

```text
Student
Family
Parent/Guardian
Class/Course
School Year
Payment
Invoice
Registration
Attendance
Staff/Teacher
Transport
Product
Customer
Account
Order
```

Codex should separate subject orientation from source orientation.

## Implementation guidance

Codex should:

- define subject areas in warehouse architecture
- map source tables into subject-oriented integrated models
- avoid making application names the primary enterprise structure
- define stable business identifiers where possible
- model relationships between subjects
- preserve source lineage separately
- use subject areas to guide ownership and data stewardship
- expose subject-oriented views/marts to consumers

## Review guidance

Codex should ask:

- What business subject does this data belong to?
- Is this organized around applications or business concepts?
- Will this subject outlive current software?
- Are source-specific details leaking into subject model?
- Does this structure help cross-system analysis?
- Who owns this subject area?

## Testing / verification guidance

Codex should recommend:

- source-to-subject mapping tests
- entity identity tests
- relationship integrity tests
- subject-level reconciliation
- duplicate detection within subject
- cross-source conformance tests
- steward validation of subject definitions

## Tradeoffs and cautions

Operational staging areas may remain source-oriented. Subject orientation is most important in integrated warehouse foundations and presentation layers.

Do not force every small dataset into an enterprise taxonomy prematurely.

## Example transformation

**Before:**

```text
Warehouse folders:
gan_system_tables
billing_app_tables
transport_excel_tables
secretary_upload_tables
```

**After:**

```text
Warehouse subject areas:
student
family
registration
billing
attendance
transport
staff
school_calendar

Each subject integrates data from relevant sources while preserving source lineage.
```

## Distilled skill rule

Organize enterprise analytical data around durable business subjects rather than source applications or UI screens.

---

# 4. Time-Variant Data Preserves History

## Core teaching

A data warehouse is time-variant: it preserves historical data so users can analyze change over time. Operational systems often overwrite current state; warehouses must capture history intentionally.

The engineering behavior being taught is:

```text
If decision support requires history, design history into the data architecture instead of relying on current-state tables.
```

For Codex, this means it should not assume that current operational rows can answer historical questions.

## Codex trigger

Apply this when Codex is:

- designing warehouse tables
- modeling changing entities
- creating historical reports
- tracking trends
- building snapshots
- auditing changes
- answering “as of” questions
- analyzing past states
- integrating data from mutable operational systems

## Signals and smells

Codex should notice:

- operational data overwrites old values
- dashboards ask for trends but history not stored
- old reports change when current attributes change
- status changes are not captured
- no effective dates
- no load timestamps
- no snapshot strategy
- no audit/history tables
- source deletes data needed for history
- historical analysis requires guessing from current rows

## Desired Codex behavior

Codex should identify required historical behavior.

It should ask:

```text
What historical questions must be answered?
Do we need transaction history, state snapshots, or change history?
Do reports need “as was then” or “as classified now”?
How far back must history be retained?
How often is history captured?
```

## Implementation guidance

Codex should:

- add effective dates for historical dimension/entity versions
- create periodic snapshots for state-over-time reporting
- store transaction/event facts for discrete history
- preserve load timestamps and source extract dates
- avoid destructive overwrites in analytical foundations
- capture slowly changing attributes intentionally
- define retention periods for historical data
- document “as-of” semantics
- distinguish corrections from historical changes

## Review guidance

Codex should ask:

- Does this model preserve needed history?
- Are old values overwritten?
- Are effective dates/current flags present where needed?
- Can users answer “what did we know then?”
- Is snapshot frequency appropriate?
- Is history retention defined?
- Are corrections handled differently from real changes?

## Testing / verification guidance

Codex should recommend:

- historical versioning tests
- effective date non-overlap tests
- snapshot completeness tests
- as-of query tests
- correction vs historical-change tests
- retention tests
- reconciliation of historical facts to source extracts

## Tradeoffs and cautions

Storing all history forever can be expensive and risky. Codex should define retention and history detail based on business, legal, cost, and privacy needs.

Not every attribute needs historical tracking.

## Example transformation

**Before:**

```text
student.current_class is overwritten when a child moves classes.
Reports from last year now show the child in the current class.
```

**After:**

```text
student_class_history:
student_key
class_key
effective_start_date
effective_end_date
is_current

Historical reports join by event date to the correct class assignment.
```

## Distilled skill rule

Preserve historical data intentionally with events, snapshots, or effective-dated versions when analytics require time-variant truth.

---

# 5. Non-Volatile Warehouse Data Should Not Be Casually Updated

## Core teaching

A data warehouse is generally non-volatile: data is loaded, integrated, and read for analysis rather than constantly updated like operational data. Changes should be controlled, auditable, and historically meaningful.

The engineering behavior being taught is:

```text
Avoid treating the warehouse as an operational scratchpad or mutable application database.
```

For Codex, this means that warehouse loads, corrections, restatements, and rebuilds must be deliberate.

## Codex trigger

Apply this when Codex is:

- designing warehouse load processes
- updating analytical tables
- correcting warehouse data
- creating dashboards with write-back
- designing backfills/restatements
- building mutable reporting tables
- deciding whether users can edit warehouse data
- creating derived datasets

## Signals and smells

Codex should notice:

- dashboards manually update warehouse rows
- warehouse facts edited without audit
- no batch/load metadata
- reruns overwrite data unpredictably
- historical facts are changed without restatement record
- derived tables used as operational state
- users correct source data only in warehouse
- no distinction between correction, reload, and new historical state
- pipeline deletes/reloads without lineage

## Desired Codex behavior

Codex should make warehouse changes controlled and traceable.

It should distinguish:

```text
new load
correction
restatement
backfill
rebuild
late-arriving data
source-system correction
manual stewardship adjustment
```

## Implementation guidance

Codex should:

- load warehouse data through controlled pipelines
- track batch/run metadata
- make loads idempotent or rerunnable
- avoid manual updates without audit
- preserve source of truth outside warehouse where appropriate
- implement restatement logic for corrected historical data
- use append/version strategies where history matters
- quarantine bad data rather than silently editing facts
- document correction procedures

## Review guidance

Codex should ask:

- Is this warehouse table being updated like an operational table?
- Are corrections auditable?
- Can loads be rerun safely?
- Is this data authoritative or derived?
- Are historical facts being restated?
- Is there load lineage?
- Are manual adjustments controlled?

## Testing / verification guidance

Codex should recommend:

- idempotent load tests
- rerun tests
- batch audit tests
- correction/restatement tests
- backfill tests
- reconciliation after reload
- manual adjustment audit tests
- data drift tests

## Tradeoffs and cautions

Modern warehouses often support updates/merges technically, but the architectural principle remains: analytical changes should be managed and auditable.

Some analytical applications require write-back, but those should be designed as governed workflows, not ad hoc table edits.

## Example transformation

**Before:**

```text
Analyst edits payment_fact.amount directly to “fix” a dashboard.
```

**After:**

```text
Correction process:
1. Fix source payment or create approved adjustment record.
2. Pipeline reloads/restates affected fact.
3. Batch metadata records correction.
4. Reconciliation validates totals.
```

## Distilled skill rule

Treat warehouse data as controlled analytical history; updates, corrections, reloads, and restatements must be auditable and reproducible.

---

# 6. The Warehouse Is a Foundation, Data Marts Are Delivery Mechanisms

## Core teaching

In the classic Inmon architecture, the enterprise data warehouse provides an integrated, normalized, historical foundation. Data marts may then serve specific departmental or analytical needs.

The engineering behavior being taught is:

```text
Do not let isolated departmental marts become disconnected data silos; anchor them in an integrated enterprise foundation when enterprise consistency matters.
```

For Codex, this offers a counterweight to pure bottom-up mart design.

## Codex trigger

Apply this when Codex is:

- designing multiple marts
- integrating departmental reports
- creating enterprise metrics
- deciding between warehouse-first and mart-first approaches
- planning analytics architecture
- resolving inconsistent departmental numbers
- building a reporting platform

## Signals and smells

Codex should notice:

- each department builds its own mart from source
- data marts disagree on shared dimensions/metrics
- no integrated foundation exists
- same entity has different definitions in each mart
- enterprise reporting requires stitching marts manually
- duplicate ETL logic exists
- source-system changes break many marts independently
- no central historical data foundation

## Desired Codex behavior

Codex should decide whether an integrated warehouse foundation is needed before marts proliferate.

It should ask:

```text
Do reports need enterprise consistency?
Are marts sharing subjects/entities?
Are definitions conflicting?
Would a central integrated layer reduce duplication?
Can marts be derived from a common warehouse foundation?
```

## Implementation guidance

Codex should:

- create integrated foundation for shared historical data
- build marts from curated/integrated data where possible
- preserve subject-oriented warehouse structures
- let marts optimize for department/query needs
- avoid independent pipelines duplicating integration logic
- define conformed enterprise definitions
- document which layer is authoritative
- reconcile marts back to warehouse foundation

## Review guidance

Codex should ask:

- Is this mart sourced from trusted integrated data?
- Is it duplicating integration logic?
- Does it conflict with other marts?
- Is enterprise consistency required?
- Are shared definitions governed?
- Can this mart reconcile to the warehouse foundation?

## Testing / verification guidance

Codex should recommend:

- mart-to-warehouse reconciliation
- shared definition tests
- conformed dimension tests
- pipeline lineage tests
- metric consistency tests across marts
- source duplication checks

## Tradeoffs and cautions

A full enterprise warehouse foundation can be slow to deliver if overbuilt. For focused reporting, a dimensional mart may be faster. Codex should balance enterprise consistency with incremental value.

In practice, hybrid approaches are common.

## Example transformation

**Before:**

```text
Finance, Enrollment, and Transport each build separate marts from operational tables. Student counts differ across dashboards.
```

**After:**

```text
Integrated warehouse foundation:
- enterprise student subject
- enterprise family subject
- registration history
- payment history

Departmental marts derive from the foundation and optimize for their reporting needs.
```

## Distilled skill rule

Use an integrated warehouse foundation for shared historical enterprise data, and derive data marts from it when consistency across departments matters.

---

# 7. Data Warehouse Architecture Should Be Layered

## Core teaching

Warehouse architecture benefits from distinct layers: source systems, staging/acquisition, integration/enterprise warehouse, and presentation/delivery marts or BI layers.

The engineering behavior being taught is:

```text
Separate data acquisition, integration, storage, and delivery responsibilities instead of mixing them in one fragile layer.
```

For Codex, this means creating clear boundaries between raw source capture, enterprise integration, and business-facing consumption.

## Codex trigger

Apply this when Codex is:

- designing warehouse architecture
- building ETL/ELT
- creating reporting tables
- organizing schemas/folders
- integrating multiple sources
- creating marts
- creating BI semantic layers
- refactoring messy reporting pipelines

## Signals and smells

Codex should notice:

- BI dashboards query raw source extracts
- staging tables contain business logic
- integration logic is duplicated in dashboards
- raw, cleaned, and presentation data mixed together
- no place for data quality checks
- source changes break reports immediately
- lineage is unclear
- reports contain transformation logic
- marts built directly from operational systems without integration

## Desired Codex behavior

Codex should define logical warehouse layers.

Common layers:

```text
source systems
staging/raw acquisition
cleansing/transformation
integrated enterprise warehouse
data marts / dimensional presentation
semantic/BI layer
archive/history layer
metadata/audit layer
```

## Implementation guidance

Codex should:

- load raw data into staging with minimal transformation
- apply cleansing and standardization in controlled transformations
- integrate subject-oriented historical data in warehouse layer
- create marts/views optimized for consumption
- expose semantic definitions for BI
- keep transformation logic out of dashboard tools where possible
- maintain audit and lineage across layers
- define layer naming conventions

## Review guidance

Codex should ask:

- Which layer does this table/model belong to?
- Is raw source data separated from curated data?
- Is integration logic centralized?
- Are marts sourced from integrated data?
- Is BI consuming presentation models?
- Is lineage clear across layers?
- Are responsibilities mixed?

## Testing / verification guidance

Codex should recommend:

- source-to-staging reconciliation
- staging-to-integration transformation tests
- integration-to-mart reconciliation
- data quality tests per layer
- lineage checks
- freshness checks
- dashboard regression tests

## Tradeoffs and cautions

Do not create too many physical layers for a small system. But preserve logical separation even if implemented with folders/views/schemas in one database.

## Example transformation

**Before:**

```text
dashboard.sql:
- reads operational tables
- cleans phone numbers
- maps status codes
- joins payments
- computes metrics
```

**After:**

```text
stg_students: raw source capture
int_students: cleansed standardized student data
edw_student: integrated historical student subject
mart_registration: dimensional model for BI
dashboard: reads mart only
```

## Distilled skill rule

Separate warehouse layers for raw acquisition, cleansing, integration, presentation, and BI so responsibilities and lineage stay clear.

---

# 8. Normalize the Enterprise Warehouse Foundation When Integration Matters

## Core teaching

Inmon’s approach favors an integrated, normalized enterprise warehouse foundation, with dimensional structures often built downstream as marts. Normalization helps manage integrated subject data, reduce redundancy, and preserve enterprise consistency.

The engineering behavior being taught is:

```text
Use normalized integrated structures for enterprise subject foundations when consistency and integration outweigh query simplicity.
```

For Codex, this means recognizing that star schemas are not the only warehouse modeling approach. The right layer matters.

## Codex trigger

Apply this when Codex is:

- designing enterprise warehouse foundations
- integrating multiple source systems
- preserving historical subject data
- creating canonical enterprise models
- resolving redundancy in core subjects
- separating EDW from data marts
- comparing Inmon vs Kimball approaches

## Signals and smells

Codex should notice:

- one dimensional mart tries to serve all enterprise integration needs
- redundant subject attributes appear across many marts
- conflicting definitions spread across presentation schemas
- source integration logic duplicated in every mart
- no stable integrated subject model
- enterprise entities need consistent history
- analytical delivery model being used as integration foundation

## Desired Codex behavior

Codex should decide which layer is being modeled.

It should distinguish:

```text
enterprise integration layer → may be normalized/subject-oriented
BI presentation layer → often dimensional/star schema
raw staging → source-aligned
```

Codex should not force every layer into star schema or every layer into 3NF.

## Implementation guidance

Codex should:

- use normalized structures for integrated subject areas where appropriate
- avoid redundancy in core enterprise subject data
- preserve historical versions with effective dates/audit structures
- map multiple sources into the integrated model
- derive dimensional marts from integrated foundation for BI
- document layer purpose and modeling style
- keep query usability in marts, not necessarily EDW foundation

## Review guidance

Codex should ask:

- Is this table part of integration foundation or BI presentation?
- Is query simplicity or integration consistency more important here?
- Are subject attributes duplicated across marts?
- Would a normalized foundation reduce conflicting definitions?
- Are dimensional marts still needed for users?
- Is the model over-normalized for its consumption use?

## Testing / verification guidance

Codex should recommend:

- normalization/integrity checks
- source integration reconciliation
- historical subject version tests
- mart derivation tests
- conformance tests between EDW and marts
- entity relationship validation
- data quality tests on canonical subject entities

## Tradeoffs and cautions

Normalized EDW foundations can be harder for analysts to query directly. Codex should not expose highly normalized integration layers as the main BI interface unless users can handle it.

Dimensional marts remain valuable for usability and performance.

## Example transformation

**Before:**

```text
Every mart stores its own version of student name, family address, class status, and school year logic.
```

**After:**

```text
EDW foundation:
student_subject
family_subject
student_family_relationship
class_subject
school_year_subject

Dimensional marts:
student_dim
family_dim
registration_fact
payment_fact
```

## Distilled skill rule

Use normalized subject-oriented structures for enterprise integration foundations, and dimensional marts for business-facing analytics when both are needed.

---

# 9. Preserve Atomic Detail Before Summarization

## Core teaching

The enterprise warehouse should preserve detailed atomic data when feasible. Summaries and marts can be derived later, but once detail is lost, future analysis becomes limited.

The engineering behavior being taught is:

```text
Keep detailed historical data in the warehouse foundation, then summarize for delivery and performance.
```

For Codex, this overlaps with Kimball but applies especially to the EDW foundation.

## Codex trigger

Apply this when Codex is:

- deciding warehouse grain
- loading source transactions
- creating summary tables
- designing marts
- storing history
- optimizing dashboard performance
- deciding retention levels
- building aggregates

## Signals and smells

Codex should notice:

- only monthly summaries are loaded
- detailed source data discarded
- new analysis impossible because detail missing
- summary numbers cannot be reconciled
- report-specific aggregates become source of truth
- drill-down unavailable
- data warehouse cannot answer new questions
- aggregation rules baked in too early

## Desired Codex behavior

Codex should retain atomic detail in the warehouse foundation unless storage/cost/privacy constraints justify otherwise.

It should ask:

```text
What detail is available?
What future questions might need it?
Can summaries be derived from detail?
What retention is required?
What detail is too sensitive or costly to keep?
```

## Implementation guidance

Codex should:

- load detailed transaction/event records where practical
- create summaries as derived outputs
- retain source identifiers and timestamps
- partition/archive detailed history for cost control
- define retention by data class
- reconcile summaries to atomic detail
- support drill-through from summary to detail where useful

## Review guidance

Codex should ask:

- Are we discarding detail too early?
- Can aggregates be rebuilt?
- Is atomic data retained somewhere?
- What questions become impossible?
- Does retention/cost justify summarization only?
- Can detail be archived rather than deleted?

## Testing / verification guidance

Codex should recommend:

- aggregate-to-detail reconciliation
- drill-through tests
- retention/archive tests
- source transaction count reconciliation
- summary rebuild tests
- historical query tests

## Tradeoffs and cautions

Atomic detail increases storage, privacy exposure, and processing cost. Codex should not keep everything forever by default. Retention and archival should be intentional.

## Example transformation

**Before:**

```text
Warehouse stores only total payments per class per month.
```

**After:**

```text
Warehouse foundation stores payment transaction detail.
Monthly payment mart is derived from transaction detail.
Old detail is archived after retention period but remains recoverable for audit if required.
```

## Distilled skill rule

Preserve atomic historical detail in the warehouse foundation when feasible, and derive summaries/marts from it.

---

# 10. Metadata Is Essential to Warehouse Trust

## Core teaching

Enterprise warehouses require metadata: source definitions, transformation rules, lineage, load schedules, ownership, data definitions, quality rules, and usage context. Without metadata, users cannot trust or manage the warehouse.

The engineering behavior being taught is:

```text
A warehouse without metadata becomes an opaque data dump.
```

For Codex, this means warehouse tables/pipelines should include documentation and operational metadata, not just data.

## Codex trigger

Apply this when Codex is:

- creating warehouse tables
- building ETL/ELT jobs
- mapping source to target
- creating marts
- creating metrics
- debugging warehouse data
- designing data catalogs
- documenting data flows

## Signals and smells

Codex should notice:

- no source-to-target mapping
- no load timestamps
- no batch IDs
- no transformation documentation
- no ownership
- no data definitions
- no lineage
- no quality rules
- no refresh/freshness info
- users ask where numbers came from
- pipeline failures hard to trace

## Desired Codex behavior

Codex should attach metadata to warehouse design.

Metadata should include:

```text
business definitions
source systems
source fields
transformation rules
lineage
load frequency
load batch/run ID
owner/steward
quality rules
retention
sensitivity
known limitations
```

## Implementation guidance

Codex should:

- add audit columns such as source_system, source_record_id, load_batch_id, loaded_at
- document source-to-target mappings
- write schema/table comments for important models
- create pipeline run metadata tables
- expose freshness in dashboards
- maintain glossary/metric definitions
- preserve lineage through transformations
- tag sensitive fields
- update metadata during schema changes

## Review guidance

Codex should ask:

- Can users understand this data?
- Can developers trace it to source?
- Is refresh/freshness known?
- Are transformations documented?
- Is owner/steward identified?
- Are sensitivity and retention known?
- Are quality rules recorded?

## Testing / verification guidance

Codex should recommend:

- metadata completeness tests
- lineage field non-null tests
- load audit tests
- freshness tests
- source-to-target mapping tests
- catalog/schema documentation checks
- quality rule validation tests

## Tradeoffs and cautions

Metadata should be useful and maintainable. Avoid documentation that will immediately go stale. Automate metadata capture where possible.

## Example transformation

**Before:**

```text
edw_payment has amount and date, but no source ID, load time, owner, or transformation definition.
```

**After:**

```text
edw_payment includes:
source_system
source_payment_id
load_batch_id
loaded_at
effective_date

Documentation:
- source mapping
- transformation rules
- owner
- reconciliation rule
```

## Distilled skill rule

For warehouse data, capture metadata for source, lineage, transformations, load history, definitions, ownership, quality, and freshness.

---

# 11. Data Warehouse Development Should Be Iterative but Architected

## Core teaching

An enterprise warehouse cannot be built all at once, but it also should not grow as disconnected ad hoc tables. Development should be iterative within an architectural roadmap.

The engineering behavior being taught is:

```text
Deliver useful increments while maintaining enterprise integration direction.
```

For Codex, this balances big upfront enterprise modeling against random dashboard-by-dashboard chaos.

## Codex trigger

Apply this when Codex is:

- planning data warehouse roadmap
- deciding first warehouse subject area
- building first reporting layer
- integrating multiple domains
- sequencing data work
- user asks “where do we start?”
- designing data architecture for a small but growing system

## Signals and smells

Codex should notice:

- warehouse project tries to model everything before delivery
- isolated dashboards grow without architecture
- no subject-area roadmap
- first deliverable is too large
- no common integration principles
- no governance for shared entities
- data consumers wait too long for value
- each new report creates new logic

## Desired Codex behavior

Codex should propose incremental delivery with architectural coherence.

It should identify:

```text
high-value subject area
first reporting use case
source systems
integration principles
history strategy
metadata/quality standards
future subject areas
delivery phases
```

## Implementation guidance

Codex should:

- start with a subject/process that has clear business value
- build a narrow but production-quality slice
- apply integration/metadata/quality standards from the beginning
- avoid overbuilding unused subjects
- document roadmap and assumptions
- reuse integration patterns for future increments
- keep architecture flexible for future sources

## Review guidance

Codex should ask:

- What is the first useful warehouse increment?
- Does it follow the enterprise direction?
- Is it too broad?
- Does it create reusable integration patterns?
- Are we avoiding both paralysis and chaos?
- How will later subject areas connect?

## Testing / verification guidance

Codex should recommend:

- acceptance tests for first reporting use case
- source reconciliation for first subject area
- metadata/quality checks from first increment
- review after first delivery
- roadmap update after learning
- regression tests as new increments are added

## Tradeoffs and cautions

Too much architecture delays value. Too little architecture creates long-term inconsistency. Codex should choose a thin enterprise-shaped slice.

## Example transformation

**Before:**

```text
Plan: Build entire enterprise warehouse for registration, billing, transport, attendance, HR, and finance before releasing any dashboard.
```

**After:**

```text
Plan:
1. First increment: registration subject area and registration dashboard.
2. Include source lineage, history, quality checks, and student/family integration.
3. Next increment: payments, using same student/family subject foundation.
```

## Distilled skill rule

Build the warehouse iteratively in business-value increments while preserving enterprise integration standards.

---

# 12. The Warehouse Should Support Decision Support, Not Operational Workflow

## Core teaching

A warehouse is built for decision support. It should not become the primary operational transaction system, nor should operational workflows depend on mutable warehouse tables unless specifically designed.

The engineering behavior being taught is:

```text
Use the warehouse for analysis and decision support, not as the system of record for operational transactions.
```

For Codex, this distinction prevents architectural confusion.

## Codex trigger

Apply this when Codex is:

- designing admin actions based on warehouse data
- allowing dashboard edits
- creating workflow logic from warehouse tables
- syncing warehouse corrections back to operational systems
- using marts as operational source
- designing reporting APIs that might be used transactionally

## Signals and smells

Codex should notice:

- app writes operational changes to warehouse
- warehouse table becomes source of truth for current status
- dashboard corrections are not sent to operational system
- operational workflow depends on stale warehouse data
- warehouse refresh lag affects transaction correctness
- users edit analytical tables directly
- no distinction between derived and authoritative data

## Desired Codex behavior

Codex should identify authoritative operational systems and derived analytical systems.

It should ask:

```text
Is this data authoritative or derived?
Can it be stale?
Is it safe to drive operational workflow from it?
If a correction is needed, where should it be made?
```

## Implementation guidance

Codex should:

- keep operational writes in systems of record
- use warehouse for read/analysis unless explicit write-back process exists
- display data freshness when warehouse informs decisions
- route corrections through governed operational/stewardship workflows
- avoid using stale derived data for high-stakes transactions
- define feedback loops from analytics insight to operational action

## Review guidance

Codex should ask:

- Is the warehouse being used as source of truth?
- Is freshness sufficient for this action?
- Where should corrections be made?
- Is write-back governed?
- Could stale data cause bad operational decisions?
- Is derived data labeled as derived?

## Testing / verification guidance

Codex should recommend:

- freshness/staleness tests
- write-back workflow tests if allowed
- source-of-truth reconciliation
- correction propagation tests
- user-interface warnings for stale data
- authorization/audit tests for corrections

## Tradeoffs and cautions

Some modern analytical applications include operational analytics and reverse ETL/write-back. These must be designed explicitly with governance, freshness, and source-of-truth rules.

## Example transformation

**Before:**

```text
Admin dashboard edits student status directly in warehouse table because it is visible there.
```

**After:**

```text
Dashboard shows warehouse data with freshness timestamp.
Corrections route to Student system of record.
Warehouse updates after pipeline refresh.
Any manual correction is audited and reconciled.
```

## Distilled skill rule

Use the warehouse for decision support; operational changes should flow through governed systems of record unless explicit write-back architecture exists.

---

# 13. Data Warehouse Quality Requires Reconciliation to Source

## Core teaching

A warehouse must earn trust by reconciling loaded data back to source systems. Counts, totals, keys, and critical metrics should be validated at every load.

The engineering behavior being taught is:

```text
Trust in warehouse data comes from systematic reconciliation, not hope.
```

For Codex, every ETL/ELT design should include validation against source data.

## Codex trigger

Apply this when Codex is:

- loading warehouse tables
- creating ETL/ELT jobs
- building dashboards
- migrating data
- integrating new source
- debugging warehouse numbers
- creating fact tables
- designing operational reports from warehouse

## Signals and smells

Codex should notice:

- no row count checks
- no sum/totals reconciliation
- dashboard numbers differ from source
- pipeline loads partial data silently
- duplicate records appear
- source deletes/updates not handled
- no rejected row counts
- no load status
- no source extract timestamp
- no comparison after transformations

## Desired Codex behavior

Codex should build reconciliation into pipeline design.

Reconciliation should include:

```text
source row counts
target row counts
accepted/rejected counts
key uniqueness
sum totals for measures
date-range completeness
source extract timestamp
load batch status
error thresholds
```

## Implementation guidance

Codex should:

- compute source control totals before/after load
- store reconciliation results per batch
- fail or warn based on thresholds
- track rejected/quarantined rows
- compare financial/count metrics to source
- support rerun after correction
- expose reconciliation status to operators
- document accepted variance if any

## Review guidance

Codex should ask:

- How do we know all source rows loaded?
- How do we know measures reconcile?
- What rows were rejected?
- Is variance allowed?
- Who reviews failed reconciliation?
- Can the load be rerun?
- Is reconciliation stored historically?

## Testing / verification guidance

Codex should recommend:

- row count reconciliation tests
- measure sum reconciliation tests
- duplicate detection tests
- rejected row tests
- batch status tests
- partial-load failure tests
- rerun/idempotency tests
- reconciliation dashboard/alert tests

## Tradeoffs and cautions

Some sources are messy or eventually consistent. Reconciliation thresholds may be needed. But unexplained differences should not be ignored.

## Example transformation

**Before:**

```text
Nightly invoice fact load completes successfully even if only 70% of source rows loaded.
```

**After:**

```text
Pipeline records:
source_count = 10,000
loaded_count = 9,980
rejected_count = 20
source_amount_sum = 1,250,000
target_amount_sum = 1,250,000
status = success_with_rejections
Rejected rows are available for review.
```

## Distilled skill rule

Every important warehouse load should reconcile row counts, keys, rejected records, and critical totals back to source systems.

---

# 14. Historical Corrections and Restatements Need Explicit Handling

## Core teaching

Warehouse history is not always immutable in a simple way. Sources may correct errors, late data may arrive, business definitions may change, and historical reports may need restatement.

The engineering behavior being taught is:

```text
Design how the warehouse handles corrections, late data, and restated history.
```

For Codex, this avoids naive append-only or overwrite-only approaches.

## Codex trigger

Apply this when:

- source data can be corrected
- late-arriving transactions occur
- historical reports must be accurate
- financial/official metrics are restated
- pipeline backfills old periods
- source deletes/updates past records
- metrics definitions change
- audit history matters

## Signals and smells

Codex should notice:

- late records ignored
- old periods never recalculated
- corrections overwrite without audit
- dashboard changes historical numbers unexpectedly
- no restatement record
- no distinction between data correction and business change
- backfill produces duplicates
- users ask why last month’s numbers changed

## Desired Codex behavior

Codex should define correction/restatement policy.

It should ask:

```text
Can source records change after load?
Should old reports change?
Do we preserve original loaded value?
Do we record restatement versions?
How are late records applied?
How are consumers notified?
```

## Implementation guidance

Codex should:

- track source update timestamps
- support incremental updates and backfills
- avoid duplicate rows on rerun
- record correction/restatement metadata
- preserve original values if audit requires it
- maintain period-close rules where needed
- recalculate affected aggregates
- notify/flag restated metrics
- test late-arriving data behavior

## Review guidance

Codex should ask:

- How are late-arriving records handled?
- How are corrections detected?
- Are historical numbers restated?
- Is audit preserved?
- Are aggregate marts refreshed correctly?
- Do users know when numbers changed?
- Is rerun idempotent?

## Testing / verification guidance

Codex should recommend:

- late-arriving record tests
- correction update tests
- restatement tests
- aggregate refresh tests
- idempotency tests
- audit history tests
- period-close tests
- dashboard regression after restatement

## Tradeoffs and cautions

Financial/legal reports may require strict restatement control. Exploratory dashboards may tolerate updates. Codex should match policy to business criticality.

## Example transformation

**Before:**

```text
A payment correction from last month updates source system. Warehouse ignores it because last month is already loaded.
```

**After:**

```text
Warehouse detects source update, reloads affected payment record, recalculates monthly summary, records restatement batch, and exposes “last restated at” metadata.
```

## Distilled skill rule

Handle late data, corrections, and historical restatements explicitly with audit, idempotent reloads, and aggregate refresh.

---

# 15. Data Warehouse Security Must Consider Aggregated and Historical Data

## Core teaching

Warehouses often centralize sensitive data from many systems and preserve history. This makes security and access control especially important.

The engineering behavior being taught is:

```text
Centralized analytical data requires deliberate access controls, masking, auditing, and retention policies.
```

For Codex, this means a warehouse is not automatically safer because it is “only reporting.”

## Codex trigger

Apply this when Codex is:

- designing warehouse access
- creating BI datasets
- exposing dashboards
- copying sensitive operational data to analytics
- building exports
- storing historical PII
- giving analysts access
- creating marts for different departments

## Signals and smells

Codex should notice:

- warehouse contains more sensitive combined data than any source
- everyone gets broad read access
- reports expose row-level PII unnecessarily
- sensitive history retained forever
- exports uncontrolled
- no audit of warehouse access
- development copies use production data
- aggregate reports can re-identify individuals
- role-based access not applied to BI layer

## Desired Codex behavior

Codex should classify and protect warehouse data.

It should consider:

```text
sensitive fields
row-level security
column masking
aggregation thresholds
access roles
audit logging
export controls
retention
dev/test anonymization
downstream copies
```

## Implementation guidance

Codex should:

- avoid loading unnecessary sensitive fields
- mask or tokenize PII where full values are not needed
- restrict row/column access by role
- create aggregated marts for broader audiences
- audit access to sensitive datasets
- define retention for historical sensitive data
- secure exports and downloads
- avoid production PII in dev/test
- tag sensitive columns in metadata/catalog

## Review guidance

Codex should ask:

- What sensitive data is centralized here?
- Who needs row-level detail?
- Can users see aggregate instead?
- Are columns masked by role?
- Is access audited?
- Are exports controlled?
- Is historical sensitive data retained appropriately?
- Are downstream BI tools enforcing security?

## Testing / verification guidance

Codex should recommend:

- authorization tests
- row-level security tests
- column masking tests
- export permission tests
- audit log tests
- anonymized test-data checks
- aggregation threshold tests
- retention/purge tests

## Tradeoffs and cautions

Over-restricting data can prevent legitimate analysis. Codex should apply least privilege while enabling appropriate business use.

## Example transformation

**Before:**

```text
All staff with dashboard access can download full historical student identity numbers, addresses, parent phones, and payment status.
```

**After:**

```text
Warehouse/BI security:
- teachers see class-level aggregates
- office admin sees student contact details
- billing sees payment data
- IDs masked unless elevated role
- exports audited
- sensitive historical records retained according to policy
```

## Distilled skill rule

Protect warehouse data with role-based access, masking, auditing, export controls, and retention because centralized history increases sensitivity.

---

# 16. Do Not Confuse the EDW with Departmental Reporting Convenience

## Core teaching

The enterprise warehouse foundation should preserve integrated, reusable, enterprise data. Department-specific convenience structures belong in marts, semantic layers, or presentation views.

The engineering behavior being taught is:

```text
Keep the enterprise foundation stable and reusable; put department-specific reshaping in delivery layers.
```

For Codex, this prevents polluting the EDW with every dashboard’s custom fields and filters.

## Codex trigger

Apply this when:

- adding report-specific columns
- building departmental dashboards
- changing enterprise warehouse tables for one report
- creating marts
- deciding where business logic belongs
- preserving reusable data foundations
- designing semantic layers

## Signals and smells

Codex should notice:

- EDW tables named after dashboards
- one department’s calculation embedded in enterprise subject table
- report filters applied in foundation layer
- multiple dashboard-specific columns in core entity
- presentation formatting stored in EDW
- enterprise table changes frequently for local report needs
- shared foundation becomes unstable

## Desired Codex behavior

Codex should place logic in the right layer:

```text
enterprise foundation: integrated, reusable, historical data
data mart: departmental/query-specific model
semantic layer: metric definitions and user-facing calculations
dashboard: presentation only
```

## Implementation guidance

Codex should:

- keep EDW subject tables broadly reusable
- create marts/views for department-specific needs
- place metric definitions in semantic layer or governed mart
- avoid report formatting in EDW
- keep EDW changes governed and stable
- document which layer owns which logic

## Review guidance

Codex should ask:

- Is this logic enterprise-wide or report-specific?
- Does this belong in EDW, mart, semantic layer, or dashboard?
- Will this make the foundation unstable?
- Are department-specific filters polluting shared data?
- Can this be derived downstream?

## Testing / verification guidance

Codex should recommend:

- mart-to-EDW reconciliation
- semantic metric tests
- dashboard regression tests
- EDW stability/contract checks
- lineage from mart field to EDW source
- impact analysis before EDW changes

## Tradeoffs and cautions

Some department-specific logic may become enterprise-standard over time. Codex should allow promotion from mart/semantic layer to governed EDW definition when appropriate.

## Example transformation

**Before:**

```text
edw_student includes:
marketing_segment_for_spring_campaign
billing_priority_label
transport_dashboard_color
```

**After:**

```text
edw_student contains reusable student subject data.
marketing_mart, billing_mart, and transport_mart add department-specific attributes/views.
```

## Distilled skill rule

Keep enterprise warehouse foundations reusable and stable; place department/report-specific shaping in marts or semantic layers.

---

# 17. The Corporate Information Factory Requires Clear Data Flow

## Core teaching

The broader Inmon-style architecture includes operational systems, data acquisition, enterprise warehouse, data marts, exploration/analytics, metadata, and feedback. The value is not the exact diagram but clear roles and flow between data components.

The engineering behavior being taught is:

```text
Design the full data ecosystem so each component has a clear role and controlled flow.
```

For Codex, this means data architecture should not be a pile of disconnected databases, dashboards, spreadsheets, and scripts.

## Codex trigger

Apply this when:

- designing data platform architecture
- organizing data flows
- creating multiple reporting layers
- integrating operational and analytical systems
- adding marts, warehouse, lake, or BI tools
- mapping current messy data ecosystem
- planning data modernization

## Signals and smells

Codex should notice:

- many uncontrolled extracts
- spreadsheet/reporting silos
- operational apps feed dashboards directly
- no common warehouse/integration layer
- marts built from marts
- circular data flows
- no metadata
- no lineage
- no clear owner of data movement
- users manually reconcile systems

## Desired Codex behavior

Codex should map and rationalize data flow.

It should identify:

```text
systems of record
data acquisition
staging
enterprise warehouse/integration layer
data marts
exploration/sandbox areas
BI/semantic layer
metadata/catalog
feedback/correction loops
```

## Implementation guidance

Codex should:

- define allowed data flow direction
- avoid circular dependencies
- prevent dashboards from becoming source systems
- separate governed data from sandbox exploration
- document sources and consumers
- create controlled interfaces between layers
- define correction feedback to source systems
- add metadata/lineage across the flow

## Review guidance

Codex should ask:

- What are the systems of record?
- Where does data enter the analytical ecosystem?
- Where is it integrated?
- Where is it consumed?
- Are there circular flows?
- Is exploratory data separated from governed data?
- How do corrections flow back?

## Testing / verification guidance

Codex should recommend:

- data flow smoke tests
- lineage validation
- source-to-target reconciliation
- freshness tests
- dependency graph checks
- circular dependency checks
- sandbox-to-production promotion checks

## Tradeoffs and cautions

Do not force a full Corporate Information Factory architecture onto a small project. Use the principle: clear roles, flow, and governance.

## Example transformation

**Before:**

```text
Operational DB → Excel exports → PowerBI → manual CSV correction → imported back into app → another dashboard
```

**After:**

```text
Operational DB is source of truth.
Warehouse pipeline extracts data.
Curated warehouse feeds marts.
BI reads marts.
Corrections route through governed app/admin workflow.
Lineage tracks flow.
```

## Distilled skill rule

Design data ecosystems with clear systems of record, acquisition, integration, mart, BI, metadata, and correction-flow responsibilities.

---

# 18. Data Warehouse Projects Must Manage Scope and Business Value

## Core teaching

Enterprise warehouse projects can fail when they become too broad, too technical, or too slow to deliver business value. They need scope control, business sponsorship, and incremental delivery.

The engineering behavior being taught is:

```text
Anchor warehouse work in concrete business value while preserving architectural direction.
```

For Codex, this means not recommending a massive EDW project without clear first use case.

## Codex trigger

Apply this when user asks:

- “should we build a data warehouse?”
- “how should we start data architecture?”
- “which subject area first?”
- “build enterprise reporting”
- “create data platform roadmap”
- “make a reporting system”
- “replace spreadsheets”

## Signals and smells

Codex should notice:

- warehouse project has no first report/use case
- users wait too long for value
- scope includes every data domain immediately
- architecture diagrams dominate over working data
- no business owner/sponsor
- no success criteria
- first release too ambitious
- technical platform chosen before business questions

## Desired Codex behavior

Codex should propose a scoped first delivery.

It should define:

```text
business question
users
source systems
subject area
first deliverable
quality expectations
history needs
success metric
future expansion path
```

## Implementation guidance

Codex should:

- select high-value first subject/process
- deliver an end-to-end slice
- include metadata, quality, and reconciliation from start
- avoid modeling everything upfront
- maintain roadmap for future subjects
- validate with business users
- use first increment to refine standards

## Review guidance

Codex should ask:

- What decision will this support?
- Who needs it?
- What is the first useful slice?
- Is scope controlled?
- Is business validation included?
- Does this create reusable foundation?
- What comes next?

## Testing / verification guidance

Codex should recommend:

- acceptance tests based on business questions
- reconciliation tests
- user validation of first dashboard/report
- performance tests for first use case
- quality checks for first subject
- retrospective after first increment

## Tradeoffs and cautions

Too narrow a first slice can become a throwaway silo. Too broad becomes paralysis. Codex should make the first slice enterprise-shaped but limited.

## Example transformation

**Before:**

```text
Plan: Build complete EDW for all school operations before any report launches.
```

**After:**

```text
First slice:
Business question: How many students are registered by class, school year, and status?
Sources: registration app.
Subject areas: student, family, registration, class.
Deliverable: registration dashboard.
Architecture: staging → integrated registration/student subjects → registration mart.
```

## Distilled skill rule

Start warehouse work with a high-value, scoped business question and deliver an enterprise-shaped slice before expanding.

---

# 19. Senior Engineering Judgment from _Building the Data Warehouse_

## Core teaching

The deeper lesson is enterprise data discipline. A data warehouse is not a pile of reports or replicated application tables. It is a managed, integrated, historical foundation for decision support.

Codex should internalize this:

```text
Enterprise analytical data needs separation from operations, integration across sources, subject orientation, history, metadata, quality, security, and incremental business delivery.
```

## Codex trigger

Apply broadly when Codex is working on:

- enterprise reporting
- data warehouses
- analytical read models
- data marts
- dashboards
- source integration
- historical reporting
- data platform architecture
- business intelligence foundations
- operational vs analytical separation
- cross-domain decision support

## Signals and smells

Codex should notice:

- reports query operational systems directly
- no integrated enterprise data layer
- each source/app/report defines data differently
- no subject orientation
- current-state tables used for historical analysis
- no metadata/lineage
- no source reconciliation
- warehouse tables mutated manually
- marts become disconnected silos
- sensitive historical data overexposed
- warehouse project too broad/no business value

## Desired Codex behavior

Codex should:

- separate operational and analytical workloads
- identify subject areas
- integrate data across sources
- preserve historical time variance
- make warehouse loads controlled/auditable
- create layered architecture
- preserve atomic detail where feasible
- add metadata and lineage
- reconcile warehouse data to sources
- secure centralized historical data
- deliver incrementally by business value
- derive marts/presentation layers from integrated foundation when consistency matters

## Implementation guidance

Codex should:

- create staging/source capture
- define integrated subject-oriented warehouse models
- track history with effective dates, snapshots, and events
- add load batch metadata
- build reconciliation checks
- document source-to-target mappings
- keep departmental logic in marts/semantic layer
- protect sensitive warehouse data
- define freshness/retention
- create first enterprise-shaped slice before expanding

## Review guidance

Codex should check:

- Is this analytical or operational?
- What is the source of truth?
- What subject area is modeled?
- Does the warehouse preserve history?
- Is data integrated or merely copied?
- Is metadata/lineage present?
- Does the load reconcile?
- Are updates controlled?
- Are marts consistent with foundation?
- Is sensitive data protected?
- Is the project delivering business value incrementally?

## Testing / verification guidance

Codex should recommend:

- source-to-staging reconciliation
- source-to-warehouse reconciliation
- row count and control total checks
- historical version tests
- snapshot completeness tests
- load audit tests
- idempotent rerun tests
- metadata/lineage checks
- mart-to-warehouse reconciliation
- security/access tests
- dashboard acceptance tests
- business validation of first slice

## Tradeoffs and cautions

Inmon-style EDW architecture can be too heavy if applied blindly. For small projects or narrow analytics, a Kimball-style dimensional mart or simple reporting read model may be faster and sufficient.

Codex should choose enterprise warehouse architecture when integration, history, shared definitions, and cross-domain decision support justify it.

## Example transformation

**Before:**

```text
The organization has:
- operational school app
- billing spreadsheet
- transport spreadsheet
- PowerBI dashboards
- manual exports
- conflicting student counts
- no history of class changes
```

**After:**

```text
Data warehouse architecture:
- staging captures school app, billing, transport sources
- integrated EDW subject areas: Student, Family, Class, Registration, Payment, Transport
- history preserved with effective dating and transaction events
- metadata tracks source and load batch
- reconciliation validates counts and totals
- marts expose registration, billing, and transport analytics
- BI uses marts, not raw source exports
```

## Distilled skill rule

For enterprise analytics, build an integrated, subject-oriented, historical, governed warehouse foundation and deliver marts incrementally from it.

---

# Compression Candidates for Future `SKILL.md`

These are candidate rules to compress into a future Codex skill:

```text
Separate operational transaction systems from analytical decision-support systems when reporting needs are historical, heavy, cross-domain, or recurring.
```

```text
When integrating sources, standardize keys, definitions, codes, conflicts, and lineage instead of merely copying source tables into one place.
```

```text
Organize enterprise analytical data around durable business subjects rather than source applications or UI screens.
```

```text
Preserve historical data intentionally with events, snapshots, or effective-dated versions when analytics require time-variant truth.
```

```text
Treat warehouse data as controlled analytical history; updates, corrections, reloads, and restatements must be auditable and reproducible.
```

```text
Use an integrated warehouse foundation for shared historical enterprise data, and derive data marts from it when consistency across departments matters.
```

```text
Separate warehouse layers for raw acquisition, cleansing, integration, presentation, and BI so responsibilities and lineage stay clear.
```

```text
Use normalized subject-oriented structures for enterprise integration foundations, and dimensional marts for business-facing analytics when both are needed.
```

```text
Preserve atomic historical detail in the warehouse foundation when feasible, and derive summaries/marts from it.
```

```text
For warehouse data, capture metadata for source, lineage, transformations, load history, definitions, ownership, quality, and freshness.
```

```text
Build the warehouse iteratively in business-value increments while preserving enterprise integration standards.
```

```text
Use the warehouse for decision support; operational changes should flow through governed systems of record unless explicit write-back architecture exists.
```

```text
Every important warehouse load should reconcile row counts, keys, rejected records, and critical totals back to source systems.
```

```text
Handle late data, corrections, and historical restatements explicitly with audit, idempotent reloads, and aggregate refresh.
```

```text
Protect warehouse data with role-based access, masking, auditing, export controls, and retention because centralized history increases sensitivity.
```

```text
Keep enterprise warehouse foundations reusable and stable; place department/report-specific shaping in marts or semantic layers.
```

```text
Design data ecosystems with clear systems of record, acquisition, integration, mart, BI, metadata, and correction-flow responsibilities.
```

```text
Start warehouse work with a high-value, scoped business question and deliver an enterprise-shaped slice before expanding.
```

```text
For enterprise analytics, build an integrated, subject-oriented, historical, governed warehouse foundation and deliver marts incrementally from it.
```
