# Release It! Second Edition — Codex Skill Source Extraction

Source: *Release It! Second Edition: Design and Deploy Production-Ready Software* by Michael T. Nygard

Purpose: Raw Codex-skill training material. This is not a finished skill. It is source extraction meant to later be compressed into a `SKILL.md`.

Primary domains:

- production readiness
- architecture
- resilience
- deployment safety
- operability
- security
- testing
- senior engineering judgment

---

# 1. Production Is the Real Target

## Core teaching

Software is not done when it passes tests or launches. It is production-ready only when it can survive real users, real traffic, real dependencies, real deploys, and real failure.

Engineering judgment:

> Do not optimize only for correctness in ideal conditions. Design for operation under stress.

## Codex trigger

Apply this when Codex is building production-facing features, adding endpoints, integrating services, writing background jobs, creating deployment scripts, modifying critical workflows, reviewing architecture, or preparing code for release.

## Signals and smells

- Feature works only on happy path
- No handling for dependency failure
- No logs or metrics
- No timeout strategy
- No rollback or deployment consideration
- No large-data consideration
- No operational visibility
- “Works locally” treated as enough
- No plan for production configuration

## Desired Codex behavior

Shift from “make it work” to “make it survive, fail safely, recover, and be diagnosable.”

Codex should identify what happens when traffic spikes, dependencies fail, users retry, data grows, deploys happen during usage, partial failures occur, or configuration is wrong.

## Implementation guidance

- Add explicit failure handling
- Avoid infinite waits
- Avoid unbounded operations
- Make errors visible
- Preserve core workflows when non-critical dependencies fail
- Keep production configuration externalized
- Design for graceful degradation
- Add operational hooks where appropriate

## Review guidance

Ask:

- What happens when this runs in production?
- What happens if this dependency is slow?
- What happens if this data grows 100x?
- What happens if the user retries?
- What happens during deploy?
- Can an operator understand what went wrong?
- Can this fail without taking unrelated workflows down?

## Testing / verification guidance

Recommend failure-path tests, timeout tests, large-data tests, duplicate request tests, dependency-unavailable tests, deployment smoke tests, and health-check verification.

## Tradeoffs and cautions

Do not add heavy resilience machinery to tiny scripts, prototypes, or throwaway code. But any user-facing, revenue-impacting, data-critical, or operationally important system should be designed for production from the start.

## Example transformation

Before:

> Add student registration form and save to database.

After:

> Add student registration form with validation, bounded database operations, duplicate-submit protection, clear error handling, structured logging, and a path for non-critical integrations to fail without losing the registration.

## Distilled skill rule

When building production-facing code, design for real operating conditions, not just the happy path.

---

# 2. Contain Failure Before It Spreads

## Core teaching

Production failures become outages when small faults spread through the system. A dependency failure, bad query, full queue, or blocked thread should remain local instead of becoming a system-wide collapse.

## Codex trigger

Apply this when Codex sees external API calls, database calls, queues, caches, file systems, background jobs, shared resource pools, service-to-service calls, or request workflows with multiple steps.

## Signals and smells

- One failing subsystem can block the whole request path
- Multiple features share the same fragile resource pool
- No fallback behavior
- No isolation between critical and non-critical work
- Errors bubble up unpredictably
- Background jobs compete with user traffic
- Long synchronous workflows with many dependencies

## Desired Codex behavior

Identify possible failure propagation paths and introduce containment boundaries.

## Implementation guidance

- Isolate risky dependencies
- Separate critical from non-critical workflows
- Avoid shared pools for unrelated high-risk work
- Fail fast when necessary
- Degrade gracefully when possible
- Use queues for non-critical async work
- Prevent background work from starving user requests
- Ensure failures are logged with context

## Review guidance

Ask:

- If this dependency fails, what else stops working?
- Does this failure consume shared threads, connections, or memory?
- Can this workflow continue partially?
- Can the user retry safely?
- Is the failure visible?
- Is there a recovery path?

## Testing / verification guidance

Recommend tests where one dependency fails, where one dependency is slow, fallback tests, partial-completion tests, safe-retry tests, and resource-exhaustion tests.

## Tradeoffs and cautions

Isolation adds complexity. Do not split every tiny operation into separate systems. Isolate based on business criticality, failure risk, and resource impact.

## Example transformation

Before:

> User submits form → save data → call external system → send email → generate PDF → return success.

After:

> User submits form → save core data transactionally → enqueue external sync/email/PDF jobs → return success with background status.

## Distilled skill rule

Prevent small faults from becoming system-wide failures by isolating risky dependencies and non-critical work.

---

# 3. Integration Points Are Dangerous

## Core teaching

Every integration point is a potential production failure point. External systems do not fail cleanly. They can hang, slow down, reject requests, return malformed responses, change behavior, or partially complete work.

## Codex trigger

Apply this when Codex adds or reviews HTTP calls, database calls, third-party APIs, payment providers, email/SMS/WhatsApp integrations, file storage, queues, authentication providers, government/enterprise systems, or AI API calls.

## Signals and smells

- External call without timeout
- External call directly inside critical transaction
- No retry policy
- Retry policy without idempotency
- No fallback behavior
- No structured logging around dependency failure
- Dependency errors treated as generic exceptions
- Synchronous dependency call blocking user workflow
- No monitoring by dependency

