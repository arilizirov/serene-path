# skillsources BigBrainSE

## Extracted Codex-Skill Training Material

### Source
**Designing Data-Intensive Applications** by Martin Kleppmann

This file contains raw extraction data for building a future Codex skill. It is not yet the final skill. The goal is to convert the book’s engineering judgment into operational behavior for an AI coding agent.

**Primary domains:** architecture, production readiness, data modeling, distributed systems, reliability, scalability, maintainability, performance, testing, and senior engineering judgment.

---

# 1. Reliable, Scalable, and Maintainable Systems

## Core teaching

Data systems should be judged by three long-term qualities:

- **Reliability:** keeps working correctly despite faults.
- **Scalability:** handles growth in data, traffic, and complexity.
- **Maintainability:** remains understandable and changeable over time.

The senior-engineering lesson is that “it works” is not enough. Codex should reason about how a design behaves under load, failure, change, and future maintenance.

## Codex trigger

Apply this when Codex is:

- designing a backend service
- adding a database-backed feature
- creating APIs
- reviewing architecture
- introducing caches, queues, search indexes, or background jobs
- modifying critical business workflows
- choosing between storage or processing technologies

## Signals and smells

Codex should notice:

- vague claims like “this should scale”
- no stated workload assumptions
- no error-handling strategy
- no plan for schema or API evolution
- business logic spread across unrelated layers
- unclear ownership of data
- no metrics or observability
- performance assumptions without measurement
- tight coupling between unrelated components

## Desired Codex behavior

Codex should avoid treating implementation as only a coding task. It should identify:

- what can fail
- what can grow
- what can change
- what must remain understandable

Before proposing a design, Codex should state the relevant tradeoff: simplicity versus scale, consistency versus availability, latency versus durability, normalized versus denormalized data, synchronous versus asynchronous processing.

## Implementation guidance

When writing or modifying code, Codex should:

- keep data ownership explicit
- separate core domain logic from infrastructure details
- make failure cases visible
- prefer simple designs until workload demands complexity
- avoid premature distributed architecture
- add clear boundaries around databases, queues, caches, and external systems
- make assumptions explicit in comments, tests, or architecture notes where useful

## Review guidance

Codex should ask:

- What does this design assume about data size?
- What does it assume about request volume?
- What happens if a dependency is slow or unavailable?
- Can this data model evolve?
- Can this code be understood by another developer later?
- Is the source of truth clear?
- Is complexity justified by the current or near-future workload?

## Testing / verification guidance

Codex should recommend:

- tests for normal behavior
- tests for dependency failure
- tests with larger-than-usual data sets
- migration tests
- concurrency tests where data can be updated by multiple actors
- observability checks for critical workflows

## Tradeoffs and cautions

Do not over-engineer small systems. A simple monolith with a relational database may be better than a distributed architecture. Codex should avoid adding Kafka, microservices, event sourcing, sharding, or distributed consensus unless there is a clear workload or organizational reason.

## Example transformation

**Before:**

```text
Add a queue so the system scales.
```

**After:**

```text
This workflow has slow email/PDF generation that should not block the request path. Use a background queue for non-critical work, keep the database as the source of truth, make jobs idempotent, add retry limits, and expose failed-job status to admins.
```

## Distilled skill rule

When designing data-intensive features, evaluate reliability, scalability, and maintainability before choosing implementation details.

---

# 2. Data Models and Query Languages

## Core teaching

Data models shape how developers think. Choosing relational, document, graph, key-value, or event-based models is not just a storage choice; it affects query patterns, constraints, evolution, and code complexity.

## Codex trigger

Apply this when Codex is:

- designing tables or collections
- creating entities
- modeling relationships
- choosing SQL versus NoSQL
- adding search/filtering
- changing data ownership
- creating APIs around domain objects

## Signals and smells

Codex should notice:

- nested JSON used to model highly relational data
- join-heavy queries over data stored in document form
- relational tables storing unstructured blobs without reason
- duplicated fields without sync strategy
- unclear one-to-many or many-to-many relationships
- API shape copied directly from database shape
- lack of indexes for common access patterns
- unclear constraints or invariants

## Desired Codex behavior

Codex should model data around:

- access patterns
- relationships
- consistency needs
- expected evolution
- ownership boundaries
- query requirements

It should not choose a database style because it is fashionable.

## Implementation guidance

Codex should:

- use relational modeling when relationships and constraints are central
- use document-style modeling when data is naturally self-contained and usually accessed together
- consider graph modeling when relationships between entities are the main query target
- avoid duplicating data unless there is a clear read/performance reason and sync plan
- encode business invariants close to the data model when practical
- design APIs around domain meaning, not only storage shape

## Review guidance

Codex should ask:

- What are the main queries?
- What data is usually loaded together?
- What data changes independently?
- Are relationships simple, nested, relational, or graph-like?
- What constraints must always hold?
- Is denormalization intentional?
- How will duplicated data stay correct?

## Testing / verification guidance

Codex should recommend:

- tests for relationship integrity
- tests for invalid states
- tests for query behavior
- tests for update paths that touch duplicated data
- migration tests when changing the model
- seed data that reflects real relationships, not toy examples only

## Tradeoffs and cautions

Relational normalization improves consistency but may make some reads more complex. Denormalization improves read performance but creates update complexity. Document models can simplify self-contained objects but become awkward when relationships grow.

## Example transformation

**Before:**

```json
{
  "student": "Ari",
  "className": "A1",
  "teacherName": "Rabbi Cohen"
}
```

**After:**

```text
Student belongs to Class.
Class has Teacher assignment.
Store references/foreign keys for entities that change independently.
Expose a read DTO that combines student, class, and teacher for UI convenience.
```

## Distilled skill rule

Model data according to relationships, access patterns, and invariants; do not let storage convenience hide domain structure.

---

# 3. Storage and Retrieval

## Core teaching

Storage engines optimize for different access patterns. Indexes speed reads but slow writes and consume space. Log-structured, B-tree, in-memory, analytical, and transactional storage designs have different strengths.

The senior-engineering lesson: performance problems are often data-access-pattern problems, not merely “slow code.”

## Codex trigger

Apply this when Codex is:

- writing database queries
- adding indexes
- designing repositories
- implementing search/filter/sort
- creating reporting features
- optimizing slow endpoints
- building import/export flows

## Signals and smells

Codex should notice:

- full table scans on common queries
- missing indexes on foreign keys or filters
- too many indexes on write-heavy tables
- loading entire tables into memory
- filtering in application code instead of the database
- N+1 queries
- unclear ordering in paginated queries
- reporting queries mixed with transactional paths
- frequent updates to indexed fields without considering write cost

## Desired Codex behavior

Codex should reason from query patterns:

- What is read often?
- What is written often?
- What is filtered, sorted, joined, or aggregated?
- Is this OLTP-style transactional access or OLAP-style analytical access?
- Is the endpoint latency-sensitive?

## Implementation guidance

Codex should:

- add indexes only for known query paths
- use pagination with stable ordering
- avoid unbounded reads
- avoid N+1 query patterns
- push filtering/sorting to the database when appropriate
- separate transactional workflows from heavy analytics/reporting where needed
- avoid premature low-level optimization before understanding workload

## Review guidance

Codex should ask:

- Does this query use an index?
- Is the result set bounded?
- Will this work with 10x or 100x more data?
- Is this endpoint doing reporting work in a user request?
- Are we trading write speed for read speed intentionally?
- Is the query plan likely to degrade as data grows?

## Testing / verification guidance

Codex should recommend:

- tests with large seed datasets
- query-plan inspection for critical queries
- performance tests for list/report endpoints
- regression tests for pagination correctness
- tests for N+1 query avoidance where ORM usage is involved

## Tradeoffs and cautions

Do not add indexes blindly. Every index has write and storage costs. Do not split read/write models or introduce specialized search infrastructure unless current queries justify it.

## Example transformation

**Before:**

```csharp
var students = db.Students.ToList()
    .Where(s => s.LastName.StartsWith(search))
    .OrderBy(s => s.LastName);
```

**After:**

```csharp
var students = await db.Students
    .Where(s => s.LastName.StartsWith(search))
    .OrderBy(s => s.LastName)
    .Take(50)
    .ToListAsync();
```

Plus: ensure an appropriate index exists for the searched field if this is a common path.

## Distilled skill rule

Design database access from real query patterns; bound result sets, avoid N+1s, and add indexes intentionally.

---

# 4. Encoding, Serialization, and Schema Evolution

## Core teaching

Data outlives code. Systems must handle old and new versions of data, APIs, messages, events, and schemas. Compatibility matters because distributed systems rarely upgrade all at once.

## Codex trigger

Apply this when Codex is:

- changing API request/response shapes
- changing database schemas
- modifying event/message formats
- adding fields to DTOs
- changing serialization
- creating migrations
- integrating services
- modifying queue payloads

## Signals and smells

Codex should notice:

- removing fields used by clients
- renaming fields without compatibility layer
- changing enum meanings
- changing date/time formats
- assuming all services deploy simultaneously
- brittle deserialization
- required fields added without defaults
- database migration and code change tightly coupled
- no versioning strategy for public contracts

## Desired Codex behavior

Codex should preserve compatibility by default. It should assume old and new versions may coexist.

## Implementation guidance

Codex should:

- prefer additive changes over breaking changes
- tolerate unknown fields when reading
- avoid changing field meaning without a migration strategy
- use expand-and-contract migrations
- keep old fields temporarily when renaming
- provide defaults for new fields
- version public APIs or message contracts when needed
- separate internal model changes from external contract changes

## Review guidance

Codex should ask:

- Can old clients still read this?
- Can new clients read old data?
- Can old services process new messages?
- Is this change backward-compatible?
- Is the migration safe during rolling deploy?
- What happens to queued messages created before this change?

## Testing / verification guidance

Codex should recommend:

- backward compatibility tests
- forward compatibility tests where practical
- migration rollback tests
- old-payload/new-code tests
- new-payload/old-code tests
- tests for default values and missing fields

## Tradeoffs and cautions

Versioning everything too early can add noise. Internal-only code can sometimes change directly. But anything persisted, queued, exposed through API, or shared between services should be treated as a long-lived contract.

## Example transformation

**Before:**

```json
{
  "name": "Ari Cohen"
}
```

Change directly to:

```json
{
  "firstName": "Ari",
  "lastName": "Cohen"
}
```

**After:**

```text
Step 1: Add firstName and lastName while still accepting name.
Step 2: Backfill existing data.
Step 3: Update readers to prefer new fields.
Step 4: Stop writing old field.
Step 5: Remove old field only after all clients are migrated.
```

## Distilled skill rule

Treat persisted data, APIs, and messages as long-lived contracts; prefer compatible, staged evolution over breaking changes.

---

# 5. Replication

## Core teaching

Replication improves availability, latency, and read scalability, but introduces consistency problems. Leaders, followers, lag, failover, conflicts, and stale reads must be handled deliberately.

## Codex trigger

Apply this when Codex is:

- using read replicas
- designing multi-node data access
- adding caching similar to replica behavior
- building offline sync
- adding failover behavior
- separating reads and writes
- using eventually consistent systems

## Signals and smells

Codex should notice:

- read-after-write assumptions while using replicas
- user writes data then immediately reads stale data
- no strategy for replica lag
- unclear leader/follower routing
- writes accepted in multiple places without conflict handling
- failover assumptions not tested
- cache treated as always fresh
- “eventual consistency” used vaguely

## Desired Codex behavior

Codex should identify consistency expectations for each workflow. It should not silently introduce stale reads where users expect immediate consistency.

## Implementation guidance

Codex should:

- route read-after-write flows to the primary/leader when needed
- expose pending/syncing status for eventually consistent flows
- design idempotent writes
- add conflict resolution where multiple writers exist
- avoid assuming failover is instantaneous
- make lag visible through metrics
- document where stale reads are acceptable

## Review guidance

Codex should ask:

- Can the user observe stale data here?
- Does this workflow require read-your-writes consistency?
- What happens during failover?
- Are writes single-leader or multi-leader?
- Are conflicts possible?
- Is replica lag monitored?
- Is eventual consistency acceptable to the business?

## Testing / verification guidance

Codex should recommend:

- tests for stale read behavior
- tests for read-after-write paths
- failover simulations
- duplicate write tests
- conflict-resolution tests
- lag-aware integration tests if infrastructure supports it

## Tradeoffs and cautions

Strong consistency simplifies reasoning but may reduce availability or increase latency. Eventual consistency can scale better but makes user experience and correctness harder. Do not use replicas for critical immediate reads without considering lag.

## Example transformation

**Before:**

```text
User submits profile update.
System writes to primary.
Next page reads from replica.
User sees old profile.
```

**After:**

```text
After profile update, either read from primary for that user/session or display “update pending” until replica catches up.
```

## Distilled skill rule

When using replicas or eventually consistent systems, make consistency expectations explicit and protect read-after-write workflows.

---

# 6. Partitioning / Sharding

## Core teaching

