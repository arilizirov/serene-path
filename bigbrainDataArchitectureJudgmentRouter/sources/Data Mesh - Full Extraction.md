# Extracted Codex-Skill Training Material
## Source: _Data Mesh: Delivering Data-Driven Value at Scale_ — Zhamak Dehghani

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

This extraction is intentionally written as **operational guidance for an AI coding agent**, not as a human-facing book summary.

Primary engineering domains:

```text
data architecture
data product architecture
distributed data ownership
domain-driven data design
data governance
data platform engineering
data engineering
analytics architecture
senior engineering judgment
product engineering
```

Secondary domains:

```text
organizational design
data quality
metadata management
security
testing
production readiness
architecture
data contracts
self-service platforms
```

Core source angle:

```text
At scale, centralized data teams and monolithic data platforms become bottlenecks. Data Mesh proposes a decentralized sociotechnical architecture: domain-oriented data ownership, data as a product, self-serve data platform, and federated computational governance.
```

Important note for Codex extraction:

```text
This source is not merely about technology. Its value for Codex is teaching data architecture as a sociotechnical system: domain ownership, product thinking, platform enablement, and governance-as-code. Codex should not reduce Data Mesh to “use microservices for data” or “put data in many places.”
```

---

# 1. Centralized Data Teams Become Bottlenecks at Scale

## Core teaching

The core problem Data Mesh responds to is that centralized data teams often become bottlenecks when every domain, source system, dashboard, metric, and pipeline depends on one central group to understand, transform, and serve data.

The engineering behavior being taught is:

```text
When analytical demand scales across many domains, move ownership of data closer to the teams that understand and produce it.
```

For Codex, this means not automatically recommending “send everything to one central data team/warehouse team” for every data problem. Centralization can create consistency, but it can also create delay, poor domain understanding, and overloaded pipelines.

## Codex trigger

Apply this when Codex is:

- designing data architecture for multiple domains
- reviewing a centralized warehouse/lake bottleneck
- planning analytics at organizational scale
- designing domain data ownership
- creating data platform strategy
- reducing dependency on one reporting/data team
- creating data products
- scaling BI/data engineering across teams
- resolving slow delivery of data requests

## Signals and smells

Codex should notice:

- every report request queues behind one data team
- central team does not understand domain-specific meaning
- domain teams throw data “over the wall”
- dashboards take weeks/months because data meaning is unclear
- central pipelines are overloaded
- source systems change and central data breaks later
- central warehouse becomes a dumping ground
- data consumers do not know who owns data quality
- business definitions are lost during handoff
- source-aligned data arrives without ownership of analytical usability
- central team becomes responsible for data it does not produce or understand

## Desired Codex behavior

Codex should identify whether the issue is a centralization bottleneck, domain knowledge bottleneck, or platform capability bottleneck.

It should ask:

```text
Who understands this data best?
Who produces it?
Who consumes it?
Who is accountable for quality?
Is the central data team doing domain translation work that domain teams should own?
Is the bottleneck caused by lack of self-service platform capabilities?
```

Codex should recommend decentralization only when the organization has multiple domains and enough scale to justify it.

## Implementation guidance

When writing or modifying systems, Codex should:

- move data ownership toward domain teams where appropriate
- keep data product responsibilities close to source/domain knowledge
- create clear interfaces/contracts for analytical data
- avoid central “dumping ground” pipelines with no owner
- separate platform responsibilities from domain data responsibilities
- create reusable platform capabilities instead of making every domain invent infrastructure
- preserve enterprise-level governance through automated standards

## Review guidance

Codex should ask:

- Is the central data team a bottleneck?
- Would domain ownership improve meaning and quality?
- Are domain teams capable of owning analytical data?
- What platform support do they need?
- What governance must remain global?
- Are we decentralizing responsibility or just creating chaos?
- Does the design define clear ownership and accountability?

## Testing / verification guidance

Codex should recommend:

- ownership checks for datasets
- data product quality tests owned by domain
- data contract tests between producer and consumer
- platform compliance tests
- lineage from domain source to data product
- freshness and reliability checks exposed to consumers
- consumer feedback/usage metrics per data product

## Tradeoffs and cautions

Decentralization is not automatically better. For small teams, early-stage products, or simple reporting needs, a centralized model may be simpler and cheaper.

Data Mesh can fail if teams decentralize without product standards, platform support, and governance. Codex should not recommend “each team does whatever it wants.”

## Example transformation

**Before:**

```text
All teams send raw data extracts to a central warehouse team. The central team must infer meanings, fix quality, build dashboards, and answer all consumer questions.
```

**After:**

```text
Domain teams own published data products:
- Enrollment owns Registration Data Product
- Billing owns Payment Data Product
- Transport owns Route Assignment Data Product

A platform team provides ingestion, catalog, contract testing, monitoring, access control, and deployment templates.
Governance defines global standards.
```

## Distilled skill rule

When centralized data delivery becomes a bottleneck, shift analytical data ownership toward accountable domain teams while retaining shared platform and governance standards.

---

# 2. Domain-Oriented Data Ownership

## Core teaching

Data should be owned by the domain teams closest to its meaning and production. Domain teams understand the business semantics, source behavior, quality issues, and expected use better than a distant central team.

The engineering behavior being taught is:

```text
Assign data ownership by business domain, not by pipeline layer or central technical function.
```

For Codex, this means every important dataset or data product should have a clear domain owner that is accountable for its meaning, quality, and evolution.

## Codex trigger

Apply this when Codex is:

- designing domain data boundaries
- creating data products
- assigning dataset ownership
- designing data contracts
- building data catalogs
- resolving source-of-truth issues
- deciding who owns metrics
- scaling data architecture across teams

## Signals and smells

Codex should notice:

- dataset has no owner
- central data team owns data it does not understand
- source team changes fields without concern for analytics
- data consumers do not know whom to ask
- data quality issues bounce between teams
- domain terms are misunderstood by central pipeline owners
- reports use domain data without domain validation
- one dataset combines multiple domains with no responsible owner
- ownership is assigned by database/platform rather than business capability

## Desired Codex behavior

Codex should identify domain ownership explicitly.

It should ask:

```text
Which domain produces this data?
Which domain understands its meaning?
Who owns the operational source?
Who owns the published analytical contract?
Who answers quality/definition questions?
Which domains consume it?
```

Codex should treat ownership as part of the architecture, not an afterthought.

## Implementation guidance

Codex should:

- define domain owner for each data product/dataset
- place ownership metadata in catalog/docs
- align data products with bounded contexts/business capabilities
- avoid mixing multiple domains into one ownerless dataset
- define source-of-truth responsibility
- expose producer-owned data contracts
- create escalation path for quality/definition issues
- include owner in schema/metric changes

## Review guidance

Codex should ask:

- What domain owns this data?
- Does the owner understand the business meaning?
- Is the owner accountable for quality and contract?
- Are consumers known?
- Is ownership documented in metadata/catalog?
- Is the data product too cross-domain to have one clear owner?
- Are ownership boundaries aligned with business capability?

## Testing / verification guidance

Codex should recommend:

- metadata checks requiring owner/domain fields
- data contract tests owned by producer domain
- quality SLO tests per data product
- consumer compatibility tests
- schema change review by domain owner
- incident routing tests/alerts to correct owner

## Tradeoffs and cautions

Some datasets are genuinely cross-domain. Codex should not force a single domain owner without thought. Cross-domain products may need composite ownership, but one accountable owner must still be clear.

Domain ownership requires capability. If domain teams lack data engineering skills, platform enablement and training are prerequisites.

## Example transformation

**Before:**

```text
central_reporting.registration_summary is owned by the data team.
Enrollment team changes registration statuses, and the report silently breaks.
```

**After:**

```text
Enrollment domain owns Registration Data Product:
- schema
- status definitions
- quality checks
- freshness target
- consumer contract
- change communication

Platform team provides deployment/testing/catalog tools.
```

## Distilled skill rule

Assign analytical data ownership to the domain that understands and produces the data, and make that owner accountable for meaning, quality, and contract evolution.

---

# 3. Data as a Product

## Core teaching

A data product is not just a table or file. It is a deliberately designed, discoverable, understandable, trustworthy, secure, and usable data offering for consumers.