## Desired Codex behavior

Treat every integration as unreliable by default.

## Implementation guidance

- Add timeouts
- Pass cancellation tokens where supported
- Classify dependency errors
- Avoid external calls inside database transactions
- Use idempotency keys for retryable operations
- Add bounded retries only when safe
- Use exponential backoff and jitter where appropriate
- Log dependency name, operation, latency, and failure type
- Consider circuit breakers for fragile dependencies
- Provide fallback or degraded behavior when possible

## Review guidance

Ask:

- Can this call hang?
- What is the timeout?
- Is the operation idempotent?
- What happens if the dependency succeeds but the response is lost?
- What happens if the dependency returns malformed data?
- Is failure visible in logs/metrics?
- Does this dependency block a critical workflow?

## Testing / verification guidance

Recommend timeout tests, dependency-unavailable tests, malformed-response tests, slow-response tests, retry-exhaustion tests, duplicate-request tests, and partial-success tests.

## Tradeoffs and cautions

Not every dependency needs a full circuit breaker or queue. But every integration needs explicit failure handling and time bounds. Avoid blind retries on non-idempotent operations.

## Example transformation

Before:

```csharp
var result = await httpClient.PostAsync(url, content);
```

After:

```csharp
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
var result = await httpClient.PostAsync(url, content, cts.Token);

// Handle timeout, non-success status, retryable errors, and permanent errors separately.
// Log dependency name, operation, latency, and correlation ID.
```

## Distilled skill rule

Never treat an external dependency call like a local function call; bound it, observe it, and design for failure.

---

# 4. Avoid Cascading Failures

## Core teaching

A cascading failure occurs when one failing layer causes callers or neighboring systems to fail. This often happens through exhausted resource pools, blocked threads, unlimited retries, or insufficient isolation.

## Codex trigger

Apply this when Codex sees service-to-service calls, shared thread pools, shared connection pools, synchronous chains of dependencies, fallback paths that call other dependencies, retry logic, or database access under load.

## Signals and smells

- One request path calls many services synchronously
- No timeout between layers
- Shared pool used by critical and non-critical calls
- Retries increase load on a failing dependency
- Caller waits indefinitely for lower layer
- Failure in one service causes unrelated endpoints to slow down
- Resource pool exhaustion not handled

## Desired Codex behavior

Identify whether a failure can jump from one layer to another and recommend containment.

## Implementation guidance

- Use timeouts at every boundary
- Use circuit breakers for unstable dependencies
- Separate resource pools by dependency or workload when justified
- Cap concurrency
- Reject work when capacity is exhausted
- Prevent retry storms
- Return controlled degraded responses
- Ensure health checks do not route traffic to unhealthy instances

## Review guidance

Ask:

- Can one failing dependency exhaust a shared pool?
- Can slow responses block all request workers?
- Do retries multiply load?
- Are critical and non-critical calls isolated?
- Can this service remain useful if a downstream dependency fails?

## Testing / verification guidance

Recommend downstream-outage tests, downstream-latency tests, resource-pool exhaustion tests, retry-storm tests, partial-availability tests, and load tests with one dependency degraded.

## Tradeoffs and cautions

Circuit breakers and bulkheads add moving parts. Apply them where a dependency is remote, unreliable, high latency, critical, or known to fail under pressure.

## Example transformation

Before:

> All endpoints use one shared database connection pool and one shared HTTP client policy.

After:

> Critical checkout/registration flows have bounded dependency calls and separate limits from reporting, exports, and background sync work.

## Distilled skill rule

Design service boundaries so a downstream failure cannot exhaust upstream resources or disable unrelated workflows.

---

# 5. Avoid Blocked Threads and Infinite Waits

## Core teaching

A system can appear dead even when the process is still running if all request threads are blocked waiting for slow dependencies, locks, I/O, or resource pools.

## Codex trigger

Apply this when Codex sees synchronous I/O, database calls, HTTP calls, locks, thread sleeps, long-running request handlers, resource-pool acquisition, or background jobs sharing request resources.

## Signals and smells

- `.Result` or `.Wait()` in async-capable code
- No cancellation token
- No timeout
- Long lock scope
- External calls inside locks
- External calls inside database transactions
- Request handler performs slow batch work
- Unbounded queue consumers
- Thread-pool starvation risk

## Desired Codex behavior

Prevent operations from waiting forever and avoid tying up request workers unnecessarily.

## Implementation guidance

- Use async I/O where appropriate
- Pass cancellation tokens
- Set explicit timeouts
- Keep locks small
- Avoid blocking on async code
- Move slow non-critical work to background jobs
- Cap concurrency
- Avoid external calls inside locks or transactions
- Expose timeout and saturation metrics

## Review guidance

Ask:

- Can this wait forever?
- Does this block a request thread?
- Is there cancellation support?
- Is this lock scope minimal?
- Can this be moved out of the request path?
- What happens when many users hit this path at once?

## Testing / verification guidance

Recommend slow-dependency tests, cancellation tests, timeout tests, concurrent-request tests, thread-pool starvation checks where relevant, and lock-contention tests for critical paths.

## Tradeoffs and cautions

