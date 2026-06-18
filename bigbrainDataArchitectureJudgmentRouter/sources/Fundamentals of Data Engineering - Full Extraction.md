# Extracted Codex-Skill Training Material
## Source: _Fundamentals of Data Engineering_ — Joe Reis & Matt Housley

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

This extraction is intentionally written as **operational guidance for an AI coding agent**, not as a human-facing book summary.

Primary engineering domains:

```text
data engineering
data architecture
data lifecycle design
data pipelines
data platforms
data modeling
data operations
data quality
data governance
senior engineering judgment
```

Secondary domains:

```text
analytics architecture
production readiness
testing
security
performance
reliability
cloud data architecture
streaming
batch processing
orchestration
metadata management
```

Core source angle:

```text
Data engineering is the design, construction, and operation of systems that move data from generation through ingestion, transformation, storage, serving, governance, and consumption. The data engineering lifecycle should drive technology and architecture choices, not the other way around.
```

Important note for Codex extraction:

```text
This source is especially useful for teaching Codex practical data engineering judgment: lifecycle-first thinking, choosing batch vs streaming, designing reliable pipelines, avoiding tool-first architecture, understanding source systems, storage/compute tradeoffs, orchestration, data quality, governance, security, and operational maturity.
```

---

# 1. Start with the Data Engineering Lifecycle

## Core teaching

The central teaching is that data engineering should be understood as a lifecycle, not as isolated tools or pipeline scripts. Data is generated, ingested, transformed, stored, served, consumed, governed, monitored, and eventually archived or deleted.

The engineering behavior being taught is:

```text
Before choosing tools or writing pipelines, identify where the work sits in the data lifecycle and what responsibilities apply at that stage.
```

For Codex, this means it should not jump directly to “use Airflow,” “use Kafka,” “use dbt,” or “write a SQL transform.” It should first understand the data’s lifecycle path and the responsibilities at each stage.

## Codex trigger

Apply this when Codex is:

- designing a data pipeline
- building analytics/reporting infrastructure
- creating ETL/ELT jobs
- choosing data tools
- designing a warehouse/lake/lakehouse
- integrating source systems
- designing ingestion
- creating transformations
- creating data quality checks
- serving data to dashboards, APIs, ML, or applications
- planning data architecture
- reviewing an existing data platform

## Signals and smells

Codex should notice:

- tool chosen before lifecycle needs are understood
- pipeline code written without knowing source behavior
- transformation logic added without knowing consumption needs
- storage chosen without access-pattern analysis
- no data quality checks
- no orchestration or monitoring
- no lifecycle/retention plan
- no owner for data after pipeline runs
- no distinction between raw, transformed, and served data
- data gets copied but not governed
- dashboard/table exists but source freshness is unknown
- pipeline ends at “data loaded” without considering consumers

## Desired Codex behavior

Codex should map the data lifecycle before proposing implementation.

It should ask:

```text
Where is the data generated?
How is it ingested?
Where is it stored?
How is it transformed?
Who consumes it?
How is it served?
What quality/security/governance applies?
How is it monitored?
How is it retained or deleted?
```

Codex should design each stage intentionally and avoid isolated pipeline fragments.

## Implementation guidance

When writing or modifying code, Codex should:

- identify lifecycle stage before implementing
- keep raw/staging data separate from transformed/serving data
- define ingestion, transformation, storage, serving, and quality responsibilities
- include metadata such as load time/source/batch ID
- design for observability and reruns
- include data quality tests at appropriate points
- define consumers and serving contracts
- document freshness and lineage expectations
- avoid tool-first decisions without lifecycle rationale

## Review guidance

Codex should ask:

- Which lifecycle stage is this change affecting?
- Does the upstream source behavior support this design?
- Does the downstream consumer need this shape/freshness?
- Are quality checks placed at the right lifecycle stages?
- Is lineage preserved?
- Is the pipeline observable and recoverable?
- Is retention/lifecycle considered?

## Testing / verification guidance

Codex should recommend:

- source freshness tests
- ingestion row-count checks
- schema compatibility tests
- transformation unit tests
- data quality tests
- serving-layer acceptance tests
- lineage/audit field checks
- rerun/idempotency tests
- pipeline monitoring checks
- retention/archive tests where relevant

## Tradeoffs and cautions

Do not over-formalize lifecycle design for small one-off scripts. But for recurring, shared, decision-critical, or production data flows, lifecycle thinking is mandatory.

## Example transformation

**Before:**

```text
Codex writes a script that pulls payments from an API and inserts directly into a dashboard table.
```

**After:**

```text
Codex designs:
1. source API extraction with cursor and batch ID
2. raw landing table preserving source payload
3. cleaned payment staging model
4. transformed payment fact table
5. quality checks for uniqueness, amount validity, reconciliation
6. dashboard-serving model with freshness metadata
7. monitoring and rerun strategy
```

## Distilled skill rule

Design data work around the full lifecycle—generation, ingestion, storage, transformation, serving, governance, monitoring, and retention—before choosing tools or writing pipelines.

---

# 2. Work Backward from Consumers and Use Cases

## Core teaching

Data engineering exists to serve downstream uses: analytics, operational reporting, machine learning, reverse ETL, APIs, audits, compliance, or product features. Pipelines should be shaped by consumer needs, not just source availability.

The engineering behavior being taught is:

```text
Design data systems from actual use cases and consumers, not from whatever data is easiest to collect.
```

For Codex, this means it should not ingest or model data blindly. It should identify who needs the data, at what freshness, granularity, quality, and interface.

## Codex trigger

Apply this when Codex is:

- building dashboards
- creating data products
- designing warehouse tables
- designing APIs over data
- ingesting new sources
- deciding batch vs streaming
- defining transformations
- creating data marts
- choosing storage formats
- building reporting for business users

## Signals and smells

Codex should notice:

- “load all the data” without defined users
- pipeline has no known consumer
- storage/model optimized for source shape only
- no freshness requirements
- no grain/level-of-detail decision
- no quality expectations
- downstream users build shadow transforms
- consumers cannot answer their questions from the model
- expensive real-time pipeline for weekly report
- dashboard pulls raw data and fixes it locally
- ML feature pipeline and BI metric disagree

## Desired Codex behavior

Codex should define consumer contract/use case before designing the data flow.

It should ask:

```text
Who consumes this?
What decision/workflow does it support?
What fields and metrics are required?
What grain is needed?
How fresh must it be?
What quality level is acceptable?
What interface is needed: table, API, event, file, feature store, dashboard?
What access/security constraints apply?
```

## Implementation guidance

Codex should:

- document consumer use case
- model data at the correct grain
- define freshness and latency requirements
- define quality expectations
- choose batch/streaming based on consumer need
- provide serving model appropriate to use
- avoid over-ingesting unused data
- avoid over-engineering real-time paths when batch is enough
- include sample queries or contract examples
- validate the output against consumer questions

## Review guidance

Codex should ask:

- Is there a real consumer?
- Does the data shape match the consumer’s use?
- Is freshness overbuilt or insufficient?
- Are metrics defined at the right grain?
- Is the serving interface appropriate?
- Are consumers protected from raw source quirks?
- Is this data worth maintaining?

## Testing / verification guidance

Codex should recommend:

- consumer acceptance tests
- sample query tests
- dashboard regression tests
- freshness tests matching consumer SLA
- quality tests tied to consumer expectations
- contract tests for APIs/events/data products
- performance tests for expected consumption pattern

## Tradeoffs and cautions

Consumer-first does not mean customizing every dataset for one consumer. Codex should balance specific use cases with reusable, domain-aligned models.

## Example transformation

**Before:**

```text
Codex ingests every field from registration forms into a wide table because it might be useful later.
```

**After:**

```text
Codex identifies first consumers:
- secretary dashboard needs current registration status within 15 minutes
- management report needs weekly counts by class and school year
- billing needs approved registrations

It designs raw capture plus curated registration models with appropriate freshness, grain, and contracts.
```