The engineering behavior being taught is:

```text
Treat data consumers as users and design data outputs as products with quality, documentation, contracts, and support.
```

For Codex, this means that publishing data requires more than creating a table. A usable data product needs clear semantics, ownership, documentation, access model, quality signals, discoverability, and reliability.

## Codex trigger

Apply this when Codex is:

- publishing datasets
- creating analytics tables
- designing BI/semantic models
- creating APIs/events for data consumers
- creating a data catalog entry
- building data products for other teams
- exposing domain data externally
- designing data contracts
- improving trust in datasets

## Signals and smells

Codex should notice:

- dataset exists but consumers cannot understand it
- no owner or support channel
- no documentation
- no freshness indicator
- no quality checks
- no contract or versioning
- no access instructions
- schema names are cryptic
- consumers repeatedly ask what fields mean
- data product breaks consumers without notice
- consumers build local copies because official data is hard to use
- dataset is accurate but not usable

## Desired Codex behavior

Codex should design data outputs as products.

A data product should include:

```text
name
domain owner
business description
schema/contract
grain or entity meaning
data quality expectations
freshness/latency expectations
access policy
lineage/source
sample queries/examples
versioning/change policy
support/contact
consumer feedback loop
```

## Implementation guidance

Codex should:

- create dataset metadata and documentation
- define schema contract and compatibility rules
- add quality tests and freshness checks
- publish lineage/source info
- expose access controls and request process
- include example queries/API usage
- define SLOs or expectations where useful
- provide semantic definitions for metrics
- design stable interfaces rather than exposing raw internals
- version breaking changes

## Review guidance

Codex should ask:

- Who are the consumers?
- What decisions/use cases does this data support?
- Can consumers discover and understand it?
- Is the data trustworthy?
- Is freshness visible?
- Is quality measured?
- Is access governed?
- Is the interface stable?
- How do consumers report issues?
- Is versioning/change policy clear?

## Testing / verification guidance

Codex should recommend:

- data quality tests
- freshness tests
- schema/contract tests
- access-control tests
- sample query tests
- documentation completeness checks
- lineage checks
- consumer regression tests
- SLO monitoring

## Tradeoffs and cautions

Not every internal intermediate table is a data product. Codex should distinguish:

```text
internal pipeline tables
raw/staging data
intermediate transformations
published data products
```

Only published/consumer-facing data should carry full product obligations.

## Example transformation

**Before:**

```text
billing_payments_clean table exists in the warehouse. Analysts use it after asking the data engineer what it means.
```

**After:**

```text
Payment Transactions Data Product:
- owner: Billing domain
- grain: one row per posted payment transaction
- freshness: updated every 15 minutes
- quality: payment_id unique, amount non-null, reconciles to billing system
- access: finance/reporting roles
- docs: field definitions, example queries, lineage
- contract: additive schema changes, breaking changes versioned
```

## Distilled skill rule

Publish consumer-facing data as a product with owner, contract, documentation, quality, freshness, access, lineage, examples, and support.

---

# 4. Data Products Need Explicit Contracts

## Core teaching

A data product must provide a stable, understandable contract to consumers. The contract includes schema, semantics, quality expectations, freshness, access, and change rules.

The engineering behavior being taught is:

```text
Do not expose unstable internal tables as consumer-facing data products.
```

For Codex, this means designing data interfaces intentionally, much like APIs.

## Codex trigger

Apply this when Codex is:

- exposing tables/views/events/APIs to consumers
- creating data products
- changing schema used by other teams
- publishing domain events for analytics
- creating semantic models
- defining producer-consumer data boundaries
- reviewing breaking data changes

## Signals and smells

Codex should notice:

- consumers query raw source tables directly
- schema changes break dashboards
- no versioning
- field meanings unclear
- source application internal fields exposed
- consumers depend on undocumented columns
- table is renamed or column removed without notice
- data freshness varies silently
- no compatibility tests
- no consumer ownership list

## Desired Codex behavior

Codex should define data contracts explicitly.

A data contract may include:

```text
schema
field definitions
primary keys/grain
quality constraints
freshness/latency
allowed values
security classification
version
compatibility policy
deprecation policy
producer owner
consumer list
```

## Implementation guidance

Codex should:

- create stable views/APIs/events as contract boundaries
- hide internal source tables behind published interfaces
- use additive changes when possible
- version breaking schema changes
- keep semantic definitions in contract docs
- add contract tests in CI/pipeline
- notify or test against known consumers
- include freshness and quality expectations
- avoid exposing implementation-only fields

## Review guidance

Codex should ask:

- Is this a consumer-facing contract?
- Who consumes it?
- What compatibility guarantees exist?
- Are schema and semantics documented?
- Are quality/freshness expectations explicit?
- Is this exposing internal implementation details?
- What is the breaking-change process?

## Testing / verification guidance

Codex should recommend:

- schema contract tests
- field-level validation tests
- compatibility tests
- consumer-driven contract tests
- freshness SLO tests
- quality SLO tests
- access/security tests
- deprecation/migration tests

## Tradeoffs and cautions

Contracts add overhead. Use strong contracts for published data products and external consumers, not for every internal temporary transformation.

## Example transformation

**Before:**

```text
Dashboard reads enrollment_app.registrations directly. Developer renames status column and dashboard breaks.
```

**After:**

```text
Enrollment domain publishes registration_data_product.v1:
- registration_id
- student_id
- school_year
- registration_status
- submitted_at
- approved_at

Source app internals can change as long as v1 contract is preserved.
```

## Distilled skill rule

Expose published data through explicit contracts with schema, semantics, quality, freshness, access, and versioning guarantees.

---

# 5. Self-Serve Data Platform Enables Domain Teams

## Core teaching

Domain teams cannot own data products effectively if every pipeline, catalog entry, access policy, quality check, and deployment requires custom infrastructure work. A self-serve data platform gives domains paved roads to build, publish, govern, and operate data products.

The engineering behavior being taught is:

```text
Centralize platform capabilities, not domain data ownership.
```

For Codex, this means distinguishing between:

```text
domain team: owns data meaning/product
platform team: provides tools and standards to publish/operate data products
```

## Codex trigger

Apply this when Codex is:

- designing data platform architecture
- enabling multiple domains to publish data
- creating templates for pipelines
- creating data product scaffolds
- implementing catalogs/metadata
- standardizing quality/security/governance checks
- reducing repeated infrastructure work
- helping Codex/AI agents generate data products consistently

## Signals and smells

Codex should notice:

- each domain builds pipelines differently
- no standard way to publish data product
- quality checks are hand-written inconsistently
- access control is manual
- catalog entries are missing
- lineage is not captured
- domains depend on platform team for every change
- too much bespoke infrastructure per dataset
- governance relies on human review only
- data product deployment is slow or risky

## Desired Codex behavior

Codex should recommend platform capabilities that reduce cognitive load for domain teams.

Self-serve platform capabilities may include:

```text
pipeline templates
data product scaffolds
schema contract tooling
metadata/catalog registration
quality test framework
access-control automation
lineage capture
freshness monitoring
deployment workflows
observability dashboards
data discovery
standard storage/compute abstractions
policy-as-code checks
```

## Implementation guidance

Codex should:

- create reusable templates for data products
- automate catalog/metadata requirements
- provide built-in quality/freshness checks
- standardize access control patterns
- include CI/CD for data pipelines
- expose lineage and observability by default
- make platform APIs simple for domain teams
- avoid forcing every domain to understand infrastructure internals
- encode governance policies into platform checks

## Review guidance

Codex should ask:

- What capabilities do domain teams need to publish safely?
- What is repeated across data products?
- Can this be templated or automated?
- Does the platform reduce or increase domain burden?
- Are governance rules built into the platform?
- Can teams self-serve without bypassing standards?
- Is the platform too generic or too restrictive?

## Testing / verification guidance

Codex should recommend:

- scaffold/template tests
- platform policy tests
- automated metadata completeness tests
- access-control provisioning tests
- pipeline deployment tests
- quality/freshness monitoring tests
- lineage capture tests
- golden-path end-to-end test for publishing a data product

## Tradeoffs and cautions

A self-serve platform can become a bottleneck if it is too rigid, over-engineered, or disconnected from domain needs. Codex should build platform capabilities incrementally around repeated domain pain.