Async does not automatically make code safe. Do not add async mechanically if the underlying operation is CPU-bound or if it makes simple code harder without benefit.

## Example transformation

Before:

```csharp
var response = externalClient.SendAsync(request).Result;
```

After:

```csharp
using var cts = CancellationTokenSource.CreateLinkedTokenSource(requestAborted);
cts.CancelAfter(TimeSpan.FromSeconds(5));

var response = await externalClient.SendAsync(request, cts.Token);
```

## Distilled skill rule

Do not allow request threads, locks, or resource pools to wait indefinitely on slow or unreliable work.

---

# 6. Control Retries Before They Become Self-Denial Attacks

## Core teaching

Retries can turn a small outage into a larger one. When many clients retry aggressively, they amplify load on an already struggling system.

## Codex trigger

Apply this when Codex sees retry loops, queue retry policies, HTTP client policies, scheduled polling, failed background jobs, user-triggered resubmission, cache rebuilds, or batch imports.

## Signals and smells

- Immediate retry loops
- Infinite retries
- Retrying non-idempotent operations
- No jitter
- No max attempt count
- No dead-letter handling
- Many workers retrying at the same time
- User action can be submitted repeatedly
- Retry on every exception without classification

## Desired Codex behavior

Make retries safe, bounded, delayed, observable, and idempotent.

## Implementation guidance

- Retry only retryable failures
- Use exponential backoff
- Add jitter
- Cap retry attempts
- Use idempotency keys
- Avoid retrying non-idempotent side effects blindly
- Send exhausted work to a dead-letter or manual review path
- Log retry count and final failure
- Avoid synchronized retries from many workers

## Review guidance

Ask:

- Is this operation safe to retry?
- What is the maximum retry count?
- Is there backoff?
- Is there jitter?
- What happens after final failure?
- Can retries overload the dependency?
- Are retry attempts observable?

## Testing / verification guidance

Recommend retryable-failure tests, non-retryable-failure tests, retry-exhaustion tests, duplicate-side-effect tests, idempotency tests, and dead-letter tests.

## Tradeoffs and cautions

Retries are useful for transient failures but dangerous for permanent failures, overloaded systems, and non-idempotent operations. Do not add retries just to hide errors.

## Example transformation

Before:

```csharp
while (true)
{
    await SendInvoiceAsync(invoice);
}
```

After:

> Retry only known transient failures. Use max attempts. Use exponential backoff with jitter. Use invoice ID as idempotency key. Move exhausted failures to review/dead-letter state.

## Distilled skill rule

Retries must be bounded, delayed, jittered, observable, and safe to repeat.

---

# 7. Prevent Dogpiles and Cache Stampedes

## Core teaching

A dogpile happens when many requests or workers stampede into the same expensive operation, often after a cache expires or after servers restart.

## Codex trigger

Apply this when Codex sees caches, lazy loading, expensive computed values, startup warmups, cache expiration, popular resource fetching, search-index rebuilds, or scheduled jobs across many instances.

## Signals and smells

- All cache keys expire at the same time
- Cache miss triggers expensive DB/API call
- No lock/single-flight protection
- All instances warm cache simultaneously
- Scheduled jobs start at exact same time
- No stale-while-revalidate strategy
- Expensive computation triggered by user request

## Desired Codex behavior

Prevent many callers from rebuilding the same resource at once.

## Implementation guidance

- Add randomized TTL jitter
- Use single-flight/request coalescing
- Serve stale data briefly while refreshing where acceptable
- Warm caches gradually
- Limit concurrent rebuilds
- Move expensive rebuilds to background jobs
- Stagger scheduled jobs
- Cap cache-miss pressure on the source system

## Review guidance

Ask:

- What happens when this cache expires?
- Can many users trigger the same rebuild?
- Can all instances do the same work at startup?
- Is stale data acceptable temporarily?
- Is the source system protected from cache misses?

## Testing / verification guidance

Recommend concurrent-cache-miss tests, cache-expiry load tests, startup-warmup tests, stale-fallback tests, and source-system protection tests.

## Tradeoffs and cautions

Do not add complex cache coordination unless the data is hot or expensive. For low-traffic paths, simple caching may be enough.

## Example transformation

Before:

> If cache miss, every request queries database and rebuilds same expensive object.

After:

> On cache miss, one worker rebuilds while others wait briefly or receive stale data. TTLs include jitter to avoid synchronized expiry.

## Distilled skill rule

Protect expensive shared resources from synchronized cache misses, startup bursts, and repeated rebuilds.

---

# 8. Bound Result Sets and Work Sizes

## Core teaching

Unbounded result sets are a production hazard. They consume memory, slow the database, increase latency, and can crash processes as data grows.

## Codex trigger

Apply this when Codex sees list endpoints, search endpoints, exports, reports, admin screens, repository methods returning collections, ORM `.ToList()` calls, batch jobs, or database queries without limits.

## Signals and smells

- `SELECT *` without limit/filter
- `.ToList()` before filtering
- API returns all records
- No pagination
- No maximum page size
- No streaming for exports
- No stable ordering
- Loading entire file/table into memory
- Report generation inside request path

## Desired Codex behavior

Make all collection access bounded by default.

## Implementation guidance