## Distilled skill rule

Design pipelines and models backward from real consumers, decisions, freshness, grain, quality, and serving interfaces.

---

# 3. Understand Source Systems Before Ingesting Data

## Core teaching

Data pipelines inherit the behavior and limitations of their source systems. A reliable pipeline requires understanding how sources generate, mutate, delete, timestamp, identify, and expose data.

The engineering behavior being taught is:

```text
Before ingesting from a source, learn its semantics, change behavior, identity rules, failure modes, and extraction constraints.
```

For Codex, this prevents naive extraction logic that misses updates, duplicates rows, loses deletes, or misinterprets timestamps.

## Codex trigger

Apply this when Codex is:

- ingesting from databases
- ingesting from APIs
- reading files
- consuming event streams
- using CDC
- importing spreadsheets
- integrating SaaS tools
- designing incremental loads
- creating source connectors
- debugging missing/duplicated data

## Signals and smells

Codex should notice:

- source has no updated_at field
- updated_at is unreliable
- records can be deleted
- source uses soft deletes
- primary keys are unstable or scoped
- API pagination can change while reading
- source rate limits exist
- source schema changes without notice
- timestamps lack timezone clarity
- source emits duplicate events
- files are replaced not appended
- spreadsheet column names change
- source system is overloaded by extraction queries
- no source owner/contact

## Desired Codex behavior

Codex should profile and document source behavior before designing ingestion.

It should ask:

```text
How are new records identified?
How are updates identified?
How are deletes detected?
What is the primary/business key?
Are timestamps reliable and timezone-aware?
Can extraction be incremental?
Are there API limits or pagination issues?
Does source schema change?
What consistency guarantees does source provide?
What load can source tolerate?
```

## Implementation guidance

Codex should:

- choose ingestion strategy based on source behavior
- use CDC when changes/deletes matter and source supports it
- use high-watermark carefully when updated_at is reliable
- preserve raw source payload when useful
- store source extraction timestamp
- handle pagination/rate limits/retries
- detect schema drift
- use idempotency keys
- avoid heavy queries against production OLTP without safeguards
- document source assumptions and limitations

## Review guidance

Codex should ask:

- Do we know how the source changes?
- Can updates/deletes be missed?
- Is the extraction method safe for source system?
- Are source keys stable?
- Are timestamp semantics clear?
- Is schema drift handled?
- Are retries/idempotency safe?
- Is source data reconciled after ingestion?

## Testing / verification guidance

Codex should recommend:

- source connector tests
- incremental load tests
- update/delete detection tests
- pagination tests
- duplicate event tests
- rate limit/retry tests
- schema drift tests
- source-to-raw reconciliation
- timezone boundary tests
- extraction load/performance tests

## Tradeoffs and cautions

Deep source analysis takes time. For exploratory work, a quick extract may be acceptable, but production ingestion needs source semantics documented and tested.

## Example transformation

**Before:**

```text
Codex loads all students where updated_at > last_run_time and assumes this captures all changes.
```

**After:**

```text
Codex verifies:
- updated_at changes on all relevant updates
- deletes are soft-deleted with deleted_at
- timestamps are UTC
- pagination is stable
- source query is indexed

It stores extraction watermark, batch ID, and reconciliation counts.
```

## Distilled skill rule

Before building ingestion, document source keys, update/delete semantics, timestamps, schema drift, extraction limits, and failure modes.

---

# 4. Choose Batch, Streaming, or CDC Based on Requirements

## Core teaching

Batch, streaming, and change data capture are different ingestion/processing patterns with different tradeoffs. The right choice depends on latency needs, source capabilities, cost, complexity, consistency, and consumer expectations.

The engineering behavior being taught is:

```text
Do not choose streaming or batch by fashion; choose the processing mode that matches freshness, correctness, and operational needs.
```

For Codex, this prevents recommending Kafka or real-time pipelines when daily batch is sufficient, or recommending batch when low-latency decisions require event/CDC.

## Codex trigger

Apply this when Codex is:

- designing ingestion
- building dashboards
- creating real-time features
- syncing systems
- processing events
- designing CDC
- choosing data architecture
- building ML feature updates
- handling operational analytics
- optimizing pipeline cost/latency

## Signals and smells

Codex should notice:

- “real-time” requested without latency definition
- streaming used for daily reports
- batch used for fraud/alerting/operational workflows needing seconds latency
- CDC needed because updates/deletes are important
- API polling misses changes
- streaming pipeline lacks idempotency/order handling
- batch window too slow for consumer
- cost/complexity of streaming ignored
- no late-arriving/out-of-order strategy
- source cannot support required extraction mode

## Desired Codex behavior

Codex should define freshness/latency and change semantics before choosing mode.

It should compare:

```text
Batch:
  simpler, cheaper, good for periodic analytics
Streaming:
  low latency, complex operations, event-time issues
CDC:
  captures database changes, useful for replication/history, requires source support and careful semantics
```

## Implementation guidance

Codex should:

- ask for required latency/freshness
- default to batch when latency allows and simplicity matters
- use CDC when updates/deletes from databases must be captured reliably
- use streaming when low-latency event processing is required
- design idempotency and replay for streaming/CDC
- handle late/out-of-order events
- define watermarks/windows where relevant
- monitor lag and freshness
- expose stale/pending states to consumers

## Review guidance

Codex should ask:

- What freshness is actually required?
- Is “real-time” necessary or nice-to-have?
- Can source support streaming/CDC?
- Are updates/deletes captured?
- Is operational complexity justified?
- Are ordering, duplicates, and late data handled?
- Is batch simpler and good enough?

## Testing / verification guidance

Codex should recommend:

- freshness/latency tests
- batch completeness tests
- CDC update/delete tests
- duplicate/out-of-order event tests
- replay tests
- lag monitoring checks
- idempotency tests
- late data/window tests
- source reconciliation

## Tradeoffs and cautions

Streaming systems are harder to operate and reason about. Do not introduce them without real latency value.

Batch systems may be simpler but can create stale data and large recovery windows. Choose deliberately.

## Example transformation

**Before:**

```text
Codex recommends Kafka for a weekly enrollment summary dashboard.
```

**After:**

```text
Codex asks for freshness. Since weekly/daily freshness is acceptable, it recommends scheduled batch/ELT with freshness checks.

For a live registration capacity monitor needing sub-minute updates, Codex would consider CDC/events.
```

## Distilled skill rule

Choose batch, streaming, or CDC from latency, change-capture, correctness, cost, and operational requirements—not from trend or preference.

---

# 5. Raw Data Should Be Preserved Before Transformation When Reprocessing Matters

## Core teaching

Preserving raw or minimally transformed data creates replayability, auditability, and protection against transformation mistakes. If business logic changes, raw data allows reprocessing without re-extracting from the source.

The engineering behavior being taught is:

```text
Land raw data before applying irreversible transformations when audit, replay, or changing business logic matters.
```

For Codex, this means designing a raw zone/staging layer for recurring production pipelines.

## Codex trigger

Apply this when Codex is:

- ingesting source data
- creating data lakes/lakehouses
- building ETL/ELT pipelines
- transforming API/file/database data
- designing replay/backfill
- preserving audit lineage
- handling changing metric definitions
- dealing with unreliable sources

## Signals and smells

Codex should notice:

- extraction immediately transforms and discards source values
- no way to reprocess after logic changes
- source API cannot provide historical data again
- transformations are complex or likely to change
- raw files overwritten
- no source payload archived
- debugging requires re-pulling data from source
- pipeline bug corrupts only copy of data
- no audit trail of original input

## Desired Codex behavior

Codex should preserve raw input where useful.

Raw preservation can include:

```text
raw files
raw JSON payloads
staging tables
CDC logs
source snapshots
source extract partitions
```

It should include metadata:

```text
source
extracted_at
batch_id
schema_version
file_name/source_record_id
```

## Implementation guidance

Codex should:

- land raw data in immutable or append-only storage when appropriate
- avoid destructive transformations before raw persistence
- partition raw data by source/extraction date
- store extraction metadata
- design reprocessing/backfill from raw
- separate raw, cleaned, and curated layers
- secure raw data because it may contain sensitive fields
- define retention for raw data
- validate raw load completeness before transformation

## Review guidance

Codex should ask:

- Can we reprocess from raw if transformation logic changes?
- Is raw data retained securely?
- Is raw data immutable or versioned?
- Is retention defined?
- Are source payload and metadata preserved?
- Is raw storage necessary for this use case?
- Are consumers prevented from using raw data accidentally?

## Testing / verification guidance

Codex should recommend:

- raw landing completeness tests
- raw-to-clean transformation tests
- reprocessing/backfill tests
- raw retention tests
- raw access/security tests
- source payload schema tests
- batch metadata tests

## Tradeoffs and cautions

Raw preservation increases storage cost and security risk. For small, non-critical, easily reproducible data, full raw retention may be unnecessary.

But for production decision-critical pipelines, preserving raw input is often high leverage.

## Example transformation

**Before:**

```text
API response is transformed directly into payment_summary table. Original JSON is discarded.
```

**After:**

```text
Pipeline:
1. Stores raw payment API payload in raw_payments partition with batch_id.
2. Creates cleaned payment staging table.
3. Builds curated payment fact.
4. Supports reprocessing from raw if mapping changes.
```

## Distilled skill rule

Preserve raw or minimally transformed source data before irreversible transformations when replay, audit, debugging, or changing business logic matters.

---

# 6. Storage Design Must Match Access Patterns and Lifecycle

## Core teaching

Storage is not one-size-fits-all. Data storage choices should be driven by access patterns, workload, latency, volume, structure, governance, retention, cost, and reliability.

The engineering behavior being taught is:

```text
Choose storage according to how data is written, read, transformed, governed, and retained.
```

For Codex, this means not treating a relational database, object store, warehouse, search index, cache, lake, and stream log as interchangeable.

## Codex trigger

Apply this when Codex is:

- choosing database/storage technology
- designing a lake/warehouse/lakehouse
- storing raw files
- storing analytical tables
- storing events/logs
- creating cache/search/index
- separating hot/warm/cold data
- designing retention/archive
- optimizing cost/performance

## Signals and smells

Codex should notice:

- OLTP database used for heavy analytics scans
- object storage used with no metadata/catalog
- cache treated as source of truth
- search index used as primary store
- warehouse used for low-latency transactional writes
- raw and curated data mixed
- no partitioning/clustering
- old data kept in hot storage unnecessarily
- sensitive data copied everywhere
- storage chosen because tool is popular, not workload fit

## Desired Codex behavior

Codex should choose storage based on workload and lifecycle.

Consider:

```text
read/write pattern
latency
transaction requirements
query style
data volume
schema evolution
retention
security
cost
operational complexity
recovery/rebuild
consumer interface
```

## Implementation guidance

Codex should:

- use OLTP stores for transactional workloads
- use warehouses/lakehouses for analytical scans/BI
- use object storage for raw/large immutable data with metadata
- use stream logs for event transport/replay where needed
- use search indexes for search/query acceleration, not source of truth
- use caches for performance with invalidation/rebuild strategy
- partition/cluster large analytical datasets
- define storage lifecycle tiers
- document authoritative vs derived stores

## Review guidance

Codex should ask:

- What access pattern is this storage serving?
- Is this source of truth or derived?
- What consistency is required?
- How will it scale and be queried?
- How is it secured?
- How is it backed up/recovered?
- How long is data retained?
- Is another storage layer more appropriate?

## Testing / verification guidance

Codex should recommend:

- performance/load tests for expected workload
- backup/restore tests
- source-vs-derived reconciliation
- cache invalidation tests
- search index rebuild tests
- partition pruning tests
- retention lifecycle tests
- access/security tests

## Tradeoffs and cautions

Adding specialized stores increases operational complexity. Codex should prefer simpler storage if it satisfies requirements.

## Example transformation

**Before:**

```text
Codex stores all raw files, dashboard aggregates, live app state, and search data in one relational production database.
```

**After:**

```text
Operational state: OLTP database.
Raw files: object storage with metadata and retention.
Analytics: warehouse/lakehouse tables.
Search: derived index rebuildable from source.
Cache: derived, expirable, not authoritative.
```

## Distilled skill rule

Choose data storage by workload, access pattern, consistency, lifecycle, security, cost, and whether the store is authoritative or derived.

---

# 7. Transformation Logic Should Be Modular, Testable, and Layered

## Core teaching

Transformation converts raw data into useful, trusted, consumer-ready forms. Good transformation logic is modular, layered, documented, tested, and reproducible.

The engineering behavior being taught is:

```text
Do not bury business logic in opaque SQL/scripts/dashboards; organize transformations into understandable, testable layers.
```

For Codex, this means transformations need architecture, not just queries.

## Codex trigger

Apply this when Codex is:

- writing SQL transformations
- building dbt models
- creating ETL/ELT jobs
- cleaning data
- standardizing reference values
- deriving metrics
- building marts
- refactoring dashboard logic
- creating semantic models

## Signals and smells

Codex should notice:

- one giant SQL query does everything
- dashboard contains transformation logic
- business rules duplicated in reports
- transformations lack tests
- raw and curated logic mixed
- no naming conventions
- no clear model dependencies
- metrics calculated in many places
- transformations cannot be rerun safely
- comments do not explain business meaning

## Desired Codex behavior

Codex should structure transformations in layers.

Possible layers:

```text
raw/staging: source-aligned cleanup, type casting
intermediate: joins, standardization, business logic
marts/serving: consumer-ready facts/dimensions/metrics
semantic layer: governed metrics and definitions
```

## Implementation guidance

Codex should:

- split giant transformations into meaningful models
- isolate source cleanup from business logic
- centralize reusable metric/business rules
- document transformation purpose
- add tests per layer
- make transformations deterministic and rerunnable
- avoid hidden dashboard transformations
- preserve lineage from raw to serving
- use clear naming conventions
- avoid over-layering trivial flows

## Review guidance

Codex should ask:

- Is transformation logic readable?
- Is source cleanup separated from business rules?
- Are metrics defined once?
- Can this be tested?
- Can it be rerun?
- Is lineage clear?
- Is the output consumer-ready?
- Is the layering too heavy or too flat?

## Testing / verification guidance

Codex should recommend:

- transformation unit tests
- source-to-target reconciliation
- null/uniqueness/accepted-value tests
- metric calculation tests
- dependency/DAG tests
- idempotent rerun tests
- dashboard output regression tests
- semantic layer tests

## Tradeoffs and cautions

Too many layers can make lineage hard to follow. Codex should use enough layers to clarify responsibilities, not create ceremony.

## Example transformation

**Before:**

```text
PowerBI query cleans status codes, joins payments, filters test students, calculates balances, and groups by class.
```

**After:**

```text
stg_registration cleans source types/status.
int_registration_payment joins registration and payments.
mart_class_registration_summary exposes governed class metrics.
PowerBI only visualizes.
```

## Distilled skill rule

Keep transformations modular, layered, documented, testable, deterministic, and out of dashboards when they define shared business logic.

---

# 8. Orchestration Is More Than Scheduling

## Core teaching

Orchestration coordinates data workflows: dependencies, scheduling, retries, backfills, state, SLAs, alerts, and recovery. It is not merely cron.

The engineering behavior being taught is:

```text
Design orchestration around dependency correctness, failure handling, observability, and recovery.
```

For Codex, this means pipeline jobs should not be isolated scripts triggered blindly.

## Codex trigger

Apply this when Codex is:

- creating scheduled pipelines
- using Airflow/Dagster/Prefect/dbt Cloud/etc.
- designing ETL/ELT workflows
- coordinating dependent data jobs
- adding retries/backfills
- monitoring data freshness
- managing pipeline failure recovery