Do not build a platform before there are enough domains/use cases to justify it.

## Example transformation

**Before:**

```text
Each domain writes custom ingestion scripts, manually creates tables, asks data platform team for permissions, and forgets catalog metadata.
```

**After:**

```text
Platform provides:
create-data-product template
contract.yml
quality_checks.yml
metadata.yml
CI pipeline
access policy config
freshness monitor
catalog auto-publish

Domain teams fill in domain-specific schema, definitions, and transformations.
```

## Distilled skill rule

Centralize reusable platform capabilities so domain teams can publish governed data products without custom infrastructure work each time.

---

# 6. Federated Computational Governance

## Core teaching

Data Mesh does not eliminate governance; it changes how governance is implemented. Governance should be federated across domains and automated through platform capabilities where possible.

The engineering behavior being taught is:

```text
Govern globally important rules through federated standards and automated enforcement, not through a central team manually approving every dataset.
```

For Codex, this means governance should be both decentralized and consistent.

## Codex trigger

Apply this when Codex is:

- designing data governance for multiple domains
- creating standards for data products
- implementing policy-as-code
- defining quality/security/metadata requirements
- preventing data product chaos
- balancing autonomy with consistency
- creating data platform checks
- reviewing cross-domain data architecture

## Signals and smells

Too centralized:

- every data change waits for central approval
- governance team becomes bottleneck
- standards are detached from domain reality
- manual review slows delivery

Too decentralized:

- domains use incompatible schemas/metadata
- quality standards vary wildly
- sensitive data exposed inconsistently
- no global interoperability
- no shared glossary/standards
- consumers cannot compare products

## Desired Codex behavior

Codex should define federated governance:

```text
global standards
domain participation
automated checks
policy-as-code
shared glossary
interoperability rules
security rules
quality expectations
metadata requirements
exception process
```

Governance should be enforced computationally where possible.

## Implementation guidance

Codex should:

- define required metadata fields
- enforce schema/contract standards in CI
- enforce sensitive-data classification
- enforce access policy templates
- validate freshness/quality SLO declarations
- standardize naming/identity rules where needed
- provide global interoperability rules for shared dimensions/entities
- allow domain-specific extensions
- document exception process

## Review guidance

Codex should ask:

- Which rules must be global?
- Which decisions belong to domains?
- Are rules enforced automatically?
- Is governance blocking delivery unnecessarily?
- Are security/privacy rules consistent?
- Are data products interoperable?
- Are exceptions visible and justified?

## Testing / verification guidance

Codex should recommend:

- policy-as-code tests
- metadata completeness tests
- schema compatibility tests
- sensitive-data classification checks
- access-control tests
- quality SLO tests
- naming/standards linting
- governance exception tests/logging

## Tradeoffs and cautions

Too much computational governance can become rigid and frustrating. Too little creates chaos. Codex should recommend a small set of high-value global rules first.

## Example transformation

**Before:**

```text
A central governance board manually reviews every new dataset, causing long delays. Some domains bypass the process and publish undocumented tables.
```

**After:**

```text
Federated governance:
- required metadata enforced in CI
- sensitive fields require classification
- contract tests required for published products
- domain owners approve semantics
- global council owns standards
- platform auto-publishes compliant products
```

## Distilled skill rule

Use federated governance with automated policy checks to balance domain autonomy with global interoperability, security, and quality standards.

---

# 7. Data Product Discoverability and Addressability

## Core teaching

A data product is valuable only if consumers can find it, understand it, access it, and know how to use it. Discoverability and addressability are first-class requirements.

The engineering behavior being taught is:

```text
Published data must be cataloged, named, documented, searchable, and accessible through stable addresses/contracts.
```

For Codex, this means that creating a table without catalog metadata and access instructions is incomplete for a data product.

## Codex trigger

Apply this when Codex is:

- publishing datasets
- designing data catalog entries
- naming data products
- exposing APIs/events/tables
- creating documentation
- creating semantic models
- designing cross-domain discovery
- building internal data marketplace

## Signals and smells

Codex should notice:

- consumers do not know dataset exists
- dataset name is cryptic
- no catalog entry
- no owner listed
- no stable location/address
- no sample query
- no field definitions
- access process unclear
- multiple similar datasets and consumers choose wrong one
- deprecated datasets remain discoverable without warning

## Desired Codex behavior

Codex should ensure data products are discoverable and addressable.

A catalog entry should include:

```text
data product name
domain
owner/support contact
description/use cases
schema
field definitions
grain/entity meaning
freshness
quality/SLO indicators
sensitivity/access rules
lineage
sample queries
version/deprecation status
```

## Implementation guidance

Codex should:

- assign stable names/paths/topics/endpoints
- register products in catalog
- include machine-readable metadata
- include human-readable descriptions
- provide examples
- tag domain and sensitivity
- expose freshness and quality status
- mark deprecated versions clearly
- avoid publishing duplicate confusing products without guidance

## Review guidance

Codex should ask:

- Can consumers find this product?
- Is its purpose clear?
- Is it named in business language?
- Is access process clear?
- Are quality/freshness visible?
- Is deprecated data marked?
- Are similar products differentiated?

## Testing / verification guidance

Codex should recommend:

- catalog metadata completeness tests
- stable address/endpoint tests
- sample query tests
- access request workflow tests
- deprecation status tests
- freshness/quality status publication tests

## Tradeoffs and cautions

Catalogs can become junk drawers if every internal table is published. Codex should catalog published products clearly and treat internal pipeline tables differently.

## Example transformation

**Before:**

```text
A table named `int_enr_v3_final_clean` contains important registration data. Only the original engineer knows how to use it.
```

**After:**

```text
Cataloged data product:
Enrollment.RegistrationApplications.v1
- owner: Enrollment
- grain: one row per registration application
- freshness: 15 min
- quality: status passing
- docs and sample queries
- access policy
- lineage to enrollment system
```

## Distilled skill rule

A published data product must be discoverable and addressable through stable naming, catalog metadata, documentation, access rules, and examples.

---

# 8. Data Product Quality and Observability

## Core teaching

Data products must be trustworthy. Trust requires observable quality: freshness, completeness, validity, accuracy, schema stability, reliability, and consumer-visible status.

The engineering behavior being taught is:

```text
Data product quality must be measured, monitored, and exposed to consumers.
```

For Codex, this means that data products need tests and operational indicators, not just successful pipeline runs.

## Codex trigger

Apply this when Codex is:

- creating data products
- publishing dashboards
- designing pipelines
- defining quality SLOs
- building data observability
- reviewing data reliability
- creating data contracts
- setting consumer expectations

## Signals and smells

Codex should notice:

- data product has no freshness indicator
- no quality tests
- consumers discover stale data manually
- schema breaks without warning
- no incident/status history
- no completeness checks
- no reconciliation to source
- pipeline success does not mean data is correct
- quality issues hidden from consumers
- no SLO/expectation

## Desired Codex behavior

Codex should define data product quality dimensions and expose them.

Quality/observability may include:

```text
freshness
schema validity
completeness
uniqueness
referential integrity
valid values
volume anomalies
reconciliation
lineage status
contract compatibility
consumer-facing health status
incident history
```

## Implementation guidance

Codex should:

- add data quality tests to product pipeline
- define freshness expectations
- expose last updated timestamp
- monitor row count/volume anomalies
- reconcile critical measures to source
- validate schema contract
- publish health/status metadata
- alert producer domain on failures
- include quality status in catalog
- define severity thresholds

## Review guidance

Codex should ask:

- What quality expectations do consumers need?
- Is freshness visible?
- Are schema and values tested?
- Are critical metrics reconciled?
- Are failures alerted to the owner?
- Can consumers see product health?
- Are quality issues tracked over time?

## Testing / verification guidance

Codex should recommend:

- freshness tests
- schema contract tests
- null/uniqueness/range tests
- accepted-value tests
- volume anomaly tests
- source reconciliation tests
- health status publication tests
- alert tests
- quality SLO monitoring

## Tradeoffs and cautions

Do not create dozens of noisy checks. Quality checks should focus on the product’s contract, consumer needs, and known failure modes.

## Example transformation

**Before:**