- Add pagination
- Enforce maximum page size
- Require stable ordering for pagination
- Push filtering/sorting to database
- Stream large exports
- Process batch jobs in chunks
- Avoid materializing huge result sets
- Add indexes for common filtered/sorted queries where justified

## Review guidance

Ask:

- Can this return unlimited rows?
- What is the maximum result size?
- Is pagination stable?
- Does this load all data into memory?
- Does this query still work at 100x data?
- Is export/report work separated from normal requests?

## Testing / verification guidance

Recommend large-dataset tests, pagination tests, max-page-size tests, export-streaming tests, query-performance tests, and memory-usage checks for large operations.

## Tradeoffs and cautions

Some admin or migration scripts may intentionally process all records, but they should do so in chunks and with clear operational limits.

## Example transformation

Before:

```csharp
var families = await db.Families.ToListAsync();
```

After:

```csharp
var families = await db.Families
    .OrderBy(f => f.Id)
    .Skip(page * pageSize)
    .Take(Math.Min(pageSize, MaxPageSize))
    .ToListAsync();
```

## Distilled skill rule

Never return or process unbounded data in production paths; paginate, stream, chunk, or cap the work.

---

# 9. Use Timeouts Everywhere Work Crosses a Boundary

## Core teaching

Timeouts prevent indefinite waiting and reduce the chance that slow dependencies consume all resources.

## Codex trigger

Apply this when Codex sees HTTP calls, database commands, queue operations, file-storage calls, cache calls, locks, background-job operations, resource-pool acquisition, or external-service calls.

## Signals and smells

- No timeout value
- Default timeout unknown
- Timeout longer than user can tolerate
- Same timeout for every dependency
- Timeout catches not distinguished from other errors
- No cancellation token
- Operation waits on resource pool forever

## Desired Codex behavior

Make timeouts explicit and appropriate to the workflow.

## Implementation guidance

- Set timeouts per dependency and operation
- Propagate request cancellation
- Distinguish timeout from permanent errors
- Log timeout separately
- Align timeout with user experience and upstream limits
- Avoid timeout values hidden in magic constants
- Document unusually long timeouts

## Review guidance

Ask:

- What is the timeout?
- Why is that value appropriate?
- What happens after timeout?
- Is timeout treated as unknown outcome?
- Does caller retry safely?
- Is the timeout visible in metrics?

## Testing / verification guidance

Recommend slow-dependency tests, timeout-handling tests, cancellation-propagation tests, retry-after-timeout tests, and user-facing timeout-response tests.

## Tradeoffs and cautions

Timeouts that are too short create false failures. Timeouts that are too long allow resource exhaustion. Do not pick arbitrary values without considering the workflow.

## Example transformation

Before:

> Call external sync service and wait for response before returning.

After:

> Call external sync service with a 3-second timeout. If it times out, save local state, mark sync pending, enqueue retry, and return a clear status.

## Distilled skill rule

Every boundary-crossing operation needs an explicit timeout and a defined post-timeout behavior.

---

# 10. Use Circuit Breakers for Failing Dependencies

## Core teaching

A circuit breaker stops repeated calls to a dependency that is already failing, allowing the caller to fail fast and the dependency to recover.

## Codex trigger

Apply this when Codex sees remote service calls, unstable third-party APIs, high-volume dependency calls, dependency failures causing blocked resources, repeated timeout patterns, or user flows dependent on fragile systems.

## Signals and smells

- Repeated calls to failing dependency
- Many timeouts under load
- No fail-fast behavior
- Every request tests a known-broken dependency
- Retries hammering a failing service
- No degraded response path
- Dependency failure harms unrelated features

## Desired Codex behavior

Recommend circuit breakers when repeated dependency failure can consume resources or amplify outages.

## Implementation guidance

- Define failure thresholds
- Define open/half-open/closed behavior if using circuit breaker
- Return fast degraded responses when circuit is open
- Log circuit state changes
- Expose circuit metrics
- Combine with timeouts and bounded retries
- Avoid circuit breakers around local deterministic code

## Review guidance

Ask:

- Does this dependency fail often or slowly?
- What happens after repeated failures?
- Does the system keep hammering it?
- Is there a fallback?
- Are circuit state changes observable?
- Can operators tell when a circuit is open?

## Testing / verification guidance

Recommend repeated-failure tests, circuit-open tests, half-open-recovery tests, fallback tests, and metrics/logging tests.

## Tradeoffs and cautions

Circuit breakers add complexity and can mask recovery if misconfigured. Do not apply them to every call automatically; they are most useful for remote, fragile, or high-impact dependencies.

## Example transformation

Before:

> Every request calls recommendation service. If it is down, every request waits and fails slowly.

After:

> After repeated failures, circuit opens. Requests skip recommendations temporarily and return the core page without them.

## Distilled skill rule

For fragile remote dependencies, stop repeated slow failures with circuit breakers and degraded behavior.

---

# 11. Use Bulkheads to Isolate Resources

## Core teaching

Bulkheads isolate resources so one failing area does not sink the whole system.

## Codex trigger

Apply this when Codex sees shared thread pools, shared connection pools, mixed critical and non-critical workloads, multiple dependencies using the same limited resource, background jobs and user traffic competing, or expensive reporting in a production system.

## Signals and smells