## Signals and smells

Codex should notice:

- cron jobs with hidden dependencies
- downstream job runs before upstream data is ready
- no retry policy
- failures go unnoticed
- no backfill support
- manual reruns create duplicates
- no pipeline state tracking
- no SLA/freshness monitoring
- no dependency graph
- every job has custom logging
- failed batch partially updates serving tables

## Desired Codex behavior

Codex should design orchestration explicitly.

It should define:

```text
DAG/dependencies
schedule/frequency
freshness expectations
retry/backoff policy
idempotency/rerun behavior
backfill strategy
failure alerts
run metadata
data quality gates
promotion from staging to serving
```

## Implementation guidance

Codex should:

- use orchestration tool or structured workflow appropriate to complexity
- declare dependencies between tasks/models
- make tasks idempotent or safely rerunnable
- record run status and metadata
- add retries only where safe
- fail fast on quality gate violations
- support backfills with parameterized dates/batches
- alert owners on failures/staleness
- avoid partial serving-layer updates
- document runbook for recovery

## Review guidance

Codex should ask:

- Are dependencies explicit?
- Can failed jobs be retried safely?
- How are backfills run?
- What happens if upstream data is late?
- Are quality checks gates?
- Who gets alerted?
- Is run state visible?
- Can serving tables be partially corrupted?

## Testing / verification guidance

Codex should recommend:

- DAG dependency tests
- idempotent rerun tests
- retry behavior tests
- backfill tests
- late upstream data tests
- quality gate failure tests
- alert tests
- partial failure/recovery tests
- freshness SLA tests

## Tradeoffs and cautions

Do not introduce heavyweight orchestration for one simple script unless it will become recurring/critical. But production data flows need explicit orchestration semantics.

## Example transformation

**Before:**

```text
Three cron scripts run at 1:00, 1:05, and 1:10. If the first runs late, downstream jobs process stale data.
```

**After:**

```text
Orchestrated DAG:
extract_payments → validate_raw_payments → transform_payment_fact → reconcile_payment_fact → publish_payment_mart

Each task records run metadata, supports rerun by batch, and alerts on failure/freshness breach.
```

## Distilled skill rule

Orchestrate data workflows with explicit dependencies, retries, backfills, quality gates, run metadata, alerts, and recovery—not just schedules.

---

# 9. Data Quality Is a First-Class Engineering Concern

## Core teaching

Data quality is not an afterthought. It must be tested, monitored, measured, and connected to business impact throughout the data lifecycle.

The engineering behavior being taught is:

```text
Treat data quality failures like production defects, because bad data creates bad decisions and broken systems.
```

For Codex, this means every production data pipeline should have checks proportional to risk.

## Codex trigger

Apply this when Codex is:

- ingesting data
- transforming data
- building marts
- creating dashboards
- defining metrics
- integrating systems
- building ML features
- creating data products
- debugging report discrepancies

## Signals and smells

Codex should notice:

- no null/uniqueness checks
- duplicate business keys
- invalid reference values
- out-of-range amounts
- stale data
- row counts change unexpectedly
- source and target totals differ
- dashboards disagree
- ML features contain leakage/missingness
- bad rows silently dropped
- quality issues visible only after consumer complaint

## Desired Codex behavior

Codex should define quality expectations at each lifecycle stage.

Quality dimensions:

```text
freshness
completeness
validity
uniqueness
consistency
accuracy
referential integrity
timeliness
conformity
reasonableness
```

## Implementation guidance

Codex should:

- add schema and data tests
- validate accepted values
- check nullability and uniqueness
- reconcile source-to-target counts/totals
- quarantine bad records when appropriate
- track quality metrics over time
- alert on quality threshold failures
- document known limitations
- expose quality status to consumers
- tie checks to business-critical fields/metrics

## Review guidance

Codex should ask:

- What can go wrong with this data?
- What quality dimensions matter here?
- Are checks placed before consumers see bad data?
- Are rejected rows visible?
- Are quality issues assigned to an owner?
- Are thresholds meaningful?
- Is quality status exposed?

## Testing / verification guidance

Codex should recommend:

- not-null tests
- uniqueness tests
- accepted-value tests
- range tests
- referential integrity tests
- freshness tests
- anomaly/volume tests
- reconciliation tests
- quarantine tests
- dashboard/metric validation tests

## Tradeoffs and cautions

Too many tests can create noise and maintenance burden. Codex should prioritize checks that protect critical fields, metrics, and known failure modes.

## Example transformation

**Before:**

```text
Registration dashboard uses data even if class_code is invalid or registration_status is unknown.
```

**After:**

```text
Pipeline checks:
- registration_id unique
- student_id non-null
- class_code exists in reference table
- registration_status accepted value
- source rows reconcile to staging
- invalid rows quarantined
- dashboard only publishes after quality gates pass
```

## Distilled skill rule

Build data quality checks, thresholds, remediation, and consumer-visible status into production data pipelines.

---

# 10. Schema Evolution and Data Contracts Must Be Managed

## Core teaching

Data schemas change. Producers add, remove, rename, or reinterpret fields. Consumers depend on schemas. Without contracts and compatibility management, data systems break silently.

The engineering behavior being taught is:

```text
Treat shared data schemas like contracts, with versioning, compatibility, and consumer impact checks.
```

For Codex, this is essential for APIs, events, files, warehouse tables, and data products.

## Codex trigger

Apply this when Codex is:

- consuming external APIs/files/events
- publishing datasets
- modifying schemas
- changing event payloads
- creating data products
- altering warehouse tables
- supporting downstream dashboards/ML/features
- managing source schema drift

## Signals and smells

Codex should notice:

- source adds/removes fields without detection
- column rename breaks dashboards
- no schema registry/contract
- consumers depend on undocumented fields
- event schema changes are unversioned
- CSV column order changes break pipeline
- metric meaning changes under same name
- no compatibility tests
- no deprecation process
- schema drift silently loads wrong data

## Desired Codex behavior

Codex should define schema evolution strategy.

It should support:

```text
schema validation
compatibility rules
additive changes
breaking changes with versioning
deprecation windows
consumer impact analysis
schema drift alerts
contract tests
```

## Implementation guidance

Codex should:

- validate incoming schemas
- fail/quarantine unexpected breaking changes
- prefer additive changes for published datasets
- version breaking changes
- maintain compatibility views where useful
- track known consumers
- update docs/catalog/metadata with schema changes
- add schema drift monitoring
- use schema registries/contracts where appropriate
- write migration/backfill logic for changed fields

## Review guidance

Codex should ask:

- Is this schema consumed by others?
- Is the change backward compatible?
- What happens if source schema changes?
- Are consumers tested?
- Is versioning needed?
- Is the semantic meaning changing?
- Is documentation/catalog updated?
- Is there a deprecation plan?

## Testing / verification guidance

Codex should recommend:

- schema validation tests
- schema drift tests
- backward compatibility tests
- consumer-driven contract tests
- old/new schema migration tests
- event compatibility tests
- dashboard regression tests
- deprecation tests

## Tradeoffs and cautions

For internal private intermediate tables, schema change can be faster. For published/shared data, compatibility discipline is necessary.

## Example transformation

**Before:**

```text
Source CSV changes `Parent Phone` to `Phone Number`. Pipeline maps wrong column to null and dashboard silently degrades.
```

**After:**

```text
Pipeline validates expected schema.
Unexpected rename fails ingestion with clear error.
Contract update requires mapping change, test update, and documented version.
```

## Distilled skill rule

Manage shared data schemas as contracts with validation, compatibility checks, versioning, deprecation, and consumer-impact testing.

---

# 11. Metadata, Lineage, and Cataloging Enable Trust and Reuse

## Core teaching

Metadata and lineage make data understandable, discoverable, trustworthy, governable, and debuggable. Without metadata, pipelines and datasets become tribal knowledge.

The engineering behavior being taught is:

```text
Capture enough metadata and lineage for consumers and maintainers to understand where data came from, what it means, and whether it is safe to use.
```

For Codex, this means data work should include metadata deliverables.

## Codex trigger

Apply this when Codex is:

- creating datasets
- publishing data products
- building pipelines
- designing warehouses
- creating dashboards
- defining metrics
- transforming data
- debugging data discrepancies
- changing source schemas

## Signals and smells

Codex should notice:

- no table/column descriptions
- no owner
- no source mapping
- no freshness info
- no lineage from source to dashboard
- no metric definitions
- no sensitivity tags
- duplicate datasets with unclear differences
- consumers ask what fields mean
- maintainers cannot trace where bad data came from
- schema changes have unknown impact

## Desired Codex behavior

Codex should add metadata and lineage at creation time.

Metadata should include:

```text
owner
domain
source
description
grain/entity meaning
schema/field definitions
freshness/update frequency
quality checks/status
sensitivity classification
lineage
known consumers
retention
examples
```

## Implementation guidance

Codex should:

- add table/model docs
- include source and load metadata in tables
- generate or update catalog entries
- document transformations and metric formulas
- tag sensitive fields
- preserve lineage fields
- expose freshness to consumers
- include sample queries
- update metadata when schemas change
- prefer machine-readable metadata where possible

## Review guidance

Codex should ask:

- Can a consumer discover and understand this data?
- Can a maintainer trace it to source?
- Are transformations documented?
- Is owner/support known?
- Are quality/freshness visible?
- Are sensitive fields classified?
- Are downstream impacts known?

## Testing / verification guidance

Codex should recommend:

- metadata completeness checks
- documentation generation tests
- lineage validation tests
- freshness status tests
- source mapping tests
- sensitivity tag tests
- catalog publication tests
- sample query tests

## Tradeoffs and cautions

Metadata must be maintained. Avoid verbose manual docs for every temporary table. Focus on shared, production, sensitive, or decision-critical data.

## Example transformation

**Before:**

```text
Table `mart_reg_final_v2` exists. No one knows source, grain, owner, freshness, or metric meaning.
```

**After:**

```text
Catalog entry:
Registration Applications Mart
Owner: Enrollment
Grain: one row per registration application
Sources: enrollment_app.registrations, class_reference
Freshness: hourly
Quality checks: status, class_code, uniqueness
Sensitivity: contains student identifiers
Examples: count registrations by class and school year
```

## Distilled skill rule

For shared data, provide metadata and lineage for ownership, meaning, source, grain, freshness, quality, sensitivity, transformations, and examples.

---

# 12. Security, Privacy, and Governance Apply Across the Data Lifecycle

## Core teaching

Security and governance are not separate final steps. They apply across data generation, ingestion, storage, transformation, serving, access, sharing, retention, and deletion.

The engineering behavior being taught is:

```text
Build data security, privacy, access control, and governance into every lifecycle stage.
```

For Codex, this means sensitive data should not leak into raw zones, logs, development environments, dashboards, exports, or ML features without controls.

## Codex trigger

Apply this when Codex is:

- ingesting PII/sensitive data
- creating raw/staging zones
- building dashboards
- exporting data
- logging pipeline data
- creating test datasets
- designing access policies
- storing files
- using external AI/API services
- building data products
- implementing retention/deletion

## Signals and smells

Codex should notice:

- sensitive fields logged
- raw zone has broad access
- dashboards expose row-level PII unnecessarily
- production data copied to dev
- no masking/tokenization
- exports unrestricted
- no audit logs
- retention not defined
- access granted at database level too broadly
- sensitive data duplicated into many systems
- no purpose limitation
- no field classification

## Desired Codex behavior

Codex should classify data and apply appropriate controls.

Controls may include:

```text
data minimization
field classification
role-based access
row/column-level security
masking/tokenization
encryption
audit logging
retention/deletion
safe logging
secure secrets handling
dev/test anonymization
export controls
```

## Implementation guidance

Codex should:

- identify sensitive fields early
- avoid collecting/storing unnecessary sensitive data
- restrict raw/staging access
- mask/tokenize fields where full value is not needed
- avoid logging PII/secrets
- enforce least privilege
- define access policies for serving layers
- secure object/file storage
- audit sensitive access
- define retention and purge processes
- create anonymized test data

## Review guidance

Codex should ask:

- What sensitive data enters this lifecycle?
- Where is it copied?
- Who can access each layer?
- Is access least-privilege?
- Are logs safe?
- Are exports controlled?
- Is retention/deletion defined?
- Is dev/test data anonymized?
- Are downstream consumers constrained?

## Testing / verification guidance

Codex should recommend:

- authorization tests
- masking tests
- sensitive logging tests
- export permission tests
- retention/deletion tests
- field classification checks
- audit log tests
- secret scans
- dev/test anonymization checks

## Tradeoffs and cautions

Security should be proportional but strict for personal, financial, student, health, credential, or regulated data. Raw zones may be especially sensitive because they often contain unfiltered data.

## Example transformation

**Before:**

```text
Raw registration payloads with TZ numbers, addresses, parent phones, and documents are stored in a shared bucket accessible to all analysts.
```

**After:**

```text
Raw zone access restricted to pipeline/admin roles.
Curated marts expose masked IDs by default.
Sensitive document fields are stored separately with audit logging.
Exports require elevated permission.
Retention policy purges expired documents.
```

## Distilled skill rule

Apply classification, least privilege, masking, safe logging, audit, export control, and retention across the entire data lifecycle.

---

# 13. DataOps Requires CI/CD, Testing, Observability, and Recovery

## Core teaching

Data pipelines are production software. DataOps applies engineering practices—version control, automated tests, CI/CD, monitoring, deployment discipline, incident response, and recovery—to data systems.

The engineering behavior being taught is:

```text
Treat data pipelines, models, and quality checks as production code with automated verification and operational ownership.
```

For Codex, this means data code should not be unmanaged scripts and manual dashboards.

## Codex trigger

Apply this when Codex is:

- writing pipeline code
- building dbt models
- creating orchestration DAGs
- deploying data jobs
- modifying warehouse models
- adding quality checks
- creating data products
- reviewing production readiness of data systems

## Signals and smells

Codex should notice:

- data scripts not version-controlled
- manual SQL edits in production
- no tests before deployment
- no CI for data models
- no environment separation
- pipeline failures discovered by users
- no rollback/backfill process
- no owner/runbook
- no code review for metric changes
- no deployment history
- no reproducible local/dev setup

## Desired Codex behavior

Codex should apply production engineering discipline to data work.

It should include:

```text
version control
code review
automated tests
CI validation
controlled deployment
environment promotion
observability
alerts
runbooks
rollback/forward-fix
backfill/replay
ownership
```

## Implementation guidance

Codex should:

- store pipeline/model code in repo
- add automated tests for transformations and quality
- use CI to run compile/tests/lint
- separate dev/staging/prod environments
- deploy through controlled pipeline
- record run metadata
- monitor freshness/errors/quality
- alert owners
- document recovery/backfill procedures
- make jobs idempotent and rerunnable

## Review guidance

Codex should ask:

- Is this data code versioned?
- Are tests automated?
- Does CI validate changes?
- How is it deployed?
- Is there environment separation?
- Who owns failures?
- Can it be rerun/backfilled?
- Are pipeline health and freshness monitored?
- Is there a runbook?

## Testing / verification guidance

Codex should recommend:

- CI model compile tests
- data quality tests
- transformation unit tests
- integration tests for connectors
- orchestration DAG tests
- idempotent rerun tests
- backfill tests
- alert tests
- deployment smoke tests
- runbook dry run

## Tradeoffs and cautions

Do not create enterprise-grade CI/CD for throwaway analysis. But anything recurring, shared, or decision-critical should be treated as production.

## Example transformation

**Before:**

```text
Analyst manually runs SQL every Monday and copies results into a dashboard.
```

**After:**