```text
Payment Data Product refreshes nightly. Sometimes it misses a file, but dashboard still shows old data with no warning.
```

**After:**

```text
Payment Data Product exposes:
- last_successful_refresh
- expected_refresh_interval
- row_count_anomaly_status
- reconciliation_to_billing_status
- schema_contract_status
- owner alert on failure
- catalog health badge
```

## Distilled skill rule

Every published data product should expose quality, freshness, contract, and reliability status to producers and consumers.

---

# 9. Data Product Interoperability

## Core teaching

Autonomous domain data products must still interoperate. Without shared standards for identity, time, reference data, semantics, and contracts, decentralization produces disconnected data silos.

The engineering behavior being taught is:

```text
Decentralize ownership without sacrificing cross-domain interoperability.
```

For Codex, this means domain products should use or map to shared identifiers, reference data, and semantic conventions where cross-domain analysis matters.

## Codex trigger

Apply this when Codex is:

- designing multiple domain data products
- integrating products across domains
- creating enterprise metrics
- defining shared dimensions
- building cross-domain dashboards
- designing identity resolution
- defining reference data
- reviewing data product contracts

## Signals and smells

Codex should notice:

- each domain uses different customer/student IDs
- date/time semantics differ
- statuses/codes are incompatible
- no shared reference data
- products cannot be joined safely
- cross-domain metrics require manual mapping
- same term means different things
- no global identifiers or mapping strategy
- data mesh creates new silos

## Desired Codex behavior

Codex should identify interoperability requirements.

It should define standards for:

```text
identity keys
shared reference data
time/date conventions
units/currencies
semantic definitions
event naming
schema compatibility
data types/formats
security classifications
```

## Implementation guidance

Codex should:

- use shared enterprise identifiers where appropriate
- publish identity mapping data products when needed
- standardize date/time/timezone conventions
- use governed reference data
- define common semantic terms
- require product contracts to specify join keys
- validate compatibility through policy checks
- document product relationships in catalog

## Review guidance

Codex should ask:

- Which products need to interoperate?
- What keys connect them?
- Are shared terms defined consistently?
- Are reference values standardized?
- Are time and units compatible?
- Can consumers join products safely?
- Are mappings governed?

## Testing / verification guidance

Codex should recommend:

- cross-product join tests
- reference data conformance tests
- identity mapping tests
- semantic definition checks
- timezone/unit tests
- consumer query tests
- interoperability policy checks

## Tradeoffs and cautions

Not every product needs enterprise interoperability. Local domain products can have local semantics. But published enterprise-facing products must document and conform where cross-domain use is expected.

## Example transformation

**Before:**

```text
Enrollment uses student_id, Billing uses account_child_id, Transport uses name + phone. Cross-domain dashboards manually match records.
```

**After:**

```text
Shared Student Identity data product maps domain IDs to enterprise_student_id.
Enrollment, Billing, and Transport products expose enterprise_student_id where permitted.
Reference school_year and date conventions are shared.
```

## Distilled skill rule

Decentralized data products must conform on shared identity, time, reference data, and semantics when cross-domain analysis depends on them.

---

# 10. Data Products Have Lifecycle and Versioning

## Core teaching

Data products evolve. Schemas change, definitions change, products are deprecated, consumers migrate, and old versions must be retired safely.

The engineering behavior being taught is:

```text
Manage data product change like API/product change: version, deprecate, migrate, and communicate.
```

For Codex, this means not renaming/removing fields casually once consumers depend on them.

## Codex trigger

Apply this when Codex is:

- changing a data product schema
- modifying metric definitions
- removing fields
- changing grain
- changing freshness/quality guarantees
- deprecating datasets
- publishing new product versions
- migrating consumers
- reviewing breaking changes

## Signals and smells

Codex should notice:

- dashboards break after schema change
- old products remain forever without owner
- breaking changes are unversioned
- no consumer list
- no deprecation notice
- no migration guide
- v1/v2 semantics unclear
- changes to grain or metric formula are hidden
- products are abandoned but still used

## Desired Codex behavior

Codex should define lifecycle management.

Lifecycle states:

```text
draft
published
deprecated
retired
archived
```

Change types:

```text
additive compatible change
breaking schema change
semantic/definition change
quality/freshness contract change
access-policy change
```

## Implementation guidance

Codex should:

- prefer additive changes
- version breaking changes
- document semantic changes
- maintain old version during migration window
- list known consumers
- provide migration guide
- mark deprecated products in catalog
- monitor usage before retirement
- remove/retire old products intentionally
- test compatibility before release

## Review guidance

Codex should ask:

- Is this change compatible?
- Who consumes this product?
- Is versioning needed?
- Is deprecation period defined?
- Is migration guidance available?
- Is catalog status updated?
- Are semantic changes communicated?
- Can old and new versions coexist?

## Testing / verification guidance

Codex should recommend:

- schema compatibility tests
- consumer regression tests
- old/new version comparison
- migration tests
- catalog status tests
- usage monitoring before retirement
- deprecation warning tests

## Tradeoffs and cautions

Too many versions increase maintenance burden. Codex should prefer additive evolution where possible, but not hide true semantic changes.

## Example transformation

**Before:**

```text
Enrollment product changes `status` from free text to enum and removes old values. Consumer dashboards fail.
```

**After:**

```text
Enrollment.RegistrationApplications.v2 adds registration_status_code.
v1 remains for 90 days.
Catalog marks v1 deprecated.
Migration guide maps old values to new codes.
Contract tests validate v2.
```

## Distilled skill rule

Manage data products with lifecycle states, compatibility rules, versioning, deprecation, migration guidance, and consumer impact checks.

---

# 11. Data Mesh Requires Product Thinking, Not Dataset Dumping

## Core teaching

Data as a product requires product management behavior: understanding consumers, use cases, value, usability, reliability, feedback, and evolution.

The engineering behavior being taught is:

```text
A data product must solve consumer problems, not merely expose producer data.
```

For Codex, this means designing data outputs from consumer needs while keeping producer ownership.

## Codex trigger

Apply this when Codex is:

- creating data product specs
- designing analytics datasets
- improving dataset usability
- creating dashboards from domain data
- defining APIs/events for consumers
- writing catalog documentation
- prioritizing data product work
- evaluating whether a dataset should be published

## Signals and smells

Codex should notice:

- producer publishes raw tables and calls it done
- no known consumers/use cases
- schema reflects producer internals only
- consumers create many derived fixes
- dataset is technically accurate but hard to use
- no feedback mechanism
- no roadmap for product improvements
- no SLO based on consumer needs
- support questions repeat

## Desired Codex behavior

Codex should apply product questions:

```text
Who are the consumers?
What decisions/workflows do they support?
What fields/metrics do they need?
What freshness/quality do they require?
What examples/docs help them?
What feedback loop exists?
What is out of scope?
```

## Implementation guidance

Codex should:

- define consumer personas/use cases
- design schema around stable domain concepts and consumer needs
- provide examples and documentation
- expose product health and quality
- define support process
- capture feedback/issues
- prioritize improvements by consumer value
- avoid exposing unnecessary internals
- maintain roadmap/deprecation policy

## Review guidance

Codex should ask:

- What consumer problem does this solve?
- Is the schema useful or just source-shaped?
- Is documentation sufficient?
- Are freshness/quality aligned with use case?
- Are consumers known?
- Is there a support/feedback path?
- Is this product worth maintaining?

## Testing / verification guidance

Codex should recommend:

- sample consumer query tests
- consumer acceptance tests
- data product usability review
- quality/freshness tests tied to use case
- documentation completeness tests
- feedback/issue tracking

## Tradeoffs and cautions

Do not over-customize a data product for one consumer if it should serve many. Balance consumer usefulness with stable domain-owned semantics.

## Example transformation

**Before:**

```text
Transport domain publishes raw route assignment table with internal route codes and no documentation.
```

**After:**

```text
Transport Route Assignment Data Product:
- designed for attendance, billing, and operations consumers
- exposes student_id, route_id, pickup_zone, effective dates, active flag
- maps internal route codes to governed route references
- includes examples and freshness/quality expectations
```

## Distilled skill rule

Design data products around consumer value, usability, reliability, documentation, feedback, and domain-owned semantics.

---