Partitioning spreads data and load across nodes, but creates challenges around keys, hotspots, joins, secondary indexes, rebalancing, and operational complexity.

## Codex trigger

Apply this when Codex is:

- designing large tables
- creating tenant-aware systems
- choosing partition keys
- adding multi-tenant data models
- building high-volume event/log systems
- planning horizontal scale
- using distributed databases

## Signals and smells

Codex should notice:

- partition key chosen without access-pattern analysis
- all writes going to one hot key
- tenant ID missing from multi-tenant queries
- cross-partition joins on hot paths
- global ordering assumptions
- secondary indexes assumed to be cheap
- no rebalancing strategy
- sharding introduced before necessary

## Desired Codex behavior

Codex should choose partitioning based on workload distribution and query patterns, not just entity identity.

## Implementation guidance

Codex should:

- include tenant/account/user partition keys where appropriate
- avoid monotonically increasing hot keys for high-write workloads
- design queries to include partition key when possible
- avoid cross-shard transactions unless clearly required
- consider operational tooling before recommending sharding
- document partitioning assumptions
- use simpler single-database designs until scale demands partitioning

## Review guidance

Codex should ask:

- What is the partition key?
- Will data and traffic distribute evenly?
- Are there hot tenants or hot records?
- Do common queries include the partition key?
- Are cross-partition operations required?
- How will rebalancing work?
- Is sharding actually needed now?

## Testing / verification guidance

Codex should recommend:

- tests with skewed data
- load tests around hot keys
- tenant-isolation tests
- query tests that verify partition filters
- migration/rebalancing dry runs where relevant

## Tradeoffs and cautions

Partitioning adds operational complexity. It can make joins, transactions, migrations, and debugging harder. Codex should avoid recommending sharding as a default solution for normal small-to-medium systems.

## Example transformation

**Before:**

```text
Partition orders by creation timestamp.
All new writes hit the newest partition.
```

**After:**

```text
Partition by tenant/account or a hash-distributed key if write load must spread evenly. Use timestamp as an indexed query field, not necessarily the partition key.
```

## Distilled skill rule

Choose partition keys from workload and query patterns; avoid designs that create hotspots or require frequent cross-partition operations.

---

# 7. Transactions

## Core teaching

Transactions provide safety guarantees, but isolation levels vary. Developers often assume stronger guarantees than the database actually provides. Concurrency anomalies must be understood and tested.

## Codex trigger

Apply this when Codex is:

- writing multi-step database updates
- handling payments, enrollment, inventory, balances, permissions, or counters
- checking uniqueness
- modifying related records
- implementing workflows with concurrent users
- choosing transaction isolation levels

## Signals and smells

Codex should notice:

- check-then-insert race conditions
- updating multiple tables without transaction
- relying on application checks instead of constraints
- counters updated non-atomically
- balance/payment logic without concurrency protection
- assuming repeatable reads under weak isolation
- no unique constraints for business uniqueness
- long-running transactions around external calls

## Desired Codex behavior

Codex should identify invariants and protect them using the right combination of transactions, constraints, locks, idempotency, and retries.

## Implementation guidance

Codex should:

- wrap related database writes in transactions
- use database constraints for critical invariants
- avoid external API calls inside database transactions
- use idempotency keys for retryable business actions
- consider optimistic concurrency where appropriate
- use atomic update statements for counters/balances
- document isolation assumptions in high-risk workflows

## Review guidance

Codex should ask:

- What invariant must always hold?
- Can two users perform this action at the same time?
- Does the database enforce this rule?
- Is there a race between read and write?
- What happens if the transaction partially fails?
- Are retries safe?
- Is the transaction too long?

## Testing / verification guidance

Codex should recommend:

- concurrent update tests
- duplicate submission tests
- transaction rollback tests
- uniqueness violation tests
- idempotency tests
- isolation-level-sensitive tests for critical logic

## Tradeoffs and cautions

Stronger isolation can reduce anomalies but may increase contention or reduce performance. Distributed transactions add complexity. Codex should not solve every issue with broad locks or serializable isolation unless the business invariant requires it.

## Example transformation

**Before:**

```csharp
if (!db.Students.Any(s => s.TzNumber == tz))
{
    db.Students.Add(new Student { TzNumber = tz });
    db.SaveChanges();
}
```

**After:**

```text
Add a unique constraint on TzNumber.
Attempt insert.
Handle unique-constraint violation as a duplicate.
Use a transaction if related records must be created atomically.
```