- Reports can exhaust database connections needed by core workflows
- Slow dependency consumes all workers
- One queue handles all job types
- Low-priority jobs block high-priority jobs
- One tenant can dominate shared resources
- Background imports run without limits

## Desired Codex behavior

Isolate critical resources from risky or lower-priority work.

## Implementation guidance

- Use separate queues for different priorities where needed
- Cap concurrency per dependency
- Separate connection pools when justified
- Separate background workers from request handling
- Apply per-tenant or per-user limits
- Keep core workflows protected from reporting/export/bulk work

## Review guidance

Ask:

- What resources are shared?
- Can non-critical work starve critical work?
- Can one dependency consume the whole pool?
- Are workloads prioritized?
- Are concurrency limits per workload/dependency?

## Testing / verification guidance

Recommend load tests with background work running, dependency-specific saturation tests, priority-queue tests, concurrency-limit tests, and one-tenant-abuse tests.

## Tradeoffs and cautions

Too many resource pools can reduce efficiency and increase configuration burden. Isolate where failure or saturation risk is meaningful.

## Example transformation

Before:

> PDF generation, reporting, registration, and payment processing all share the same worker pool.

After:

> Registration and payment use protected capacity. PDF/reporting jobs run in separate lower-priority workers with concurrency limits.

## Distilled skill rule

Separate critical and risky workloads so one saturated pool cannot disable the whole system.

---

# 12. Fail Fast When Work Cannot Succeed

## Core teaching

When the system already knows it cannot process work, it should reject quickly instead of accepting requests that will consume resources and fail later.

## Codex trigger

Apply this when Codex sees full queues, invalid configuration, unavailable required dependency, overloaded services, request validation, missing required resources, or startup checks.

## Signals and smells

- Accepting work into full system
- Slow failure after long waiting
- Missing config discovered during first user request
- Invalid input travels deep into system
- No queue capacity limit
- Dependency unavailable but requests still pile up
- Startup succeeds with broken critical config

## Desired Codex behavior

Reject impossible work early and clearly.

## Implementation guidance

- Validate inputs at boundaries
- Fail startup on missing critical config
- Reject or defer work when capacity is exhausted
- Return clear error states
- Avoid accepting jobs that cannot be processed
- Expose readiness accurately
- Separate retryable failure from invalid request

## Review guidance

Ask:

- Can this request succeed?
- If not, how quickly do we know?
- Are we consuming resources before validation?
- Does startup verify critical dependencies/config?
- Does the queue have a maximum?
- Is failure visible and understandable?

## Testing / verification guidance

Recommend invalid-input tests, missing-config startup tests, full-queue tests, unavailable-dependency readiness tests, and overloaded-service tests.

## Tradeoffs and cautions

Fail-fast behavior must not reject too aggressively during transient conditions if graceful degradation is possible. Distinguish critical from optional dependencies.

## Example transformation

Before:

> Accept upload request, process for 60 seconds, then fail because file type is invalid.

After:

> Validate file type and size at request boundary; reject immediately if unsupported.

## Distilled skill rule

Reject impossible work early; do not let invalid or unprocessable requests consume production capacity.

---

# 13. Apply Load Shedding and Back Pressure

## Core teaching

When demand exceeds capacity, the system should protect itself by refusing or slowing some work instead of collapsing completely.

## Codex trigger

Apply this when Codex sees queues, high-volume APIs, background workers, streaming systems, imports, expensive reports, batch jobs, third-party API quotas, or user-generated bursts.

## Signals and smells

- Unbounded queue growth
- No rate limit
- Accepting work faster than it can be processed
- Workers crash under backlog
- Low-priority work treated same as critical work
- No 429/overload response
- No producer throttling
- No max concurrency

## Desired Codex behavior

Ensure systems can say “not now” or “slow down.”

## Implementation guidance

- Bound queues
- Add rate limits
- Return 429 or controlled overload responses when appropriate
- Prioritize critical work
- Slow producers when consumers lag
- Cap concurrent jobs
- Disable/degrade non-essential features under load
- Expose queue depth and saturation metrics

## Review guidance

Ask:

- What happens when input exceeds processing capacity?
- Can the queue grow forever?
- Is there a rate limit?
- Can upstream producers slow down?
- Is low-priority work shed first?
- What metric shows saturation?

## Testing / verification guidance

Recommend overload tests, queue-full tests, rate-limit tests, back-pressure tests, priority-behavior tests, and recovery-after-overload tests.

## Tradeoffs and cautions

Load shedding may reject real users, so product behavior matters. Preserve critical work and reject/defer less important work first.

## Example transformation

Before:

> Every import request is accepted and queued with no limit.

After:

> Queue has capacity limit. If full, return controlled response asking user to retry later. Admin sees backlog and failed import status.

## Distilled skill rule

When capacity is limited, slow or reject lower-priority work before the whole system collapses.

---

# 14. Design for Steady State

## Core teaching

A production system should be able to run continuously without accumulating garbage, stuck jobs, memory leaks, old files, dead sessions, or unbounded logs.

## Codex trigger

Apply this when Codex sees temp files, logs, sessions, background jobs, queues, caches, uploads, local disk usage, scheduled tasks, or retry records.

## Signals and smells