```text
Pipeline code is versioned.
CI validates SQL/model dependencies and tests.
Orchestrator runs scheduled job.
Quality gates validate output.
Dashboard freshness is monitored.
Runbook explains rerun/backfill.
```

## Distilled skill rule

Treat production data pipelines as software: versioned, tested, deployed through CI/CD, observable, owned, and recoverable.

---

# 14. Idempotency and Backfills Are Core Pipeline Requirements

## Core teaching

Data pipelines fail, rerun, and need backfills. A robust pipeline must be able to rerun safely without duplicating, corrupting, or losing data.

The engineering behavior being taught is:

```text
Design data jobs so reruns and historical backfills are safe, predictable, and auditable.
```

For Codex, this means every recurring production pipeline should have idempotency keys, batch/state tracking, and backfill strategy.

## Codex trigger

Apply this when Codex is:

- writing ingestion jobs
- creating transformation jobs
- using orchestration
- processing daily/hourly partitions
- handling failed loads
- implementing retries
- building CDC/streaming sinks
- rebuilding marts
- designing migration/backfill

## Signals and smells

Codex should notice:

- rerun creates duplicate rows
- retries repeat side effects
- no batch ID or partition key
- job overwrites entire table unnecessarily
- backfill requires manual SQL edits
- partial failure leaves inconsistent state
- no high-watermark state
- no way to rebuild a date range
- transformations depend on current time unpredictably
- late data cannot be reprocessed

## Desired Codex behavior

Codex should design idempotent and backfillable workflows.

It should define:

```text
idempotency key
batch/partition key
watermark/cursor
state storage
upsert/merge logic
deduplication rule
safe retries
backfill parameters
reconciliation after rerun
```

## Implementation guidance

Codex should:

- use deterministic keys
- process by partition/date/batch where possible
- record pipeline state
- avoid uncontrolled append-only duplicates
- use merge/upsert carefully
- make transformations deterministic
- support parameterized backfill ranges
- isolate staging from final publish
- validate row counts after reruns
- document recovery/backfill commands

## Review guidance

Codex should ask:

- What happens if this job runs twice?
- What happens if it fails halfway?
- Can a date range be backfilled?
- Are keys deterministic?
- Is state/watermark stored safely?
- Are late records handled?
- Is output published atomically or partially?

## Testing / verification guidance

Codex should recommend:

- rerun/idempotency tests
- duplicate prevention tests
- partial failure tests
- backfill range tests
- late-arriving data tests
- watermark/cursor tests
- reconciliation after backfill
- atomic publish tests

## Tradeoffs and cautions

Idempotency can require extra complexity. For one-off scripts, a manual backup may be enough. For production pipelines, idempotency is essential.

## Example transformation

**Before:**

```text
Daily job appends all API results to payment_fact. If retried, payments duplicate.
```

**After:**

```text
Daily job stages batch with load_batch_id.
Payment rows are merged by source_payment_id.
Rerun of same day produces same final table.
Backfill accepts start_date/end_date and reconciles totals.
```

## Distilled skill rule

Design recurring data jobs to be safely rerunnable and backfillable using deterministic keys, state tracking, partitions, and reconciliation.

---

# 15. Cost and Performance Are Architectural Concerns

## Core teaching

Data systems can become expensive and slow if storage, compute, partitioning, file formats, query patterns, and orchestration are ignored. Cost and performance must be designed, measured, and optimized intentionally.

The engineering behavior being taught is:

```text
Design data systems for the expected workload and cost model, not just correctness.
```

For Codex, this means understanding how data volume, query shape, partitions, clustering, and compute pricing affect architecture.

## Codex trigger

Apply this when Codex is:

- designing warehouse/lake tables
- writing large SQL queries
- creating dashboards
- choosing file formats
- building pipelines
- optimizing slow jobs
- reducing cloud data costs
- creating aggregation layers
- setting partitioning/clustering

## Signals and smells

Codex should notice:

- queries scan entire large tables
- no partitioning by date
- inefficient file format for analytics
- many tiny files
- dashboard runs expensive raw joins repeatedly
- transformations recompute all history every run
- streaming used when batch would be cheaper
- duplicate storage of same data with no purpose
- no cost monitoring
- no performance baseline
- unbounded backfills

## Desired Codex behavior

Codex should design for workload-aware performance and cost.

It should consider:

```text
data volume
query patterns
partitioning
clustering/indexing
file format
incremental processing
aggregation
materialized views
compute scaling
storage lifecycle
cache/reuse
cost visibility
```

## Implementation guidance

Codex should:

- partition large analytical tables by common filters/date
- cluster/index by common join/filter keys
- use columnar formats for analytical data where appropriate
- avoid full refresh when incremental is sufficient
- create governed aggregates for common dashboards
- avoid expensive transformations in BI tools
- monitor query/job costs
- archive cold data
- prevent accidental unbounded scans
- benchmark with realistic data

## Review guidance

Codex should ask:

- What is the expected data volume?
- What queries will run most often?
- Are partitions/clustering appropriate?
- Is processing incremental?
- Are dashboards scanning too much?
- Is storage format appropriate?
- Is cost monitored?
- Can this scale without surprise bills?

## Testing / verification guidance

Codex should recommend:

- query performance tests
- explain-plan review
- partition pruning checks
- incremental processing tests
- job duration monitoring
- cost monitoring/alerts
- dashboard load tests
- aggregate reconciliation tests
- file-size/compaction checks

## Tradeoffs and cautions

Do not prematurely optimize tiny datasets. But design should avoid obviously unbounded scans and full refreshes that will break at scale.

## Example transformation

**Before:**

```text
Hourly job recomputes all payment history from raw files and dashboard scans full payment table every refresh.
```

**After:**

```text
Pipeline processes only changed partitions.
Payment fact partitioned by payment_date.
Monthly dashboard uses reconciled aggregate table.
Cost and runtime metrics are monitored.
```

## Distilled skill rule

Treat performance and cost as design constraints: partition, cluster, process incrementally, aggregate intentionally, and monitor query/job cost.

---

# 16. Avoid Tool-First Data Architecture

## Core teaching

Modern data engineering has many tools, but tools should follow architecture and lifecycle requirements. Tool-first thinking leads to expensive, complex, mismatched systems.

The engineering behavior being taught is:

```text
Choose tools after clarifying data lifecycle, workload, team capability, governance, and consumer needs.
```

For Codex, this prevents default recommendations like “use Kafka,” “use Spark,” “use dbt,” “use Snowflake,” or “use a lakehouse” without context.

## Codex trigger

Apply this when user asks:

- “What tool should I use?”
- “Should I use Kafka/Spark/dbt/Airflow/Snowflake/Databricks?”
- “What stack should I build?”
- “How do I make a data platform?”
- “Should I use real-time?”
- “Should I build a lakehouse?”
- “Which architecture is best?”

## Signals and smells

Codex should notice:

- technology chosen before requirements
- architecture justified by vendor popularity
- tool adds operational burden beyond team ability
- data volume does not require big-data tooling
- streaming tool proposed for slow business process
- warehouse proposed for operational transactions
- tool overlap/duplication
- no migration/operational plan
- no cost model
- no team skill assessment

## Desired Codex behavior

Codex should evaluate requirements first.

It should ask:

```text
What problem are we solving?
What is data volume/velocity/variety?
What latency is required?
What consumers exist?
What transformations are needed?
What team can operate?
What governance/security is required?
What cost constraints exist?
What tools already exist?
```

Only then recommend tooling.

## Implementation guidance

Codex should:

- propose simplest sufficient architecture
- prefer existing tools if adequate
- avoid adding runtime components without operations plan
- map tool choice to lifecycle stage
- identify tradeoffs and lock-in
- include cost/operational considerations
- recommend proof-of-concept for uncertain tools
- keep tool boundaries explicit

## Review guidance

Codex should ask:

- Is this tool solving a real requirement?
- Is the team able to operate it?
- Is there a simpler option?
- Does this duplicate existing capability?
- What are cost and lock-in risks?
- What would make this tool choice wrong?
- Can we validate with a small pilot?