# 12. Data Mesh Is a Sociotechnical Architecture

## Core teaching

Data Mesh is not only a technology pattern. It changes responsibilities, team boundaries, governance, platform capabilities, and product behavior.

The engineering behavior being taught is:

```text
Do not implement Data Mesh as tools alone; align organization, ownership, platform, and governance.
```

For Codex, this means that recommending Kafka, dbt, data catalogs, or lakehouse tooling is not enough.

## Codex trigger

Apply this when Codex is:

- asked to implement Data Mesh
- designing decentralized data architecture
- recommending tooling
- assigning data product ownership
- building a data platform
- changing governance
- creating data product templates
- reviewing a “data mesh” proposal

## Signals and smells

Codex should notice:

- Data Mesh described as buying a tool
- domains not accountable for data
- central team still owns all pipelines
- no platform enablement
- governance remains manual/centralized
- no data product contracts
- no consumer product thinking
- no domain capability uplift
- decentralized chaos called mesh
- lake/lakehouse rebranded as mesh

## Desired Codex behavior

Codex should frame Data Mesh as four connected pillars:

```text
domain-oriented ownership
data as a product
self-serve data platform
federated computational governance
```

It should reject partial implementations that ignore ownership/governance/product behavior.

## Implementation guidance

Codex should:

- define domain ownership model
- identify data product candidates
- create platform golden paths
- encode governance rules in CI/platform
- build metadata/catalog/quality/access capabilities
- train/domain-enable teams
- start with a few high-value domains
- measure adoption and consumer value
- avoid tool-first implementation

## Review guidance

Codex should ask:

- Which domains own which products?
- What makes the dataset a product?
- What platform capabilities enable self-service?
- Which governance rules are automated?
- How are consumers supported?
- Are teams ready for ownership?
- Is this merely centralized architecture renamed?

## Testing / verification guidance

Codex should recommend:

- data product readiness checklist
- platform golden-path test
- governance policy tests
- ownership metadata checks
- quality/freshness tests
- consumer acceptance tests
- adoption/usage metrics
- incident ownership tests

## Tradeoffs and cautions

Data Mesh is heavy for small organizations. Codex should not recommend it just because it is modern. It is appropriate when scale, domain diversity, and centralized bottlenecks justify the sociotechnical change.

## Example transformation

**Before:**

```text
Company buys a catalog and says it now has Data Mesh.
```

**After:**

```text
Company defines:
- Enrollment owns Registration Product
- Billing owns Payment Product
- Platform provides publishing templates, quality checks, catalog, access control
- Governance defines required metadata, PII classification, compatibility rules
- Consumers discover and use products through catalog
```

## Distilled skill rule

Treat Data Mesh as a sociotechnical architecture requiring domain ownership, product thinking, self-serve platform, and federated computational governance.

---

# 13. Start Data Mesh Incrementally

## Core teaching

Data Mesh should not be introduced as a massive organizational transformation all at once. It should start with high-value domains, real consumer use cases, and platform/governance capabilities that can grow.

The engineering behavior being taught is:

```text
Adopt Data Mesh through thin, valuable, production-quality slices rather than a big-bang reorganization.
```

For Codex, this means recommending pilots and incremental adoption.

## Codex trigger

Apply this when Codex is:

- planning Data Mesh adoption
- deciding first data products
- creating platform roadmap
- migrating from centralized data architecture
- reorganizing data ownership
- user asks “how do we start?”
- scaling data architecture gradually

## Signals and smells

Codex should notice:

- plan tries to convert all domains at once
- no first data product/use case
- platform built before domain demand
- governance committee created before automated checks
- teams told to own data without support
- existing warehouse/lake abandoned prematurely
- no adoption metrics
- no consumer validation

## Desired Codex behavior

Codex should propose incremental adoption.

Pilot criteria:

```text
clear domain owner
real consumer demand
manageable data scope
visible business value
quality/freshness requirements
platform capabilities testable
governance rules applicable
```

## Implementation guidance

Codex should:

- select 1–2 pilot data products
- define domain owner and consumers
- create product contract and catalog entry
- implement quality/freshness checks
- use platform templates even if simple
- automate a small set of governance policies
- collect consumer feedback
- expand only after lessons are captured
- keep existing warehouse/BI stable during transition

## Review guidance

Codex should ask:

- What is the first product?
- Who owns it?
- Who consumes it?
- What platform capability will this test?
- What governance rule will this test?
- How will success be measured?
- What will we learn before expanding?

## Testing / verification guidance

Codex should recommend:

- pilot data product acceptance tests
- product quality/freshness tests
- catalog discoverability tests
- platform deployment test
- governance policy tests
- consumer usage/feedback tracking
- retrospective after pilot

## Tradeoffs and cautions

A pilot that is too trivial may not teach anything. A pilot that is too complex may fail for avoidable reasons. Codex should choose a useful but bounded domain.

## Example transformation

**Before:**

```text
Organization announces every team must publish all datasets as data products this quarter.
```

**After:**

```text
Pilot:
Enrollment publishes Registration Applications Data Product.
Billing publishes Payment Transactions Data Product.
Platform provides one template and catalog automation.
Governance enforces owner, schema contract, freshness, PII tags.
```

## Distilled skill rule

Adopt Data Mesh incrementally through high-value pilot data products that test ownership, platform, governance, and consumer value.

---

# 14. Data Product Boundaries Should Follow Domain Boundaries

## Core teaching

Data product boundaries should align with business domains and bounded contexts, not merely with databases, tables, teams, or technical layers.

The engineering behavior being taught is:

```text
Design data products around coherent domain capabilities and business meaning.
```

For Codex, this connects Data Mesh to domain-driven design.

## Codex trigger

Apply this when Codex is:

- defining data products
- splitting large datasets
- assigning owners
- designing domain architecture
- publishing data from microservices/modules
- creating product catalog
- resolving overlapping datasets
- deciding whether one product is too broad

## Signals and smells

Codex should notice:

- data product named after database/table
- one product combines unrelated domains
- product boundary follows ingestion pipeline instead of domain
- ownership unclear because product spans many domains
- consumer cannot understand product purpose
- multiple products expose overlapping conflicting domain data
- technical team owns domain semantics it does not understand

## Desired Codex behavior

Codex should identify bounded business contexts.

It should ask:

```text
What domain capability produces this data?
What business concept does it represent?
Does this product have one coherent owner?
What consumers use it?
Does it mix unrelated domain semantics?
```

## Implementation guidance

Codex should:

- align data products with bounded contexts/capabilities
- keep product scope cohesive
- avoid table-per-product if tables are implementation details
- avoid giant enterprise product with no clear owner
- define relationships between products through contracts/identifiers
- split products when ownership or semantics diverge
- combine data when it forms one coherent domain product

## Review guidance

Codex should ask:

- Is the product boundary domain-oriented?
- Does one domain own the meaning?
- Is product scope too broad or too narrow?
- Does it expose implementation tables?
- Are overlapping products conflicting?
- Is consumer use aligned with product purpose?

## Testing / verification guidance

Codex should recommend:

- ownership metadata checks
- product contract tests
- domain glossary alignment checks
- consumer query validation
- cross-product relationship tests
- duplicate/conflict detection across catalog

## Tradeoffs and cautions

Domain boundaries are often uncertain. Codex should allow boundaries to evolve and version products when semantics change.

## Example transformation

**Before:**

```text
Data product: postgres.public.students_table_export
Owner: central data team
```

**After:**

```text
Data products:
Enrollment.StudentRegistration.v1
FamilyAdministration.FamilyProfile.v1
Billing.StudentAccountBalance.v1

Each has domain owner, contract, and consumer docs.
```

## Distilled skill rule

Define data product boundaries around coherent domain capabilities and ownership, not around source tables or technical pipelines.

---

# 15. Governance Should Be Built Into the Delivery Pipeline

## Core teaching

Computational governance means governance rules are enforced by code, automation, and platform workflows rather than by manual review alone.

The engineering behavior being taught is:

```text
Make compliance with data standards part of build, test, deploy, and publish workflows.
```

For Codex, this means data product publication should fail if required quality, metadata, security, or contract rules are missing.

## Codex trigger

Apply this when Codex is:

- creating data product CI/CD
- defining platform templates
- enforcing metadata standards
- adding data quality checks
- implementing access policies
- checking PII classification
- publishing datasets
- designing data governance automation

## Signals and smells

Codex should notice:

- governance checklist is manual
- data products published without owner/docs
- sensitive fields unclassified
- no schema compatibility tests
- quality checks optional
- access policies applied manually
- consumers discover issues after release
- no automated enforcement of standards
- platform allows non-compliant products

## Desired Codex behavior

Codex should encode governance into automated workflow.

Governance checks may include:

```text
owner exists
domain exists
description exists
schema contract valid
breaking changes detected
quality checks defined
freshness target declared
sensitive fields classified
access policy present
lineage/source declared
sample query/docs present
```

## Implementation guidance

Codex should:

- add CI checks for data product metadata
- validate schema contracts on change
- enforce data quality tests before publish
- require sensitivity classification for fields
- generate catalog entries from metadata files
- validate access policies
- block breaking changes without version bump/approval
- publish health status automatically
- keep exception workflow explicit and auditable

## Review guidance

Codex should ask:

- Which governance rules are automated?
- Which rules still require human judgment?
- Does CI block non-compliant products?
- Are exceptions tracked?
- Are rules too strict or too weak?
- Are domain teams able to fix failures themselves?

## Testing / verification guidance

Codex should recommend:

- policy-as-code unit tests
- CI failure tests for missing metadata
- schema compatibility tests
- PII classification checks
- access policy tests
- data quality test execution
- catalog publish tests
- exception path tests

## Tradeoffs and cautions

Not all governance can be automated. Semantics and business definitions still need human domain judgment. Codex should automate repeatable checks and leave true meaning disputes to stewards/owners.

## Example transformation

**Before:**

```text
A domain publishes a table. Later governance discovers no owner, no PII tags, no freshness target, and missing field definitions.
```

**After:**

```text
Data product pipeline fails unless:
metadata.yml includes owner/domain/description
contract.yml validates schema
quality_checks.yml passes
pii_classification.yml tags sensitive fields
access_policy.yml exists
```

## Distilled skill rule

Enforce repeatable data governance rules in CI/CD and platform workflows instead of relying only on manual review.

---

# 16. Data Product Security Is Part of the Product Contract

## Core teaching

Security and privacy are not external add-ons to data products. Access, sensitivity classification, masking, purpose, and audit expectations are part of the product’s contract.

The engineering behavior being taught is:

```text
A data product must define who can use it, what sensitive data it contains, and how access is controlled.
```

For Codex, this means data products should not be published broadly by default.

## Codex trigger

Apply this when Codex is:

- publishing data products
- exposing personal/financial/health/student data
- defining access policies
- building catalog entries
- creating analytics datasets
- enabling cross-domain consumption
- creating exports/APIs/events
- setting up role-based access

## Signals and smells

Codex should notice:

- product contains PII but no classification
- access is granted to all analysts
- sensitive fields not masked
- no audit of access
- no purpose limitation
- data copied downstream without policy
- no row/column-level access
- product docs omit sensitivity
- exports are uncontrolled
- test environments use production sensitive data

## Desired Codex behavior

Codex should include security metadata and controls in data product design.

It should define:

```text
sensitivity classification
allowed consumers/roles
access request process
column/row-level restrictions
masking/tokenization
audit logging
retention
export controls
downstream sharing policy
```

## Implementation guidance

Codex should:

- tag sensitive fields in product contract
- enforce access policies through platform
- mask fields for broad consumers
- expose aggregates where row-level detail is unnecessary
- audit access to sensitive data
- restrict exports
- define retention/deletion expectations
- avoid publishing unnecessary sensitive fields
- ensure downstream products inherit or respect policy

## Review guidance

Codex should ask:

- What sensitive fields exist?
- Who needs access?
- Can data be minimized?
- Are row/column restrictions needed?
- Is masking applied?
- Is access audited?
- Are exports controlled?
- Do downstream products preserve restrictions?

## Testing / verification guidance

Codex should recommend:

- access-control tests
- masking tests
- PII classification checks
- audit log tests
- export permission tests
- retention tests
- downstream policy propagation tests
- negative authorization tests

## Tradeoffs and cautions

Security rules should not make legitimate data use impossible, but least privilege should be default. For personal/student/financial data, Codex should be stricter.

## Example transformation

**Before:**

```text
FamilyProfile Data Product exposes full parent names, phones, addresses, IDs, and payment status to every data consumer.
```

**After:**

```text
FamilyProfile contract:
- sensitivity: PII
- default view masks IDs and phone
- billing role can access payment-related fields
- office admin role can access contact details
- teacher role gets class-level aggregates only
- all full-detail access audited
```

## Distilled skill rule

Include sensitivity classification, access rules, masking, audit, retention, and export policy in every data product contract.

---

# 17. Data Mesh Does Not Eliminate the Need for Warehouses, Lakes, or Platforms

## Core teaching

Data Mesh is an architectural operating model, not a replacement for all storage technologies. Warehouses, lakes, lakehouses, streams, catalogs, and BI tools may still exist; their roles change inside a domain-owned, product-oriented model.

The engineering behavior being taught is:

```text
Do not confuse Data Mesh with a specific storage technology or with eliminating centralized infrastructure.
```

For Codex, this means it should not say “use Data Mesh instead of a warehouse.” Data Mesh can use warehouses/lakes as platform components while changing ownership and product boundaries.

## Codex trigger

Apply this when user asks:

- “Data Mesh or warehouse?”
- “Does Data Mesh replace data lake?”
- “Should we abandon our warehouse?”
- “What stack should we use for Data Mesh?”
- “Should each domain have its own database?”
- “Can we implement Data Mesh with dbt/Snowflake/BigQuery/etc.?”

## Signals and smells

Codex should notice:

- Data Mesh treated as a tool purchase
- warehouse/lake abandoned without migration strategy
- centralized platform confused with centralized ownership
- domains told to build infrastructure themselves
- storage architecture chosen before ownership/product model
- “mesh” used to justify unmanaged data sprawl
- no catalog/governance/platform layer

## Desired Codex behavior

Codex should separate:

```text
operating model: domain ownership, product thinking, governance
platform capabilities: storage, compute, catalog, orchestration, access
data products: domain-owned outputs
```

Codex should explain that centralized platform infrastructure can coexist with decentralized ownership.

## Implementation guidance

Codex should:

- reuse existing warehouse/lake/lakehouse when appropriate
- publish domain-owned products on shared platform
- avoid unnecessary migration away from working infrastructure
- define product boundaries logically even if storage is shared
- separate platform admin from product ownership
- ensure governance and access controls work in chosen tooling
- avoid one-storage-per-domain unless justified

## Review guidance

Codex should ask:

- Are we changing ownership or just tools?
- Can existing platform support data products?
- Does storage design enforce or undermine product boundaries?
- Are domains responsible for infrastructure they cannot operate?
- Is centralization of tooling being confused with centralization of data ownership?

## Testing / verification guidance

Codex should recommend:

- product boundary checks within shared platform
- access-control tests
- catalog registration tests
- quality/freshness tests per product
- platform golden-path tests
- migration tests if changing storage

## Tradeoffs and cautions

Shared infrastructure can become centralized bottleneck if domains cannot self-serve. Separate platform enablement from central ticket-driven control.

## Example transformation

**Before:**

```text
“We need Data Mesh, so we should delete the warehouse and have every team create its own lake.”
```

**After:**

```text
“We can keep Snowflake/BigQuery/lakehouse as shared platform infrastructure. Domains publish owned data products into governed schemas with contracts, quality checks, catalog entries, and access policies.”
```

## Distilled skill rule

Data Mesh changes ownership, product design, platform self-service, and governance; it does not require abandoning warehouses, lakes, or shared infrastructure.

---

# 18. Avoid Data Mesh Cargo Culting

## Core teaching

Data Mesh should solve real scaling and ownership problems. Applying it prematurely or superficially creates complexity without value.

The engineering behavior being taught is:

```text
Use Data Mesh when scale and domain complexity justify it, not because it is fashionable.
```

For Codex, this means it should evaluate whether the user’s organization/project has the problems Data Mesh solves.

## Codex trigger

Apply this when:

- user asks whether to use Data Mesh
- data architecture is small/simple
- team is tiny
- one application/source dominates
- reporting needs are basic
- user wants “modern data architecture”
- tool vendors/frame articles push mesh language
- Codex is tempted to over-architect

## Signals and smells

Codex should notice:

- one small team
- few data consumers
- few domains
- no central data bottleneck
- no platform team
- no domain ownership capacity
- simple warehouse/mart would work
- mesh language used without concrete pain
- governance/platform overhead would exceed benefit

## Desired Codex behavior

Codex should recommend Data Mesh only when appropriate.

Data Mesh is more appropriate when:

```text
many domains
many data producers/consumers
central data team bottleneck
high domain complexity
need for scalable data product ownership
platform capabilities available or planned
governance automation needed
```

Less appropriate when:

```text
small team
single domain
simple reporting
early product discovery
no data platform capability
no domain teams to own products
```

## Implementation guidance

Codex should:

- evaluate organizational scale and pain
- recommend simpler architecture when sufficient
- borrow useful practices selectively:
  - ownership
  - contracts
  - data quality
  - catalog metadata
  - product thinking
- avoid full mesh transformation unless justified
- propose incremental pilot if uncertain

## Review guidance

Codex should ask:

- What problem is Data Mesh solving here?
- Is centralization actually a bottleneck?
- Are there domain teams capable of ownership?
- Is platform support available?
- Would a warehouse/mart/semantic layer solve this more simply?
- Which Data Mesh principles are useful now?

## Testing / verification guidance

Codex should recommend:

- pilot success criteria if adopting
- before/after data delivery lead time
- consumer satisfaction/usage metrics
- quality/freshness improvements
- platform self-service metrics
- governance compliance metrics

## Tradeoffs and cautions

Even if full Data Mesh is excessive, its principles can still help. A small project can benefit from data ownership, contracts, documentation, and quality checks without calling it Data Mesh.

## Example transformation

**Before:**

```text
Small startup with one database and three dashboards decides to implement full Data Mesh with many product owners and governance councils.
```

**After:**

```text
Codex recommends:
- one clean dimensional mart
- clear metric definitions
- owner for key datasets
- quality/freshness checks
- simple catalog docs

Defer full Data Mesh until multiple domains and delivery bottlenecks emerge.
```

## Distilled skill rule

Do not apply full Data Mesh unless domain scale, ownership capacity, and centralized bottlenecks justify it; borrow lightweight principles when simpler architecture is enough.

---

# 19. Data Mesh Requires Clear Consumer-Producer Relationships

## Core teaching

Data products exist between producers and consumers. The producer owns the product; consumers depend on the product contract. A healthy relationship includes feedback, compatibility, issue handling, and clear expectations.

The engineering behavior being taught is:

```text
Make data producer-consumer relationships explicit and managed.
```

For Codex, this means data contracts should include known consumers and support/feedback mechanisms.

## Codex trigger

Apply this when Codex is:

- creating data contracts
- publishing data products
- changing schemas
- managing consumer impact
- designing support processes
- creating catalog entries
- building cross-domain dashboards
- reviewing data product adoption

## Signals and smells

Codex should notice:

- producers do not know who consumes data
- consumers depend on undocumented fields
- breaking changes surprise dashboards
- no issue reporting path
- no feedback loop
- no consumer acceptance tests
- product roadmap ignores consumer needs
- consumers build shadow datasets because product is not useful
- producer publishes data but does not support it

## Desired Codex behavior

Codex should document and test producer-consumer relationships.

It should define:

```text
producer owner
consumer teams/use cases
contract expectations
support channel
change notification
consumer tests
feedback mechanism
SLOs/quality expectations
deprecation process
```

## Implementation guidance

Codex should:

- track known consumers in metadata/catalog
- add consumer-driven contract tests for important consumers
- define issue escalation path
- notify consumers of breaking changes
- provide migration windows
- include sample queries/use cases
- collect product usage metrics
- prioritize improvements based on consumer value

## Review guidance

Codex should ask:

- Who consumes this product?
- How does producer know consumers are not broken?
- Is there feedback/support?
- Are consumer expectations documented?
- How are breaking changes handled?
- Are consumers using the product as intended?

## Testing / verification guidance

Codex should recommend:

- consumer contract tests
- consumer query regression tests
- schema compatibility tests
- deprecation/migration tests
- product usage tracking
- support/incident routing tests

## Tradeoffs and cautions

Unknown consumers can make change impossible. Codex should encourage registration/discovery of consumers without making experimentation too hard.

## Example transformation

**Before:**

```text
Billing changes payment_status values. Enrollment dashboard silently misclassifies payments.
```

**After:**

```text
Payment Data Product tracks Enrollment dashboard as consumer.
Contract tests validate status values.
Breaking semantic changes require version bump and migration notice.
```

## Distilled skill rule

Track and manage producer-consumer relationships for data products through contracts, feedback, support, compatibility tests, and deprecation processes.

---

# 20. Data Mesh and Domain Events Are Related but Not Identical

## Core teaching

Domain events can be useful sources for data products, but Data Mesh is not simply event streaming. Events may represent operational facts, while data products must be curated, documented, governed, and consumer-oriented.

The engineering behavior being taught is:

```text
Do not confuse raw event streams with finished data products.
```

For Codex, this matters when designing event-driven systems that also serve analytics.

## Codex trigger

Apply this when Codex is:

- publishing domain events
- using Kafka/event streams for analytics
- creating event-sourced data products
- designing streaming pipelines
- exposing operational events to consumers
- building real-time dashboards
- replacing batch pipelines with streams

## Signals and smells

Codex should notice:

- raw events exposed as product without docs
- event schema reflects internal implementation
- consumers must reconstruct business meaning
- no event versioning
- no replay policy
- no quality/freshness contract
- events lack keys/correlation/time semantics
- consumers depend on unstable event fields
- no curated analytical view over events

## Desired Codex behavior

Codex should distinguish:

```text
domain event: fact that something happened in domain
raw stream: transport/log of events
data product: curated, documented, governed consumer-facing data
```

Events can feed data products, but they are not automatically data products.

## Implementation guidance

Codex should:

- design event schemas as contracts if consumed
- version events
- include event time, producer, key, correlation ID
- document semantics
- create curated data products over raw streams
- add quality/replay/idempotency handling
- define retention and replay policy
- avoid leaking internal state changes as public events
- expose aggregated/curated views for BI consumers

## Review guidance

Codex should ask:

- Is this event intended for external consumers?
- Is it stable and documented?
- Is the raw stream usable as a product?
- Do consumers need curated model instead?
- Is replay/retention defined?
- Are event schema changes compatible?
- Are events idempotent/order-aware for consumers?

## Testing / verification guidance

Codex should recommend:

- event schema contract tests
- compatibility tests
- replay tests
- duplicate/out-of-order tests
- curated product reconciliation tests
- stream freshness/lag tests
- consumer contract tests

## Tradeoffs and cautions

Some event streams can be data products if they meet product contract, documentation, quality, access, and support standards. But most raw operational streams need curation before broad analytics use.

## Example transformation

**Before:**

```text
Enrollment publishes raw database change events and calls them the Registration Data Product.
```

**After:**

```text
Enrollment publishes:
- RegistrationSubmitted domain event for event consumers
- RegistrationApplications Data Product as curated table/API with stable schema, history, quality checks, and docs
```

## Distilled skill rule

Raw domain events can feed data products, but only curated, documented, governed, and supported event/data interfaces should be treated as products.

---

# 21. Data Mesh Requires Clear Readiness Criteria

## Core teaching

A dataset should not be considered a published data product until it meets readiness criteria. Readiness should include ownership, contract, documentation, quality, security, discoverability, and operational support.

The engineering behavior being taught is:

```text
Define “done” for a data product before publishing it to consumers.
```

For Codex, this provides a checklist-like operational rule.

## Codex trigger

Apply this when:

- user asks to create a data product
- dataset is being published
- domain product is going to catalog
- consumers will depend on a dataset
- pipeline is moving from experimental to production
- reviewing data product PRs
- implementing data mesh platform templates

## Signals and smells

Codex should notice:

- table exists but no docs
- no owner
- no quality tests
- no access policy
- no catalog entry
- no version
- no support path
- no freshness status
- no contract
- consumers already depend on experimental data
- product marked production before validation

## Desired Codex behavior

Codex should require readiness checks before publication.

Readiness checklist:

```text
domain owner assigned
consumer use case known
contract/schema defined
grain/entity meaning documented
field definitions documented
quality tests pass
freshness target defined
access policy defined
sensitive fields classified
lineage/source documented
sample query/example provided
version/deprecation policy stated
support/issue path exists
observability/health status available
```

## Implementation guidance

Codex should:

- create data product spec template
- enforce readiness in CI/platform
- block production catalog publication if critical metadata missing
- allow draft/experimental status for incomplete products
- mark quality/freshness status visibly
- include operational owner and alert routing
- provide migration/deprecation rules

## Review guidance

Codex should ask:

- Is this product production-ready?
- What readiness criteria are missing?
- Is it draft, experimental, or published?
- Are consumers safe to rely on it?
- Does it have owner/support?
- Does the platform enforce these checks?

## Testing / verification guidance

Codex should recommend:

- readiness checklist tests
- metadata completeness tests
- quality/freshness tests
- access policy tests
- catalog publication tests
- sample query tests
- alert routing tests
- versioning/deprecation tests

## Tradeoffs and cautions

Readiness should not block experimentation. Codex should support draft/experimental products with clear warnings and lower guarantees.

## Example transformation

**Before:**

```text
A domain publishes table `registrations_v5` to shared warehouse. Consumers start using it, but quality and freshness are unknown.
```

**After:**

```text
Product lifecycle:
Draft: internal exploration.
Candidate: contract/docs/quality checks added.
Published: readiness checklist passes and catalog status visible.
Deprecated/Retired: managed lifecycle.
```

## Distilled skill rule

A data product is not production-ready until ownership, contract, docs, quality, freshness, security, lineage, support, and versioning are defined.

---

# 22. Senior Engineering Judgment from _Data Mesh_

## Core teaching

The deeper lesson is that scalable data architecture is not achieved by centralizing everything or decentralizing everything. It requires distributing ownership to domains while centralizing reusable platform capabilities and enforcing global governance computationally.

Codex should internalize this:

```text
Scale data value by making domain teams accountable for trustworthy data products, enabled by self-serve platforms and constrained by federated automated governance.
```

## Codex trigger

Apply broadly when Codex is working on:

- data architecture strategy
- data platform design
- cross-domain analytics
- data product design
- domain ownership
- BI/data warehouse scaling
- data governance automation
- data contract design
- data catalog design
- organizational data bottlenecks

## Signals and smells

Codex should notice:

- central data team bottleneck
- no domain ownership
- datasets with no owner/docs/quality
- raw tables exposed as products
- no self-serve platform
- governance is manual or absent
- data products cannot interoperate
- consumers do not know whom to contact
- schema changes break consumers
- sensitive data published broadly
- Data Mesh used as tool buzzword
- full mesh applied to a small/simple system

## Desired Codex behavior

Codex should:

- evaluate whether Data Mesh is appropriate
- identify domain-owned data products
- define product contracts
- require product readiness
- design self-serve platform capabilities
- automate governance checks
- support discoverability/cataloging
- ensure interoperability across products
- include security/access in product contract
- manage lifecycle/versioning
- start incrementally with pilots
- avoid cargo-culting

## Implementation guidance

Codex should:

- create data product spec templates
- add metadata/catalog requirements
- add schema contract tests
- add quality/freshness checks
- define owner/domain/support metadata
- define access policy and sensitivity tags
- add CI/CD governance checks
- define product versioning/deprecation
- create platform golden paths
- define consumer contract tests
- build pilot products before broad rollout

## Review guidance

Codex should check:

- Does this dataset have a domain owner?
- Is it a true product or an internal table?
- Is the contract clear?
- Are consumers known?
- Are quality and freshness visible?
- Is security included?
- Does it interoperate with other products?
- Are governance rules automated?
- Is the platform enabling self-service?
- Is Data Mesh justified at this scale?

## Testing / verification guidance

Codex should recommend:

- data product readiness tests
- metadata completeness checks
- schema contract tests
- quality/freshness tests
- access-control and masking tests
- catalog publication tests
- interoperability tests
- consumer-driven contract tests
- deprecation/migration tests
- platform golden-path tests
- governance policy-as-code tests

## Tradeoffs and cautions

Data Mesh is powerful but expensive. It requires organizational readiness, domain accountability, platform maturity, and governance automation. Codex should not recommend full Data Mesh for a small project that only needs a clean warehouse, mart, or reporting layer.

But Codex can still borrow lightweight principles:

```text
owner
contract
quality tests
catalog docs
access policy
consumer support
versioning
```

## Example transformation

**Before:**

```text
A company has a central warehouse team. Domains dump raw data into the lake. The central team builds all reports. Consumers do not trust the data. Governance is manual. Sensitive fields are inconsistently protected.
```

**After:**

```text
Data Mesh approach:
- Enrollment owns Registration Data Product.
- Billing owns Payment Data Product.
- Platform provides templates, CI, metadata catalog, lineage, access control, quality checks.
- Federated governance defines required metadata, PII classification, contract compatibility, freshness declarations.
- Consumers discover products and see quality/freshness status.
- Breaking changes are versioned and tested against consumers.
```

## Distilled skill rule

Use Data Mesh to scale data value by combining domain-owned data products, self-serve platform capabilities, and automated federated governance—only when organizational scale justifies it.

---

# Compression Candidates for Future `SKILL.md`

These are candidate rules to compress into a future Codex skill:

```text
When centralized data delivery becomes a bottleneck, shift analytical data ownership toward accountable domain teams while retaining shared platform and governance standards.
```

```text
Assign analytical data ownership to the domain that understands and produces the data, and make that owner accountable for meaning, quality, and contract evolution.
```

```text
Publish consumer-facing data as a product with owner, contract, documentation, quality, freshness, access, lineage, examples, and support.
```

```text
Expose published data through explicit contracts with schema, semantics, quality, freshness, access, and versioning guarantees.
```

```text
Centralize reusable platform capabilities so domain teams can publish governed data products without custom infrastructure work each time.
```

```text
Use federated governance with automated policy checks to balance domain autonomy with global interoperability, security, and quality standards.
```

```text
A published data product must be discoverable and addressable through stable naming, catalog metadata, documentation, access rules, and examples.
```

```text
Every published data product should expose quality, freshness, contract, and reliability status to producers and consumers.
```

```text
Decentralized data products must conform on shared identity, time, reference data, and semantics when cross-domain analysis depends on them.
```

```text
Manage data products with lifecycle states, compatibility rules, versioning, deprecation, migration guidance, and consumer impact checks.
```

```text
Design data products around consumer value, usability, reliability, documentation, feedback, and domain-owned semantics.
```

```text
Treat Data Mesh as a sociotechnical architecture requiring domain ownership, product thinking, self-serve platform, and federated computational governance.
```

```text
Adopt Data Mesh incrementally through high-value pilot data products that test ownership, platform, governance, and consumer value.
```

```text
Define data product boundaries around coherent domain capabilities and ownership, not around source tables or technical pipelines.
```

```text
Enforce repeatable data governance rules in CI/CD and platform workflows instead of relying only on manual review.
```

```text
Include sensitivity classification, access rules, masking, audit, retention, and export policy in every data product contract.
```

```text
Data Mesh changes ownership, product design, platform self-service, and governance; it does not require abandoning warehouses, lakes, or shared infrastructure.
```

```text
Do not apply full Data Mesh unless domain scale, ownership capacity, and centralized bottlenecks justify it; borrow lightweight principles when simpler architecture is enough.
```

```text
Track and manage producer-consumer relationships for data products through contracts, feedback, support, compatibility tests, and deprecation processes.
```

```text
Raw domain events can feed data products, but only curated, documented, governed, and supported event/data interfaces should be treated as products.
```

```text
A data product is not production-ready until ownership, contract, docs, quality, freshness, security, lineage, support, and versioning are defined.
```

```text
Use Data Mesh to scale data value by combining domain-owned data products, self-serve platform capabilities, and automated federated governance—only when organizational scale justifies it.
```