- Temp files never cleaned
- Retry records accumulate forever
- Logs grow without rotation
- Sessions stored indefinitely
- Failed jobs never archived or retried
- Uploaded files orphaned
- Cache grows without bounds
- Queue has no dead-letter or cleanup policy

## Desired Codex behavior

Design cleanup, expiration, and bounded storage from the start.

## Implementation guidance

- Add TTL/expiration where appropriate
- Implement cleanup jobs
- Rotate or externalize logs
- Archive or purge old records safely
- Bound cache size
- Handle orphaned uploaded files
- Expose queue/job aging metrics
- Make cleanup idempotent

## Review guidance

Ask:

- What accumulates over time?
- How is it cleaned?
- Can cleanup safely rerun?
- Is storage bounded?
- What happens after months of operation?
- Are failed jobs visible and eventually resolved?

## Testing / verification guidance

Recommend cleanup-job tests, idempotent-cleanup tests, old-record expiration tests, storage-growth tests, and failed-job lifecycle tests.

## Tradeoffs and cautions

Retention may be legally or operationally important. Do not delete data blindly; cleanup policies must respect audit, compliance, and recovery needs.

## Example transformation

Before:

> Generated PDFs are stored forever in local temp folder.

After:

> Generated PDFs are stored in managed storage with retention policy, cleanup job, and metadata linking them to source records.

## Distilled skill rule

Every production artifact that accumulates must have an owner, limit, retention policy, or cleanup path.

---

# 15. Make Systems Observable and Operable

## Core teaching

Production systems need transparency. Operators and developers must be able to tell what the system is doing, whether it is healthy, and why it failed.

## Codex trigger

Apply this when Codex adds new services, background jobs, external integrations, deployment processes, health checks, admin workflows, queues, scheduled jobs, or critical business features.

## Signals and smells

- No logs around critical operation
- Logs lack correlation IDs
- Generic error messages
- No metrics for dependency latency/errors
- No health/readiness check
- No admin view into failed jobs
- Failure only visible through user complaints
- No version/build info
- No way to disable failing optional integration

## Desired Codex behavior

Add operational visibility around important behavior.

## Implementation guidance

- Add structured logs
- Include correlation/request IDs
- Log external dependency latency and failure type
- Expose meaningful health and readiness checks
- Add metrics for throughput, latency, errors, saturation
- Make background job status visible
- Include app version/build info
- Provide admin controls for retry/disable where useful

## Review guidance

Ask:

- How will we know this is failing?
- How will we debug one user’s failed request?
- What metric indicates saturation?
- What does the health check actually prove?
- Can an operator recover without changing code?
- Are errors actionable?

## Testing / verification guidance

Recommend health-check tests, logging-context tests, metrics-emission tests, failed-job visibility tests, admin-recovery flow tests, and deployment-smoke tests.

## Tradeoffs and cautions

Avoid logging sensitive data. Avoid noisy logs that hide real problems. Balance observability with privacy, cost, and signal quality.

## Example transformation

Before:

> Background sync fails silently.

After:

> Background sync records status, retry count, last error category, dependency latency, and exposes failed items for admin retry.

## Distilled skill rule

Production features must be observable: log, measure, health-check, and expose enough state to diagnose and recover.

---

# 16. Design Deployment as Part of the System

## Core teaching

Deployment is not an afterthought. A system is not production-ready if it is hard to deploy, hard to verify, hard to roll back, or requires fragile manual steps.

## Codex trigger

Apply this when Codex changes deployment scripts, CI/CD, database migrations, config, service startup, infrastructure, public APIs, data contracts, or production workflows.

## Signals and smells

- Manual deployment checklist
- No rollback plan
- Environment-specific hardcoding
- Migration must happen exactly with code deploy
- No smoke test
- No health check
- Deploy requires downtime without strong reason
- Old and new versions cannot coexist
- Secrets stored in code

## Desired Codex behavior

Design changes so they can be deployed safely, repeatedly, and reversibly.

## Implementation guidance

- Automate deploy steps
- Externalize config
- Avoid planned downtime where practical
- Include smoke tests
- Ensure health/readiness checks are meaningful
- Design database migrations in stages
- Support rollback or forward-fix strategy
- Document manual steps only when unavoidable

## Review guidance

Ask:

- How is this deployed?
- Can old and new versions run together?
- Can this be rolled back?
- Does migration break current code?
- How do we verify success?
- Are secrets/config handled safely?
- What happens if deploy stops halfway?

## Testing / verification guidance

Recommend deployment-smoke tests, migration tests, rollback tests, config-validation tests, old-version/new-version compatibility tests, and startup-failure tests.

## Tradeoffs and cautions

Small internal tools may tolerate simpler deployment. But anything user-facing or business-critical should not depend on manual heroics.

## Example transformation

Before:

> Rename database column and update code in one deploy.

After:

> Add new column, deploy code that writes both or reads both, backfill, switch reads, stop writing old field, remove old field later.

## Distilled skill rule

Treat deployment as a first-class design concern; changes should be repeatable, verifiable, and safe during partial rollout.

---

# 17. Handle Versions and Compatibility

## Core teaching

Old and new versions of code, data, APIs, messages, and clients often coexist. Production systems must tolerate version skew.

## Codex trigger