## Distilled skill rule

Protect business invariants with database guarantees, transactions, constraints, and idempotency rather than fragile application-only checks.

---

# 8. The Trouble with Distributed Systems

## Core teaching

Distributed systems are unreliable in subtle ways. Networks delay, duplicate, reorder, drop, and partition messages. Clocks are imperfect. Processes pause. Nodes may appear dead when they are merely slow.

The senior-engineering lesson: distributed systems require humility. Codex must not assume perfect communication or timing.

## Codex trigger

Apply this when Codex is:

- coordinating work across services
- using queues
- adding distributed locks
- implementing timeouts
- relying on timestamps
- building scheduled jobs
- checking heartbeats
- designing leader election
- using multiple services/databases

## Signals and smells

Codex should notice:

- assuming network calls either succeed or fail cleanly
- no timeout or retry policy
- distributed lock without lease/expiry/fencing
- using local clocks for ordering critical events
- assuming “server did not respond” means “server did not process”
- non-idempotent message handlers
- no duplicate-message handling
- background jobs that can run twice
- timeout treated as proof of failure

## Desired Codex behavior

Codex should design distributed interactions around uncertainty.

## Implementation guidance

Codex should:

- make message handlers idempotent
- use retries carefully with idempotency keys
- treat timeouts as unknown outcomes
- avoid relying on local wall-clock time for correctness
- include correlation IDs
- design for duplicate, delayed, and out-of-order messages
- use leases/fencing tokens for distributed locks where correctness matters
- prefer simpler single-node coordination when possible

## Review guidance

Codex should ask:

- What if this request succeeded but the response was lost?
- What if this message is delivered twice?
- What if messages arrive out of order?
- What if this process pauses for 30 seconds?
- What if two workers believe they own the job?
- What assumptions are being made about clocks?

## Testing / verification guidance

Codex should recommend:

- duplicate message tests
- delayed message tests
- out-of-order event tests
- timeout-with-side-effect tests
- job-run-twice tests
- clock-skew tests where relevant

## Tradeoffs and cautions

Do not introduce distributed coordination where local transactions are enough. Distributed locks and consensus systems are powerful but easy to misuse. Simpler architecture is often safer.

## Example transformation

**Before:**

```text
Send payment request.
If timeout occurs, send another payment request.
```

**After:**

```text
Send payment request with idempotency key.
If timeout occurs, query status or retry with same idempotency key.
Never assume timeout means payment did not happen.
```

## Distilled skill rule

In distributed workflows, treat timeouts, retries, clocks, and message delivery as uncertain; design idempotent, duplicate-safe operations.

---

# 9. Consistency and Consensus

## Core teaching

Consensus and strong consistency are hard but sometimes necessary. Many systems need agreement on leadership, ordering, membership, locks, or configuration. But consensus adds latency, operational complexity, and availability tradeoffs.

## Codex trigger

Apply this when Codex is:

- designing leader election
- using distributed locks
- requiring exactly-once-like behavior
- coordinating multiple workers
- managing global uniqueness
- designing critical configuration changes
- building workflows that require ordering or agreement

## Signals and smells

Codex should notice:

- “only one worker will do this” without enforcement
- cron jobs running on multiple instances
- global counters in distributed systems
- assuming queue ordering globally
- hand-rolled leader election
- distributed lock without correctness guarantees
- inconsistent config across services
- uniqueness required across shards

## Desired Codex behavior

Codex should avoid casual distributed coordination. When coordination is required, it should use proven infrastructure and make guarantees explicit.

## Implementation guidance

Codex should:

- prefer database constraints for uniqueness when possible
- use existing coordination systems rather than hand-rolled consensus
- make scheduled jobs safe to run more than once
- use fencing tokens for lock-protected resources
- avoid assuming global order unless the system provides it
- clearly document required consistency level
- design graceful behavior when coordinator is unavailable

## Review guidance

Codex should ask:

- What requires agreement here?
- Can this be solved with a local transaction instead?
- Is there a proven coordination mechanism?
- What happens if two nodes think they are leader?
- What happens if the lock holder pauses?
- Is global ordering truly required?

## Testing / verification guidance

Codex should recommend:

- multi-worker concurrency tests
- duplicate leader/job execution tests
- lock-expiry tests
- coordinator-unavailable tests
- ordering tests if order matters
- config propagation tests

## Tradeoffs and cautions