## Testing / verification guidance

Codex should recommend:

- proof-of-concept tests
- benchmark with realistic workload
- operational runbook validation
- cost estimate/monitoring
- failure-mode tests
- integration tests with existing stack
- migration/rollback tests

## Tradeoffs and cautions

Sometimes choosing a mature tool early creates leverage. The caution is not against tools; it is against tools replacing thinking.

## Example transformation

**Before:**

```text
Codex recommends Kafka + Spark + lakehouse for a small daily CSV reporting pipeline.
```

**After:**

```text
Codex recommends:
- scheduled batch ingestion
- object storage/raw table
- SQL/dbt transformations
- warehouse/dashboard

Streaming deferred unless freshness requirements become sub-minute or source events justify it.
```

## Distilled skill rule

Choose data tools only after lifecycle, workload, latency, governance, cost, and team-operability requirements are clear.

---

# 17. Data Modeling Depends on Workload: OLTP, OLAP, Data Products, ML

## Core teaching

Different data workloads require different modeling approaches. Operational applications, analytical warehouses, data products, and ML features should not all use the same schema shape.

The engineering behavior being taught is:

```text
Model data for its workload and consumers instead of assuming one universal schema.
```

For Codex, this means distinguishing normalized transactional schemas, dimensional models, wide serving tables, feature tables, event streams, and API contracts.

## Codex trigger

Apply this when Codex is:

- designing database schemas
- creating warehouse tables
- creating data products
- building ML feature stores
- creating APIs
- creating dashboards
- transforming operational data
- denormalizing data for serving
- designing read models

## Signals and smells

Codex should notice:

- normalized OLTP schema used directly for BI
- star schema used for transactional writes
- ML features calculated differently from BI metrics
- data product exposes source internals
- one table tries to satisfy all use cases
- dashboard-specific denormalization becomes source of truth
- model lacks grain
- entities/facts/events confused
- no semantic layer for metrics

## Desired Codex behavior

Codex should choose model type by use case.

Examples:

```text
OLTP: normalized, constraints, transactional integrity
OLAP/BI: facts, dimensions, grain, conformed dimensions
Data product: contract, documentation, quality, access, semantics
ML feature: point-in-time correctness, leakage prevention, training/serving consistency
Event stream: event schema, ordering, idempotency, replay
Search/read model: denormalized, derived, rebuildable
```

## Implementation guidance

Codex should:

- identify workload first
- avoid exposing OLTP internals as analytics interface
- model analytical data with declared grain
- create derived read models for serving needs
- maintain source of truth and lineage
- define contracts for data products/events/APIs
- test workload-specific correctness
- avoid letting derived models become authoritative accidentally

## Review guidance

Codex should ask:

- What workload is this model serving?
- Is this model authoritative or derived?
- Is grain/entity meaning clear?
- Are constraints appropriate?
- Can consumers query/use it easily?
- Is it safe for ML/training if applicable?
- Does it preserve source lineage?

## Testing / verification guidance

Codex should recommend:

- OLTP constraint tests
- dimensional grain/reconciliation tests
- data product contract tests
- ML point-in-time/leakage tests
- event schema/replay tests
- read model rebuild tests
- source-vs-derived reconciliation

## Tradeoffs and cautions

Multiple models increase complexity, but forcing one model to serve all purposes often creates worse complexity. Codex should use derived models when consumption needs differ.

## Example transformation

**Before:**

```text
Same `students` table is used for registration writes, dashboards, exports, ML risk scoring, and search.
```

**After:**

```text
OLTP students table: operational source of truth.
registration_fact/student_dim: analytics.
StudentProfile data product: governed consumer interface.
student_search_index: derived searchable model.
ML feature table: point-in-time features with training/serving consistency.
```

## Distilled skill rule

Choose data model shape by workload: transactional, analytical, data product, ML feature, event stream, or derived serving model.

---

# 18. ML and Advanced Analytics Require Point-in-Time Correctness

## Core teaching

Machine learning and advanced analytics depend on features that reflect what was known at the time of prediction. Feature leakage, inconsistent training/serving logic, and poor lineage undermine models.

The engineering behavior being taught is:

```text
For ML-oriented data, preserve point-in-time correctness, reproducibility, and training-serving consistency.
```

For Codex, this prevents treating ML feature tables like ordinary BI aggregates.

## Codex trigger

Apply this when Codex is:

- building ML feature pipelines
- creating prediction datasets
- preparing training data
- serving features online/offline
- joining historical labels/features
- creating advanced analytics tables
- designing feature stores
- using time-series data for predictions

## Signals and smells

Codex should notice:

- features include future information
- training uses data unavailable at prediction time
- feature calculation differs between training and serving
- no feature timestamp
- labels leak into features
- historical corrections change training data silently
- no reproducible dataset version
- no lineage from features to source
- dashboards metrics reused as ML features without time checks

## Desired Codex behavior

Codex should enforce ML data correctness.

It should ask:

```text
What was known at prediction time?
What is the event time?
What is the feature timestamp?
What is the label timestamp?
Can features be reproduced?
Is training logic same as serving logic?
Is data leakage possible?
```

## Implementation guidance

Codex should:

- include event time and processing time
- perform point-in-time joins
- separate labels from features
- version training datasets
- preserve feature lineage
- validate training-serving consistency
- avoid using future aggregates
- define feature freshness requirements
- test backfills and reproducibility
- document feature definitions

## Review guidance

Codex should ask:

- Is there leakage?
- Are features available at prediction time?
- Are timestamps correct?
- Can training data be reproduced?
- Is online/offline logic consistent?
- Are labels separated?
- Are historical corrections handled?

## Testing / verification guidance

Codex should recommend:

- point-in-time join tests
- leakage tests
- training-serving skew tests
- feature freshness tests
- reproducibility tests
- dataset version tests
- label/feature separation tests
- backfill tests

## Tradeoffs and cautions

Not every analytics pipeline is ML-critical. Apply this rigor when data drives predictions, automated decisions, or model training.

## Example transformation

**Before:**

```text
Student risk model uses current payment balance to predict risk at registration time, accidentally including payments made after registration.
```

**After:**

```text
Feature pipeline computes payment_balance_as_of_registration_date using point-in-time joins. Training dataset version records source snapshots and feature definitions.
```

## Distilled skill rule

For ML data, enforce point-in-time correctness, leakage prevention, reproducibility, and training-serving consistency.

---

# 19. Reverse ETL and Operational Analytics Need Source-of-Truth Discipline

## Core teaching

Data may flow from analytical systems back into operational tools. This can be valuable but dangerous if derived data is stale, unaudited, or treated as authoritative.

The engineering behavior being taught is:

```text
When serving analytical data back to operational systems, define ownership, freshness, safety, and correction paths explicitly.
```

For Codex, this prevents dashboards/warehouse outputs from silently becoming operational truth.

## Codex trigger

Apply this when Codex is:

- syncing warehouse data to CRM/app tools
- sending segments to marketing/support systems
- operationalizing analytics scores
- building admin recommendations
- writing back derived metrics
- using warehouse data in application workflows
- creating operational dashboards

## Signals and smells

Codex should notice:

- warehouse value overwrites operational source
- stale analytical data drives live decision
- no freshness displayed
- no audit of reverse sync
- no rollback
- derived score treated as fact
- no owner for correction
- operational users cannot see source/lineage
- sync duplicates or loops data
- no contract with target system

## Desired Codex behavior

Codex should treat reverse ETL as a production integration.

It should define:

```text
source of truth
derived vs authoritative status
freshness
sync frequency
target contract
idempotency
audit logging
rollback
access/purpose
correction workflow
```

## Implementation guidance

Codex should:

- avoid overwriting authoritative operational fields with derived data unless approved
- write to clearly labeled derived/recommendation fields
- include last_updated/source metadata
- make sync idempotent
- log sync runs and changes
- test target API contracts
- define stale data behavior
- prevent circular data flows
- document correction path