Apply this when Codex changes API contracts, DTOs, database schemas, message formats, event payloads, mobile/frontend contracts, queue consumers/producers, or serialized data.

## Signals and smells

- Removing fields immediately
- Renaming fields without transition
- Adding required fields without defaults
- Changing enum meanings
- Changing date format
- Breaking old consumers
- Assuming all services deploy simultaneously
- No migration story
- No contract tests

## Desired Codex behavior

Preserve compatibility by default and stage breaking changes.

## Implementation guidance

- Prefer additive changes
- Keep readers tolerant of unknown fields
- Provide defaults for new fields
- Support old and new field names temporarily
- Version public APIs when necessary
- Stage database migrations
- Test old/new compatibility
- Consider queued old messages

## Review guidance

Ask:

- Can old clients still work?
- Can new code read old data?
- Can old consumers process new messages?
- What happens to messages already in queues?
- Is this safe during rolling deploy?
- When can the old version be removed?

## Testing / verification guidance

Recommend backward-compatibility tests, migration tests, old-payload/new-code tests, new-payload/old-code tests where relevant, rolling-deployment tests, and queue-compatibility tests.

## Tradeoffs and cautions

Internal-only changes can sometimes be simpler. But persisted, public, or cross-service contracts should be treated as long-lived.

## Example transformation

Before:

> Replace customerName with firstName/lastName everywhere in one deploy.

After:

> Add firstName/lastName while still accepting customerName. Backfill. Update readers. Stop writing customerName. Remove later after compatibility window.

## Distilled skill rule

Assume old and new versions will coexist; evolve contracts and schemas in compatible stages.

---

# 18. Design for Security as an Ongoing Process

## Core teaching

Security is not a final checklist. It is part of production design, configuration, deployment, and operations.

## Codex trigger

Apply this when Codex touches authentication, authorization, secrets, config, user data, admin tools, file uploads, external integrations, logs, deployment scripts, or database permissions.

## Signals and smells

- Hardcoded secrets
- Default passwords
- Broad admin privileges
- Missing authorization checks
- Sensitive data in logs
- Public file access by default
- Debug mode in production
- No input validation
- Service account has excessive permissions
- Production and dev secrets mixed

## Desired Codex behavior

Apply least privilege and secure-by-default behavior.

## Implementation guidance

- Keep secrets out of code
- Use environment/secrets managers
- Validate authorization at server boundary
- Minimize permissions
- Avoid logging sensitive data
- Validate uploads
- Sanitize/validate inputs
- Use secure defaults
- Separate dev/staging/prod config
- Add audit logs for sensitive actions

## Review guidance

Ask:

- Who is allowed to do this?
- Where are secrets stored?
- Is sensitive data logged?
- Are permissions minimal?
- Is debug behavior disabled in production?
- Are files/data exposed by default?
- Is there an audit trail for sensitive changes?

## Testing / verification guidance

Recommend authorization tests, forbidden-access tests, input-validation tests, secret scanning, upload-validation tests, security-config tests, and audit-log tests.

## Tradeoffs and cautions

Do not add fake security theater. Focus on actual data sensitivity, permissions, threat model, and operational controls.

## Example transformation

Before:

> Admin endpoint checks only that user is logged in.

After:

> Admin endpoint verifies role/permission, logs sensitive action, avoids returning unnecessary private data, and has tests for unauthorized users.

## Distilled skill rule

Apply least privilege, safe secret handling, and explicit authorization to every production feature that touches sensitive data or control paths.

---

# 19. Prepare for Customer-Driven Load Spikes

## Core teaching

Your own users can take down your system. Legitimate demand can be more dangerous than an attack if the system has no capacity controls.

## Codex trigger

Apply this when Codex builds registration flows, sales/checkout flows, launch pages, import systems, public APIs, notification systems, high-traffic dashboards, or time-sensitive workflows.

## Signals and smells

- Traffic spike likely around deadline/event
- No rate limits
- No queue limits
- Expensive operation per request
- Cache cold-start risk
- All users hit same endpoint
- No graceful overload response
- No load test
- No capacity assumptions

## Desired Codex behavior

Design for peak moments, not just average traffic.

## Implementation guidance

- Identify likely burst points
- Cache carefully with stampede protection
- Rate-limit expensive operations
- Queue non-critical work
- Shed low-priority work
- Precompute or warm data where useful
- Add capacity metrics
- Test high-concurrency behavior

## Review guidance

Ask:

- When will everyone use this at once?
- What is the expensive operation per user?
- Is there a shared hotspot?
- Can non-critical work be delayed?
- What does overload look like to users?
- Do we have metrics before the launch/deadline?

## Testing / verification guidance

Recommend load tests, spike tests, cache cold-start tests, high-concurrency tests, overload-response tests, and recovery tests after spike.

## Tradeoffs and cautions

Do not build for massive scale without evidence. But known deadline-based systems should be designed for bursts even if average usage is low.

## Example transformation

Before:

> All parents upload registration documents on deadline day. Each request scans image, syncs external system, sends email, and generates PDF synchronously.

After:

> Core upload is saved quickly. Scanning, sync, email, and PDF happen asynchronously with visible status and controlled worker capacity.

## Distilled skill rule