Consensus is not free. It can reduce availability and increase latency. Codex should not introduce it unless the correctness requirement justifies it.

## Example transformation

**Before:**

```text
Run nightly billing job on every app server, but check a flag first.
```

**After:**

```text
Make billing job idempotent.
Use a durable job scheduler or database-backed claim mechanism.
Protect generated invoices with unique constraints.
Assume the job may run twice.
```

## Distilled skill rule

Do not hand-wave coordination; either avoid it through idempotency/local constraints or use proven consensus/coordination mechanisms.

---

# 10. Batch Processing

## Core teaching

Batch processing is useful for large-scale derived data, backfills, analytics, indexing, reporting, and reconciliation. Batch jobs should be restartable, deterministic where possible, and safe to rerun.

## Codex trigger

Apply this when Codex is:

- writing imports
- creating exports
- backfilling data
- generating reports
- rebuilding search indexes
- processing large files
- running scheduled jobs
- migrating data

## Signals and smells

Codex should notice:

- one huge in-memory operation
- no checkpointing
- no resume strategy
- no idempotency
- no progress tracking
- no failure report
- partial writes without recovery plan
- batch jobs competing with user traffic
- no rate limiting
- no dry-run mode for dangerous migrations

## Desired Codex behavior

Codex should design batch jobs as operational workflows, not scripts that only work once.

## Implementation guidance

Codex should:

- process in chunks
- use checkpoints or resumable cursors
- make writes idempotent
- record progress and errors
- support dry-run for risky changes
- avoid loading all data into memory
- rate-limit or schedule heavy work away from peak traffic
- produce clear summaries of processed/skipped/failed records

## Review guidance

Codex should ask:

- Can this job be safely rerun?
- What happens after partial failure?
- Does it process data in bounded chunks?
- Does it report progress?
- Can it resume?
- Does it overload the database?
- Does it preserve source data?

## Testing / verification guidance

Codex should recommend:

- small batch tests
- large batch tests
- partial failure tests
- rerun/idempotency tests
- malformed input tests
- resume-from-checkpoint tests
- dry-run verification tests

## Tradeoffs and cautions

Not every operation needs a full batch framework. Small admin scripts can be simple, but any job touching important production data should be restartable, observable, and safe.

## Example transformation

**Before:**

```csharp
var allStudents = db.Students.ToList();
foreach (var student in allStudents)
{
    GenerateInvoice(student);
}
```

**After:**

```text
Read students in pages.
Track last processed ID.
Generate invoices idempotently with unique invoice keys.
Log successes/failures.
Allow rerun without duplicate invoices.
```

## Distilled skill rule

Treat batch jobs as restartable production workflows: chunk work, track progress, handle partial failure, and make reruns safe.

---

# 11. Stream Processing and Event-Driven Systems

## Core teaching

Streams represent ongoing change. Event-driven systems allow decoupling and derived views, but introduce ordering, duplication, replay, schema evolution, and consistency challenges.

## Codex trigger

Apply this when Codex is:

- publishing domain events
- consuming queue messages
- updating read models
- building notification systems
- syncing services
- using Kafka/RabbitMQ/SQS/etc.
- implementing audit logs
- reacting to database changes

## Signals and smells

Codex should notice:

- event handlers that are not idempotent
- no event schema/versioning
- assuming exactly-once delivery
- no dead-letter queue
- no replay strategy
- consumer side effects without deduplication
- events named after technical actions instead of domain facts
- unclear event ownership
- no ordering strategy
- mixing command intent with event fact

## Desired Codex behavior

Codex should design event flows around at-least-once delivery, replay, idempotency, and schema evolution.

## Implementation guidance

Codex should:

- make consumers idempotent
- store processed message IDs where needed
- use domain-event names that describe facts
- include event versioning or compatible schema evolution
- separate command handling from event publishing
- handle dead-letter cases
- expose consumer lag/failure metrics
- support replay where derived data can be rebuilt
- avoid relying on global ordering unless guaranteed

## Review guidance

Codex should ask:

- Can this event be processed twice?
- Can this event arrive late?
- Can this event arrive out of order?
- What happens if the handler fails halfway?
- Can the consumer be replayed?
- Is the event schema compatible with future changes?
- Is this event a domain fact or a disguised command?

## Testing / verification guidance

Codex should recommend:

- duplicate event tests
- out-of-order event tests
- replay tests
- schema compatibility tests
- dead-letter tests
- partial failure tests
- consumer lag monitoring tests/checks