## Review guidance

Codex should ask:

- Is this data authoritative or derived?
- Is it fresh enough for the operational use?
- Where should corrections happen?
- Could this create a feedback loop?
- Is sync idempotent?
- Is access/purpose appropriate?
- Are changes audited?

## Testing / verification guidance

Codex should recommend:

- target contract tests
- idempotent sync tests
- freshness tests
- stale-data behavior tests
- audit log tests
- rollback tests
- duplicate prevention tests
- circular dependency checks

## Tradeoffs and cautions

Reverse ETL can close the gap between analytics and operations, but it increases risk. Use it for clearly defined operational use cases with visible freshness and ownership.

## Example transformation

**Before:**

```text
Warehouse-calculated family_balance overwrites balance in the billing system nightly.
```

**After:**

```text
Billing system remains source of truth.
Warehouse sends derived_risk_flag and last_calculated_at to admin tool.
Admins see recommendation metadata.
Corrections go to billing source system.
```

## Distilled skill rule

When analytical data flows back into operations, label it as derived, enforce freshness/idempotency, audit changes, and preserve source-of-truth boundaries.

---

# 20. Senior Engineering Judgment from _Fundamentals of Data Engineering_

## Core teaching

The deeper lesson is pragmatic lifecycle discipline. Good data engineering is not about memorizing tools; it is about designing reliable, observable, secure, useful data flows from source generation to consumer value.

Codex should internalize this:

```text
Data engineering decisions should be driven by lifecycle stage, source behavior, consumer needs, quality requirements, operational reliability, governance, cost, and team capability.
```

## Codex trigger

Apply broadly when Codex is working on:

- data pipelines
- ETL/ELT
- ingestion
- data warehouses/lakes/lakehouses
- dashboards
- data products
- ML feature pipelines
- reverse ETL
- orchestration
- data quality
- schema contracts
- cloud data architecture
- data platform strategy

## Signals and smells

Codex should notice:

- tool-first recommendations
- no consumer/use case
- unknown source semantics
- no raw/staging separation
- no data quality checks
- no orchestration semantics
- no idempotency/backfill
- no metadata/lineage
- no schema contract
- no security/privacy controls
- no cost/performance consideration
- no monitoring/alerts
- one model serving every workload badly
- ML features with leakage risk
- reverse ETL breaking source-of-truth boundaries

## Desired Codex behavior

Codex should:

- map the lifecycle
- work backward from consumers
- analyze source systems
- choose batch/streaming/CDC intentionally
- preserve raw data when replay matters
- choose storage by workload
- layer transformations
- orchestrate with retries/backfills/quality gates
- add quality checks
- manage schema contracts
- document metadata and lineage
- enforce security and governance
- apply DataOps practices
- design idempotent pipelines
- consider cost/performance
- avoid tool-first overengineering
- model data by workload
- protect ML point-in-time correctness
- manage reverse ETL carefully

## Implementation guidance

Codex should:

- create raw/staging/curated/serving layers where appropriate
- include batch IDs, load timestamps, source metadata
- implement reliable incremental extraction
- validate source schemas and data quality
- make transformations modular and testable
- use orchestration for dependencies and recovery
- make jobs rerunnable and backfillable
- publish consumer-ready models/contracts
- add freshness/quality/lineage metadata
- secure sensitive data at every layer
- benchmark and monitor large workloads
- document decisions and operational runbooks

## Review guidance

Codex should check:

- What lifecycle stage is affected?
- Who consumes the data?
- What source assumptions exist?
- Is processing mode justified?
- Is storage appropriate?
- Are transformations layered and tested?
- Is quality enforced?
- Is schema evolution handled?
- Is lineage documented?
- Is sensitive data protected?
- Are pipelines observable and recoverable?
- Are cost/performance risks understood?
- Is the chosen tool the simplest sufficient option?

## Testing / verification guidance

Codex should recommend:

- source connector tests
- schema drift/contract tests
- source-to-target reconciliation
- transformation tests
- quality tests
- orchestration/DAG tests
- idempotency and rerun tests
- backfill tests
- freshness and lag monitoring
- access/masking tests
- metadata completeness tests
- performance/cost tests
- ML point-in-time/leakage tests
- reverse ETL contract/idempotency tests

## Tradeoffs and cautions

Do not overbuild data platforms prematurely. A simple scheduled pipeline, relational database, and clear reporting table may be enough for small use cases.

But when data is recurring, shared, decision-critical, sensitive, or operationally important, Codex should treat it as production software and apply lifecycle discipline.

## Example transformation

**Before:**

```text
Codex builds a quick script:
- reads registrations from production DB
- transforms in one SQL query
- writes dashboard table
- no tests, no freshness, no lineage, no rerun safety
```

**After:**

```text
Codex designs a production data flow:
- source assumptions documented
- raw/staging extract with batch_id and load_dts
- modular transformations
- registration mart with declared grain
- quality checks for status/class/student keys
- source reconciliation
- orchestration with retries and backfill
- freshness shown to dashboard
- sensitive fields masked
- pipeline runbook and ownership defined
```

## Distilled skill rule

Design data systems lifecycle-first: understand sources and consumers, choose processing/storage intentionally, build testable and observable pipelines, enforce quality/security/governance, and avoid tool-first complexity.

---

# Compression Candidates for Future `SKILL.md`

These are candidate rules to compress into a future Codex skill:

```text
Design data work around the full lifecycle—generation, ingestion, storage, transformation, serving, governance, monitoring, and retention—before choosing tools or writing pipelines.
```

```text
Design pipelines and models backward from real consumers, decisions, freshness, grain, quality, and serving interfaces.
```

```text
Before building ingestion, document source keys, update/delete semantics, timestamps, schema drift, extraction limits, and failure modes.
```

```text
Choose batch, streaming, or CDC from latency, change-capture, correctness, cost, and operational requirements—not from trend or preference.
```

```text
Preserve raw or minimally transformed source data before irreversible transformations when replay, audit, debugging, or changing business logic matters.
```

```text
Choose data storage by workload, access pattern, consistency, lifecycle, security, cost, and whether the store is authoritative or derived.
```

```text
Keep transformations modular, layered, documented, testable, deterministic, and out of dashboards when they define shared business logic.
```

```text
Orchestrate data workflows with explicit dependencies, retries, backfills, quality gates, run metadata, alerts, and recovery—not just schedules.
```

```text
Build data quality checks, thresholds, remediation, and consumer-visible status into production data pipelines.
```

```text
Manage shared data schemas as contracts with validation, compatibility checks, versioning, deprecation, and consumer-impact testing.
```

```text
For shared data, provide metadata and lineage for ownership, meaning, source, grain, freshness, quality, sensitivity, transformations, and examples.
```

```text
Apply classification, least privilege, masking, safe logging, audit, export control, and retention across the entire data lifecycle.
```

```text
Treat production data pipelines as software: versioned, tested, deployed through CI/CD, observable, owned, and recoverable.
```

```text
Design recurring data jobs to be safely rerunnable and backfillable using deterministic keys, state tracking, partitions, and reconciliation.
```

```text
Treat performance and cost as design constraints: partition, cluster, process incrementally, aggregate intentionally, and monitor query/job cost.
```

```text
Choose data tools only after lifecycle, workload, latency, governance, cost, and team-operability requirements are clear.
```

```text
Choose data model shape by workload: transactional, analytical, data product, ML feature, event stream, or derived serving model.
```

```text
For ML data, enforce point-in-time correctness, leakage prevention, reproducibility, and training-serving consistency.
```

```text
When analytical data flows back into operations, label it as derived, enforce freshness/idempotency, audit changes, and preserve source-of-truth boundaries.
```

```text
Design data systems lifecycle-first: understand sources and consumers, choose processing/storage intentionally, build testable and observable pipelines, enforce quality/security/governance, and avoid tool-first complexity.
```