Design deadline/launch/customer-burst workflows for peak pressure, not average usage.

---

# 20. Practice Failure Before Production Forces It

## Core teaching

Systems become more resilient when teams intentionally test failure modes in controlled ways.

## Codex trigger

Apply this when Codex works on critical workflows, distributed systems, service integrations, queues, failover logic, deployment changes, disaster recovery, or reliability testing.

## Signals and smells

- Failure behavior is assumed but untested
- No test for dependency outage
- No disaster recovery exercise
- Backup restore never tested
- Failover mechanism exists but is unverified
- Retries/circuit breakers not tested
- Operators do not know recovery steps

## Desired Codex behavior

Recommend controlled failure testing for important systems.

## Implementation guidance

- Add test doubles that simulate slow/failing dependencies
- Recommend staging failure drills
- Verify backups/restores
- Test queue retry/dead-letter behavior
- Simulate instance restarts
- Test partial outage behavior
- Document recovery playbooks

## Review guidance

Ask:

- Have we tested this dependency failing?
- Have we tested slow responses?
- Have we tested recovery?
- Can we restore from backup?
- Do operators know what to do?
- Is chaos testing safe and scoped?

## Testing / verification guidance

Recommend dependency-kill tests, latency-injection tests, restart tests, backup-restore tests, disaster-simulation checklist, failover tests, and recovery-time measurement.

## Tradeoffs and cautions

Chaos testing should be disciplined, scoped, and observable. Do not recommend destructive tests in production without safeguards, approval, and rollback plans.

## Example transformation

Before:

> Assume payment provider outage is handled because code has catch block.

After:

> Create integration test/staging drill where provider times out. Verify user response, retry queue, logs, metrics, admin visibility, and recovery behavior.

## Distilled skill rule

Do not assume resilience; test controlled failures and verify recovery paths.

---

# 21. Senior Engineering Judgment from Release It!

## Core teaching

The deeper skill is operational paranoia: not fear, but disciplined imagination about how systems break in production.

Codex should act less like a feature generator and more like a production-minded senior engineer.

## Codex trigger

Apply broadly when Codex is designing production systems, reviewing code, adding dependencies, writing workflows, changing deployment, introducing queues/caches/background jobs, or modifying critical business paths.

## Signals and smells

- “Just call this API”
- “Just load all records”
- “Just retry”
- “Just deploy it”
- “Just add a queue”
- “Just cache it”
- “Just run this script in prod”
- No stated failure model
- No operational visibility
- No rollback story

## Desired Codex behavior

Slow down enough to identify production risk before implementation.

Ask:

- What can fail?
- What can grow?
- What can block?
- What can retry?
- What can overload?
- What can be stale?
- What can be deployed halfway?
- What can operators see and control?

## Implementation guidance

- Keep happy-path code simple
- Add protective boundaries around risky operations
- Avoid hidden unbounded work
- Add operational visibility
- Design safe retries
- Separate critical from non-critical work
- Preserve compatibility during deploy
- Write tests for ugly paths

## Review guidance

Check failure containment, timeouts, retries, resource limits, result limits, observability, deploy safety, version compatibility, security config, and cleanup/steady state.

## Testing / verification guidance

Recommend normal behavior tests, dependency-failure tests, timeout tests, large-data tests, concurrency tests, retry/idempotency tests, migration tests, deployment-smoke tests, and operational-visibility checks.

## Tradeoffs and cautions

Do not turn every change into an enterprise architecture project. Scale advice to the system’s importance, current maturity, traffic, data sensitivity, and operational risk.

## Example transformation

Before:

> Codex implements the requested feature directly.

After:

> Codex implements the feature while identifying dependency risks, adding bounds/timeouts where needed, preserving deploy safety, and recommending targeted tests for production failure modes.

## Distilled skill rule

Before changing production-facing code, identify the likely production failure modes and add the smallest useful safeguards.

---

# Compression Candidates for Future SKILL.md

These are not the final skill yet. These are candidate rules to later compress into a Codex skill:

- Design production-facing code for real operating conditions, not just happy-path correctness.
- Treat every external dependency as unreliable: add timeouts, bounded retries, observability, and fallback where appropriate.
- Prevent failure propagation with isolation, bulkheads, circuit breakers, and graceful degradation.
- Never allow unbounded production work: cap result sets, queue sizes, retries, uploads, concurrency, and memory usage.
- Use retries only when safe: operations must be idempotent or protected by idempotency keys, with max attempts, backoff, and jitter.
- Protect critical workflows from non-critical work such as reports, exports, email, notifications, AI calls, and PDF generation.
- Every production artifact that accumulates needs a cleanup, retention, or ownership policy.
- Make important workflows observable with structured logs, metrics, health checks, and actionable failure states.
- Design deployments so old and new versions can coexist during rollout.
- Prefer staged, compatible schema/API/message changes over breaking changes.
- Reject impossible work early; do not let invalid or overloaded requests consume scarce resources.
- Apply load shedding and back pressure when demand exceeds capacity.
- Test failure modes: slow dependency, unavailable dependency, timeout, retry exhaustion, large data, duplicate request, partial failure, and recovery.
- Do not add resilience machinery blindly; scale safeguards to business criticality, traffic, data sensitivity, and operational risk.