## Tradeoffs and cautions

Event-driven systems can reduce coupling but increase reasoning complexity. Do not introduce events just to avoid direct method calls inside a simple monolith. Use events when decoupling, auditability, async processing, or derived views justify them.

## Example transformation

**Before:**

```text
On StudentCreated event, send welcome email and create billing record.
Handler assumes event is processed exactly once.
```

**After:**

```text
StudentCreated is a durable domain event.
Billing handler creates billing record idempotently using student ID.
Email handler records sent email ID to avoid duplicates.
Failures go to retry/dead-letter path.
```

## Distilled skill rule

Assume events may be duplicated, delayed, replayed, or reordered; make consumers idempotent and observable.

---

# 12. Derived Data, Caches, Indexes, and Materialized Views

## Core teaching

Many systems maintain derived data: caches, search indexes, reports, read models, analytics tables, projections, and materialized views. Derived data improves performance but creates freshness and correctness questions.

## Codex trigger

Apply this when Codex is:

- adding a cache
- creating a search index
- building dashboard summaries
- maintaining read models
- adding denormalized fields
- creating reporting tables
- syncing data between systems

## Signals and smells

Codex should notice:

- no source of truth identified
- cache invalidation missing
- denormalized fields updated manually in many places
- search index assumed always current
- dashboard counts computed inconsistently
- no rebuild strategy for derived data
- no reconciliation job
- hidden dependency on stale data being fresh
- cache used to hide slow queries without fixing access patterns

## Desired Codex behavior

Codex should clearly separate source-of-truth data from derived data and define how derived data is updated, invalidated, rebuilt, and verified.

## Implementation guidance

Codex should:

- identify source of truth
- treat caches/indexes/read models as rebuildable where possible
- add invalidation or update paths
- expose staleness where relevant
- make derived updates idempotent
- support backfill/rebuild workflows
- add reconciliation checks for important derived data
- avoid storing duplicate data without an update strategy

## Review guidance

Codex should ask:

- What is the source of truth?
- How is this derived data updated?
- Can it become stale?
- Is stale data acceptable here?
- Can this index/cache/view be rebuilt?
- What happens if update fails?
- Are duplicate fields synchronized safely?

## Testing / verification guidance

Codex should recommend:

- cache invalidation tests
- stale-read tests
- rebuild tests
- source-versus-derived consistency tests
- failed-update tests
- backfill tests

## Tradeoffs and cautions

Derived data is often necessary for performance, but it increases complexity. Codex should not add caches or denormalized projections without explaining freshness, invalidation, and rebuild behavior.

## Example transformation

**Before:**

```text
Store family.balance on Family record and update it manually from several payment paths.
```

**After:**

```text
Define payments/invoices as source of truth.
Either calculate balance from ledger entries or maintain a derived balance with transactional updates, reconciliation, and rebuild support.
```

## Distilled skill rule

When adding derived data, define the source of truth, freshness expectations, update path, and rebuild strategy.

---

# 13. Choosing Technologies Through Tradeoffs

## Core teaching

No database, queue, cache, or processing system is universally best. Every tool embodies tradeoffs around consistency, latency, throughput, operations, query model, durability, ecosystem, and team skill.

## Codex trigger

Apply this when Codex is:

- recommending a database
- adding Redis, Elasticsearch, Kafka, RabbitMQ, MongoDB, PostgreSQL, etc.
- proposing microservices
- introducing distributed infrastructure
- replacing a simple implementation with a specialized tool
- designing architecture for future scale

## Signals and smells

Codex should notice:

- tool chosen because it is popular
- “NoSQL scales better” without workload detail
- “Kafka solves this” without operational need
- cache introduced before measuring bottleneck
- search engine used as source of truth
- queue used to hide unclear transaction boundaries
- technology added without team/ops capacity

## Desired Codex behavior

Codex should explain tradeoffs before recommending tools. It should prefer boring, understood technology unless the problem clearly requires specialization.

## Implementation guidance

Codex should:

- start from workload and correctness requirements
- list constraints before tool choice
- prefer existing stack when sufficient
- add specialized infrastructure only with a clear job
- avoid using cache/search/queue as primary source of truth unless intentionally designed
- document operational requirements of new technology

## Review guidance

Codex should ask:

- What problem does this tool solve?
- What new failure modes does it introduce?
- Who will operate it?
- Can the current database solve this with simpler design?
- What consistency guarantees are needed?
- What happens during outage or data loss?
- How do we migrate away if needed?

## Testing / verification guidance

Codex should recommend:

- integration tests around tool boundaries
- failure-mode tests for unavailable infrastructure
- data consistency tests
- migration tests
- backup/restore verification for stateful systems
- local development setup checks

## Tradeoffs and cautions

Avoid “architecture shopping.” A specialized system may solve one bottleneck while creating operational burden. Codex should not recommend new infrastructure without stating what complexity it adds.

## Example transformation

**Before:**

```text
Use Kafka for all events because it scales.
```

**After:**

```text
If the system only needs simple background jobs, use the existing database-backed job queue first. Consider Kafka only if durable high-throughput event streams, replay, multiple independent consumers, and operational support are required.
```

## Distilled skill rule

Choose data infrastructure by workload, guarantees, and operational cost; do not add specialized tools because they are fashionable.

---

# 14. Senior Engineering Judgment from DDIA

## Core teaching

The deeper lesson of the book is not “use this database” or “use this architecture.” It is to reason clearly about tradeoffs in data systems.

Codex should act less like a code generator and more like a careful engineer: identify assumptions, name tradeoffs, protect invariants, and avoid magical thinking.

## Codex trigger

Apply this broadly when Codex is:

- making architecture decisions
- changing persistence logic
- integrating services
- optimizing performance
- adding distributed behavior
- designing workflows involving important business data

## Signals and smells

Codex should notice:

- unstated assumptions
- vague scalability claims
- no failure model
- no source of truth
- no consistency model
- no migration story
- no testing strategy
- no operational ownership
- complexity introduced without a concrete reason

## Desired Codex behavior

Codex should:

- state assumptions
- identify tradeoffs
- choose the simplest design that satisfies known requirements
- protect correctness before optimizing performance
- make data ownership explicit
- design for evolution
- add testing around invariants and failure modes

## Implementation guidance

Codex should:

- favor clarity over cleverness
- keep data contracts explicit
- write idempotent distributed handlers
- avoid unbounded reads
- preserve compatibility
- use database constraints for critical rules
- keep derived data rebuildable
- make operational risk visible

## Review guidance

Codex should ask:

- What must never go wrong?
- What can be eventually consistent?
- What is the source of truth?
- What grows over time?
- What happens if this runs twice?
- What happens if this partially fails?
- What assumption would break this design?

## Testing / verification guidance

Codex should recommend:

- invariant tests
- concurrency tests
- compatibility tests
- migration tests
- large-data tests
- failure-mode tests
- replay/rerun tests for async or batch workflows

## Tradeoffs and cautions

Senior judgment means not applying every pattern everywhere. Sometimes the correct decision is a simple table, one transaction, and a boring API. Codex should avoid turning every feature into a distributed-systems exercise.

## Example transformation

**Before:**

```text
Build a distributed event-driven architecture for student registration, billing, notifications, and reporting.
```

**After:**

```text
Keep registration and billing in one transactional system while the domain is still tightly coupled. Emit events only for non-critical side effects like notifications and reporting projections. Make events idempotent and rebuildable.
```

## Distilled skill rule

Prefer simple, explicit data designs; add distributed complexity only when the workload, consistency needs, or team boundaries justify it.

---

# Compression Candidates for Future SKILL.md

These are not the final skill yet, but they are likely strong rules to keep:

```text
Evaluate data-intensive changes through reliability, scalability, and maintainability.
```

```text
Model data from relationships, access patterns, invariants, and evolution needs.
```

```text
Bound result sets and avoid N+1 queries by default.
```

```text
Treat APIs, messages, and persisted data as long-lived contracts.
```

```text
Make consistency expectations explicit, especially around replicas, caches, events, and async workflows.
```

```text
Protect business invariants with transactions, constraints, idempotency, and concurrency-aware tests.
```

```text
Assume distributed operations can timeout, duplicate, reorder, partially fail, or complete without acknowledgement.
```

```text
Make batch jobs restartable, chunked, observable, and safe to rerun.
```

```text
Make event consumers idempotent, replay-aware, schema-compatible, and observable.
```

```text
For derived data, define the source of truth, freshness expectation, update path, and rebuild strategy.
```

```text
Choose infrastructure through workload and tradeoffs, not popularity.
```

```text
Do not introduce distributed complexity when a simple local transaction or relational model is sufficient.
```
