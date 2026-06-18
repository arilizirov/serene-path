# Extracted Codex-Skill Training Material
## Source: _The Data Warehouse Toolkit: The Definitive Guide to Dimensional Modeling_ — Ralph Kimball & Margy Ross

This is raw source-extraction material for a future Codex skill. It is not the final `SKILL.md`.

This extraction is intentionally written as **operational guidance for an AI coding agent**, not as a human-facing book summary.

Primary engineering domains:

```text
data architecture
analytics architecture
dimensional modeling
data warehousing
business intelligence
data modeling
data engineering
senior engineering judgment
product engineering
```

Secondary domains:

```text
database design
testing
data quality
performance
governance
maintainability
architecture
```

Core source angle:

```text
Design analytical data structures around business processes, measurable facts, descriptive dimensions, clear grain, conformed dimensions, and queryable schemas that business users and BI tools can understand.
```

Important note for Codex extraction:

```text
This source is not primarily about OLTP application schemas. It is about analytical modeling: star schemas, dimensional marts, facts, dimensions, grains, slowly changing dimensions, conformed dimensions, and data warehouse usability.
```

---

# 1. Model Around Business Processes, Not Source Systems

## Core teaching

The central teaching is that dimensional models should be organized around business processes, not around operational source systems, departments, screens, or application tables.

The engineering behavior being taught is:

```text
Start analytical design from the business event/process being measured.
```

Examples of business processes:

```text
order placed
payment received
student registered
class attended
shipment delivered
invoice issued
support ticket resolved
product sold
website session started
```

For Codex, this means that when asked to design analytics or reporting data, it should not simply copy the application database into a reporting schema. It should identify the measurable business process first.

## Codex trigger

Apply this when Codex is:

- designing a data warehouse
- designing a reporting schema
- creating analytics tables
- building dashboards
- creating BI models
- creating materialized reporting views
- transforming operational data for analysis
- designing ETL/ELT pipelines
- asked to “make reports easier”
- asked to “create a data mart”
- asked to model business metrics

## Signals and smells

Codex should notice:

- reporting schema mirrors the OLTP database table-for-table
- fact tables named after source systems instead of business events
- dashboard queries join many operational tables directly
- reports are organized by department rather than process
- business users cannot explain what a table represents
- table names reflect application screens, not measurable events
- metrics are calculated differently in different reports
- source-system structure leaks into analytics model
- BI queries require deep knowledge of application internals

## Desired Codex behavior

Codex should identify the business process being measured before proposing tables.

It should ask:

```text
What business event/process is this report measuring?
What is the measurable activity?
Who cares about it?
At what level of detail should it be recorded?
What descriptive context is needed to analyze it?
```

Codex should design around events and measurements, not around existing table structure.

## Implementation guidance

When writing or modifying code/schema, Codex should:

- identify the process/event as the candidate fact table
- name analytical tables using business language
- avoid direct copies of OLTP schemas unless used as staging
- create a fact table for measurable events
- attach descriptive dimensions for analysis
- keep staging/source ingestion separate from presentation marts
- create clear mappings from source systems into dimensional model
- document business process definition and metric meaning

## Review guidance

Codex should ask:

- What business process does this model represent?
- Is this a reporting model or just a copy of source tables?
- Can a business user understand the table’s purpose?
- Are metrics tied to a process?
- Are source-system implementation details leaking into the mart?
- Can this model answer common business questions without complex operational joins?

## Testing / verification guidance

Codex should recommend:

- source-to-target mapping tests
- row-count reconciliation by business process
- metric reconciliation against trusted reports
- business-user validation of definitions
- dashboard query tests against realistic use cases
- tests that source-system schema changes do not leak into dimensional marts unintentionally

## Tradeoffs and cautions

Sometimes a near-source operational data store or staging layer should resemble source systems. But the dimensional presentation layer should be modeled around business processes, not source tables.

For small internal apps, a simple reporting view may be enough. Do not build a warehouse unless the reporting needs justify it.

## Example transformation

**Before:**

```text
Reporting schema:
students_report
parents_report
classes_report
payments_report

Each table mirrors app tables.
Dashboard joins everything manually.
```

**After:**

```text
Business processes:
student_registration_fact
payment_fact
class_attendance_fact

Dimensions:
student_dim
family_dim
class_dim
school_year_dim
date_dim
payment_method_dim

Reports query business events and descriptive dimensions.
```

## Distilled skill rule

Design analytical models around measurable business processes, not around source-system table structure.

---

# 2. Declare the Grain First

## Core teaching

The grain is the exact meaning of one row in a fact table. Declaring the grain is the most important dimensional modeling decision because it determines what facts belong in the table, what dimensions can attach, and how queries aggregate.

The engineering behavior being taught is:

```text
Before choosing facts or dimensions, define exactly what one row means.
```

For Codex, this is a critical rule. Many reporting schemas fail because the grain is ambiguous.

## Codex trigger

Apply this when Codex is:

- designing fact tables
- creating reporting tables
- modeling events
- building dashboards
- writing aggregations
- combining metrics
- designing ETL transformations
- creating materialized views
- debugging double-counting
- creating metrics definitions

## Signals and smells

Codex should notice:

- table mixes one row per order and one row per order line
- totals are duplicated across detail rows
- fact table contains mixed event types
- measures cannot be summed safely
- dashboard counts are inflated
- dimensions do not apply to all rows
- some rows represent transactions and others represent snapshots
- grain is not documented
- developers say “this table has sales data” without row definition
- same metric gives different numbers depending on query

## Desired Codex behavior

Codex should always declare grain before designing facts/dimensions.

It should write:

```text
Grain: one row per [business event] at [level of detail].
```

Examples:

```text
one row per invoice line
one row per payment transaction
one row per student registration application
one row per student per class per school day
one row per product per store per day snapshot
```

Codex should reject or restructure designs with mixed grain.

## Implementation guidance

Codex should:

- define the row-level event/entity explicitly
- choose the lowest practical grain needed for analysis
- avoid storing header-level totals in line-level fact rows unless carefully handled
- create separate fact tables for different grains
- document grain in schema comments/docs
- ensure every dimension applies at the declared grain
- ensure facts are valid at the declared grain
- aggregate from detailed grain into summaries when needed

## Review guidance

Codex should ask:

- What does one row represent?
- Is the grain atomic or aggregated?
- Are multiple grains mixed in one table?
- Do all facts apply to this grain?
- Do all dimensions apply to this grain?
- Will queries double-count?
- Can this table be safely aggregated?

## Testing / verification guidance

Codex should recommend:

- grain uniqueness tests
- primary/natural key tests for the declared grain
- duplicate row tests
- aggregation reconciliation from detailed facts to known totals
- tests for double-counting risk
- row-count tests by event/source
- BI query tests validating expected totals

## Tradeoffs and cautions

Atomic grain is usually best for flexibility, but storing atomic detail may increase size and cost. Summary fact tables can be useful, but should be derived from detailed fact tables and clearly labeled as aggregated grain.

Do not combine transaction, periodic snapshot, and accumulating snapshot grains in one table.

## Example transformation

**Before:**

```text
student_registration_fact contains:
- one row per student registration
- one row per family payment summary
- one row per class yearly total
```

**After:**

```text
Separate fact tables:
student_registration_fact
Grain: one row per student registration application.

payment_transaction_fact
Grain: one row per payment transaction.

class_yearly_snapshot_fact
Grain: one row per class per school year snapshot.
```

## Distilled skill rule

Declare the fact table grain before choosing facts or dimensions; never mix multiple grains in one fact table.

---

# 3. Separate Facts from Dimensions

## Core teaching

Facts are numeric measurements or event counts. Dimensions are descriptive context used to filter, group, label, and slice facts.

The engineering behavior being taught is:

```text
Keep measurements and descriptive context separate so analytics remain clear and queryable.
```

For Codex, this means distinguishing “what happened/how much” from “who/what/where/when/how.”

## Codex trigger

Apply this when Codex is:

- designing star schemas
- defining analytics tables
- creating dashboard datasets
- writing metric pipelines
- deciding table columns
- reviewing reporting models
- debugging unclear BI models

## Signals and smells

Codex should notice:

- fact table filled with many descriptive text columns
- dimensions contain additive measures
- dimensions store event-level transaction amounts
- facts are stored as strings/categories
- low-cardinality labels repeatedly stored in facts
- BI users cannot tell which fields are measures
- metrics calculated from dimension attributes inconsistently
- measure names mixed with dimension names

## Desired Codex behavior

Codex should classify every column:

```text
Fact: measurable numeric value at the grain.
Dimension key: foreign key to descriptive context.
Degenerate dimension: identifier stored in fact without separate dimension.
Audit/metadata column: operational lineage.
```

Codex should avoid mixing facts and dimensions without reason.

## Implementation guidance

Codex should:

- put numeric additive/semi-additive/non-additive measures in fact tables
- put descriptive attributes in dimension tables
- use surrogate keys for dimensions where appropriate
- store natural transaction identifiers as degenerate dimensions when useful
- avoid bloated fact tables full of repeated descriptions
- avoid dimensions containing event measurements
- document each fact’s additivity and meaning
- document dimension attribute definitions

## Review guidance

Codex should ask:

- Is this column a measurement or descriptor?
- Does this measure belong at the fact grain?
- Is this descriptor better placed in a dimension?
- Can the measure be summed safely?
- Is this identifier a degenerate dimension?
- Are business users able to identify measures vs filters?

## Testing / verification guidance

Codex should recommend:

- schema tests ensuring required dimension keys exist
- fact measure null/range tests
- dimension attribute validity tests
- referential integrity tests between facts and dimensions
- aggregate tests for additive measures
- semantic metric tests against expected business definitions

## Tradeoffs and cautions

Some descriptive fields may be stored in fact tables as degenerate dimensions, especially transaction numbers, invoice numbers, order IDs, or application IDs. This is acceptable when a separate dimension would add no value.

Not every numeric column is a fact; numeric codes may be dimension attributes.

## Example transformation

**Before:**

```text
payment_report table:
payment_id
student_name
parent_name
class_name
school_name
payment_method_name
amount
discount
city
teacher_name
```

**After:**

```text
payment_fact:
payment_id              -- degenerate dimension
date_key
student_key
family_key
class_key
payment_method_key
amount
discount_amount

student_dim:
student_key
student_name
gender
age_band
...

class_dim:
class_key
class_name
teacher_name
school_name
...
```

## Distilled skill rule

Put measurable values in fact tables and descriptive context in dimensions, with each column’s role explicit.

---

# 4. Prefer Atomic Fact Tables for Flexibility

## Core teaching

Dimensional models are most flexible when fact tables are stored at the lowest practical level of detail, often called atomic grain. Aggregates can be derived later, but lost detail cannot be recovered.

The engineering behavior being taught is:

```text
Capture detailed business events once, then aggregate them many ways.
```

For Codex, this means not creating only pre-aggregated reporting tables unless the use case is truly narrow.

## Codex trigger

Apply this when Codex is:

- designing analytics storage
- building reporting marts
- creating dashboard summaries
- modeling transaction data
- creating ETL pipelines
- planning aggregates/materialized views
- resolving metric flexibility issues

## Signals and smells

Codex should notice:

- only monthly totals stored
- report cannot drill down
- changing grouping requires pipeline rewrite
- detail exists in source but is discarded early
- aggregate table mixes business rules with storage
- dashboard-specific table becomes source of truth
- users request new slice but data lacks detail
- summary numbers cannot be reconciled to transactions

## Desired Codex behavior

Codex should preserve atomic event detail when feasible and create aggregate tables as derived performance layers.

It should ask:

```text
What is the lowest useful grain?
What future slices/drilldowns may be needed?
Can we derive this summary from detail?
What detail can be safely discarded?
```

## Implementation guidance

Codex should:

- load fact tables at atomic grain when practical
- create aggregate/materialized tables from atomic facts
- document summary table grain clearly
- avoid using aggregate tables as the only truth when detail exists
- support drill-through from aggregates to detail where useful
- optimize with partitions/indexes/materialized views rather than discarding detail too early
- keep raw/staging data if reprocessing may be needed

## Review guidance

Codex should ask:

- Is this fact table atomic or summarized?
- Can users drill down?
- Can this summary be recalculated?
- Is detail discarded too early?
- What queries become impossible?
- Does storage/performance justify aggregation-only design?

## Testing / verification guidance

Codex should recommend:

- reconciliation of aggregate tables to atomic facts
- row-count tests by grain
- drill-through tests
- summary refresh tests
- tests proving aggregate rebuild works
- tests for partition completeness

## Tradeoffs and cautions

Atomic detail can be expensive in very high-volume systems. Codex may recommend summary facts, sampling, partitioning, or retention policies when storage/cost/performance constraints require it.

But the tradeoff should be explicit.

## Example transformation

**Before:**

```text
monthly_revenue table stores one row per month.
No transaction-level payment fact is kept.
```

**After:**

```text
payment_transaction_fact stores one row per payment.
monthly_revenue_summary is derived from payment_transaction_fact.
```

## Distilled skill rule

Store facts at the lowest practical grain and derive aggregates from detailed facts when possible.

---

# 5. Use Star Schemas for Usable Analytics

## Core teaching

Star schemas organize data into central fact tables surrounded by descriptive dimensions. They are designed for understandable, performant, business-friendly analytics.

The engineering behavior being taught is:

```text
Optimize the analytics presentation layer for queryability and business comprehension.
```

For Codex, this means not forcing BI users to navigate highly normalized operational schemas.

## Codex trigger

Apply this when Codex is:

- designing BI/reporting schemas
- creating dashboards
- building semantic layers
- modeling data marts
- improving report performance
- simplifying analytics queries
- creating tables for non-engineer analysts

## Signals and smells

Codex should notice:

- BI queries require 12+ joins across normalized OLTP tables
- analysts need engineering help for every report
- reporting model is hard to understand
- same dimensions repeated inconsistently
- queries are slow due to operational normalization
- metrics duplicated in dashboards
- table structure reflects application internals rather than business concepts

## Desired Codex behavior

Codex should design a dimensional presentation layer:

```text
fact table at declared grain
dimension tables with descriptive attributes
surrogate keys where appropriate
conformed dimensions across processes
clear metric definitions
business-friendly names
```

## Implementation guidance

Codex should:

- create fact tables for business processes
- create dimensions for who/what/where/when/how context
- flatten descriptive dimension attributes for ease of query
- avoid excessive snowflaking unless justified
- use meaningful column names
- document fact grain and dimension definitions
- build views/semantic model if physical tables cannot change

## Review guidance

Codex should ask:

- Can a BI user understand this schema?
- Are facts and dimensions clear?
- Are common queries simple?
- Is snowflaking adding value or complexity?
- Are dimensions conformed across facts?
- Does the star schema reflect business processes?

## Testing / verification guidance

Codex should recommend:

- dashboard query tests
- metric reconciliation tests
- dimension key integrity tests
- BI usability review
- query performance tests
- semantic model tests if using dbt/BI layer

## Tradeoffs and cautions

Star schemas are for analytical workloads, not necessarily transactional application writes. Do not replace normalized OLTP schemas with star schemas for core operations.

Snowflake dimensions can reduce redundancy but often make analytics harder. Use them intentionally.

## Example transformation

**Before:**

```text
Dashboard query joins:
students → families → addresses → registrations → classes → teachers → school_years → payments → payment_methods
```

**After:**

```text
registration_fact joins directly to:
student_dim
family_dim
class_dim
date_dim
school_year_dim

payment_fact joins directly to:
student_dim
family_dim
payment_method_dim
date_dim
```

## Distilled skill rule

Use star schemas in analytical presentation layers so business users can query facts by clear descriptive dimensions.

---

# 6. Conformed Dimensions Create Enterprise Consistency

## Core teaching

Conformed dimensions are shared dimensions used consistently across multiple fact tables and business processes. They allow metrics from different processes to be compared and combined correctly.

The engineering behavior being taught is:

```text
Use shared dimensions to make cross-process analytics consistent.
```

For Codex, this means that if payments, registrations, attendance, and billing all refer to students, school years, dates, classes, or families, those dimensions should be conformed where possible.

## Codex trigger

Apply this when Codex is:

- designing multiple data marts
- combining dashboards across processes
- creating enterprise metrics
- modeling shared entities
- integrating facts from different source systems
- designing semantic layer
- resolving inconsistent filters across reports

## Signals and smells

Codex should notice:

- each mart has its own incompatible student dimension
- school year means different things in different reports
- date filters produce inconsistent totals
- class names/codes differ across facts
- department-specific definitions conflict
- dashboards cannot combine metrics
- same entity has different keys/attributes in each mart
- business users argue about whose number is right

## Desired Codex behavior

Codex should identify candidate conformed dimensions and standardize them.

Candidate conformed dimensions:

```text
date
student/customer/user
family/account
product
class/course
school/location
employee/teacher
school year/period
organization
payment method
```

## Implementation guidance

Codex should:

- define shared dimension tables or semantic models
- standardize keys and core attributes
- document attribute definitions
- map source-system identifiers into conformed dimension keys
- handle source-specific attributes carefully
- use conformed dimensions across fact tables
- create governance/ownership for shared dimensions
- avoid creating local duplicate dimensions unless necessary

## Review guidance

Codex should ask:

- Which dimensions are shared across processes?
- Are definitions consistent?
- Can facts be joined/sliced using the same dimension?
- Who owns the dimension?
- How are source keys mapped?
- Are local variants justified?
- Does this enable cross-process reporting?

## Testing / verification guidance

Codex should recommend:

- conformance tests across marts
- uniqueness tests on business/natural keys
- source-to-dimension mapping tests
- referential integrity tests
- attribute consistency tests
- cross-fact dashboard reconciliation tests

## Tradeoffs and cautions

Conformed dimensions require coordination and governance. Over-centralization can slow teams. Some local dimensions may be appropriate when meanings genuinely differ.

Codex should not force conformance when two concepts are only superficially similar.

## Example transformation

**Before:**

```text
registration_student_dim
payment_student_dim
attendance_student_dim

Each has different student ID, name format, class attribute, and status.
```

**After:**

```text
student_dim is conformed:
student_key
student_natural_id
name
date_of_birth
current_status
...

registration_fact, payment_fact, and attendance_fact all reference student_key.
```

## Distilled skill rule

Use conformed dimensions for shared business entities so facts from different processes can be compared consistently.

---

# 7. Date Dimensions Are First-Class Analytical Infrastructure

## Core teaching

Date dimensions are fundamental in dimensional models. Almost every business process has dates, and a rich date dimension makes time-based analysis consistent and simple.

The engineering behavior being taught is:

```text
Use a standard date dimension instead of scattering date logic across reports.
```

For Codex, this prevents every dashboard from reimplementing fiscal periods, weekdays, holidays, school years, months, quarters, and relative date logic.

## Codex trigger

Apply this when Codex is:

- designing fact tables with dates
- building time-series reports
- creating dashboards
- adding fiscal/school-year reporting
- calculating week/month/quarter/year
- implementing date filters
- comparing periods

## Signals and smells

Codex should notice:

- reports calculate month/week/year separately
- inconsistent fiscal period logic
- hardcoded date ranges in dashboards
- school year logic duplicated
- no holiday/weekend attributes
- date stored only as timestamp without reporting context
- timezone/calendar ambiguity
- multiple facts use incompatible date handling

## Desired Codex behavior

Codex should recommend a shared date dimension with useful calendar attributes.

Possible attributes:

```text
date_key
full_date
day_of_week
day_name
week_start_date
month
month_name
quarter
year
fiscal_period
school_year
is_weekend
is_holiday
is_school_day
```

## Implementation guidance

Codex should:

- create/populate date dimension covering needed range
- reference date dimension from facts using date keys
- include multiple role-playing date keys where needed
- define fiscal/school-year logic centrally
- avoid hardcoding date logic in each report
- document timezone/date semantics
- support local business calendar needs

## Review guidance

Codex should ask:

- What dates are important for this process?
- Are there multiple date roles?
- Is calendar logic centralized?
- Are fiscal/school-year definitions consistent?
- Does timezone matter?
- Are reports duplicating date logic?

## Testing / verification guidance

Codex should recommend:

- date dimension completeness tests
- fiscal/school-year mapping tests
- holiday/school-day tests
- role-playing date key integrity tests
- period aggregation tests
- timezone boundary tests where relevant

## Tradeoffs and cautions

For very small/simple reports, a date dimension may feel heavy. But once multiple reports need time grouping, fiscal calendars, or business calendars, it is high leverage.

## Example transformation

**Before:**

```text
Each report calculates school year:
if month >= 9 then year + "/" + (year+1)
else (year-1) + "/" + year
```

**After:**

```text
date_dim includes school_year attribute.
All facts join to date_dim for consistent school-year reporting.
```

## Distilled skill rule

Centralize calendar, fiscal, and business-period logic in a shared date dimension.

---

# 8. Use Role-Playing Dimensions for Multiple Contexts

## Core teaching

The same dimension can play different roles in a fact table. For example, an order may have order date, ship date, delivery date, and cancellation date, all referring to the date dimension.

The engineering behavior being taught is:

```text
Reuse conformed dimensions with clear role names when the same entity appears in multiple contexts.
```

For Codex, this prevents duplicate dimensions and unclear date/entity semantics.

## Codex trigger

Apply this when Codex sees:

- multiple dates in one fact
- multiple people/entities in different roles
- same dimension used as buyer/seller/approver/teacher
- same location used as origin/destination
- same organization used as payer/provider
- confusing joins to the same dimension

## Signals and smells

Codex should notice:

- separate duplicate date tables for order/ship/delivery
- columns named `date_key1`, `date_key2`
- unclear role names
- same person dimension duplicated for parent/teacher/secretary without reason
- queries confusing which date/entity is used
- role-specific attributes mixed into shared dimension incorrectly

## Desired Codex behavior

Codex should use role-playing dimension keys with clear names.

Examples:

```text
registration_date_key
approval_date_key
cancellation_date_key

student_key
primary_parent_key
created_by_staff_key
approved_by_staff_key

origin_location_key
destination_location_key
```

## Implementation guidance

Codex should:

- reference the same conformed dimension multiple times under role-specific foreign keys
- use clear role names
- create semantic views/aliases if BI tool needs friendly names
- avoid duplicating dimension tables unnecessarily
- document each role’s meaning
- ensure role-specific date/entity fields apply at the fact grain

## Review guidance

Codex should ask:

- Is this the same dimension in different roles?
- Are role names clear?
- Are duplicate dimensions unnecessary?
- Does each role apply to every fact row?
- Are BI users likely to confuse roles?
- Should views alias dimensions for clarity?

## Testing / verification guidance

Codex should recommend:

- referential integrity tests for each role key
- role completeness/nullability tests
- BI query tests for each role
- documentation/semantic layer checks
- period aggregation tests by each date role

## Tradeoffs and cautions

If roles have genuinely different attributes or meanings, separate dimensions may be justified. But duplicate dimensions should not be created merely because the same entity appears in multiple roles.

## Example transformation

**Before:**

```text
registration_fact:
date_key
date_key_2
date_key_3
```

**After:**

```text
registration_fact:
submitted_date_key
approved_date_key
cancelled_date_key
```

All three reference `date_dim`.

## Distilled skill rule

Use role-playing dimensions with explicit role names when the same dimension appears in multiple contexts.

---

# 9. Slowly Changing Dimensions Need Explicit History Strategy

## Core teaching

Dimensions change over time. The dimensional model must decide whether to overwrite attributes, preserve history, or track current and historical values differently.

The engineering behavior being taught is:

```text
Choose dimension change behavior deliberately based on reporting needs.
```

Common patterns:

```text
Type 1: overwrite old value
Type 2: create new dimension row to preserve history
Type 3 / limited alternatives: preserve limited prior value
```

For Codex, this means not casually updating dimension records and destroying history when reports need historical truth.

## Codex trigger

Apply this when Codex is:

- modeling dimensions
- loading customer/student/product/class/employee dimensions
- handling status changes
- changing descriptive attributes
- designing historical reports
- creating ETL merge logic
- answering “as of” reporting questions

## Signals and smells

Codex should notice:

- dimension attributes overwritten with no history decision
- reports need historical classification
- student changes class/status/address
- product category changes
- customer segment changes
- employee department changes
- old reports change when dimension attributes update
- no effective dates/current flag
- source updates treated as simple overwrite

## Desired Codex behavior

Codex should classify each dimension attribute by change strategy.

It should ask:

```text
Should reports show the value as it was at event time?
Should corrections overwrite history?
Should current attributes be available separately?
Is the change a true historical change or data correction?
```

## Implementation guidance

Codex should:

- define SCD strategy per dimension/attribute
- use Type 1 for corrections or attributes where history is irrelevant
- use Type 2 for historical reporting attributes
- add effective_start_date/effective_end_date/current_flag for Type 2
- use surrogate keys so facts bind to the correct historical dimension row
- avoid updating Type 2 rows in place except to close effective period
- maintain natural/business key mapping
- document attributes and SCD behavior

## Review guidance

Codex should ask:

- Which attributes change?
- Does historical reporting need old values?
- Is this change a correction or a new historical state?
- Do facts reference surrogate dimension keys?
- Are effective dates/current flags correct?
- Can current and historical reporting both be supported?

## Testing / verification guidance

Codex should recommend:

- Type 2 versioning tests
- effective date range tests
- current flag uniqueness tests
- no-overlapping-version tests
- source change merge tests
- fact-to-dimension historical lookup tests
- historical report reconciliation tests

## Tradeoffs and cautions

Type 2 dimensions increase table size and query complexity. Do not track history for every attribute blindly. Choose history strategy based on business reporting needs.

## Example transformation

**Before:**

```text
student_dim:
student_key
student_id
current_class

ETL overwrites current_class whenever student moves.
Old registration reports now show new class.
```

**After:**

```text
student_dim Type 2:
student_key
student_id
class
effective_start_date
effective_end_date
is_current

registration_fact stores student_key for the student version active at registration time.
```

## Distilled skill rule

For changing dimensions, explicitly choose overwrite or history tracking per attribute based on reporting requirements.

---

# 10. Surrogate Keys Protect the Dimensional Model

## Core teaching

Dimensional models often use surrogate keys for dimensions to separate warehouse identity from source-system natural keys. This supports slowly changing dimensions, multiple source systems, and historical tracking.

The engineering behavior being taught is:

```text
Do not let operational identifiers do all the work of analytical identity.
```

For Codex, this means understanding when natural keys are useful and when surrogate keys are necessary.

## Codex trigger

Apply this when Codex is:

- designing dimension tables
- integrating multiple source systems
- implementing Type 2 dimensions
- loading fact tables
- joining facts to dimensions
- resolving natural key changes
- designing conformed dimensions

## Signals and smells

Codex should notice:

- fact table joins directly to mutable source ID
- Type 2 dimension lacks surrogate key
- source IDs collide across systems
- natural key changes over time
- late-arriving facts cannot find dimension row
- dimension history impossible to represent
- fact rows change meaning when dimension is overwritten
- source system identifiers exposed as warehouse keys

## Desired Codex behavior

Codex should use surrogate keys for dimension joins where history, conformance, or source integration requires it.

It should preserve source/natural keys as attributes for traceability.

## Implementation guidance

Codex should:

- create warehouse surrogate primary key for dimensions
- store natural/business/source keys as attributes
- use surrogate keys in fact tables
- resolve dimension surrogate key during ETL/ELT load
- support Type 2 dimension row selection by business key + effective date
- handle unknown/missing dimension members
- avoid using surrogate keys as business identifiers in external contracts

## Review guidance

Codex should ask:

- Is this dimension historical?
- Can natural key change?
- Are multiple sources involved?
- Do facts need to point to historical dimension versions?
- Is natural key preserved for lineage?
- Are surrogate keys stable within warehouse?

## Testing / verification guidance

Codex should recommend:

- surrogate key uniqueness tests
- natural key mapping tests
- Type 2 lookup tests
- fact foreign key integrity tests
- unknown dimension member tests
- multiple-source collision tests
- late-arriving fact tests

## Tradeoffs and cautions

For very simple, stable, single-source dimensions, natural keys may be acceptable. But most enterprise dimensional models benefit from surrogate keys.

Do not expose warehouse surrogate keys as business meaning.

## Example transformation

**Before:**

```text
payment_fact.student_id joins to student_dim.student_id.
student_dim stores current class only.
```

**After:**

```text
payment_fact.student_key joins to student_dim.student_key.
student_dim stores:
student_key
student_id
class
effective dates
source system lineage
```

## Distilled skill rule

Use dimension surrogate keys to support history, conformance, and source-system independence; keep natural keys for lineage.

---

# 11. Fact Tables Need Additivity Awareness

## Core teaching

Not all numeric measures can be summed across all dimensions. Facts may be additive, semi-additive, or non-additive. Misunderstanding additivity causes wrong metrics.

The engineering behavior being taught is:

```text
Define how each measure can and cannot be aggregated.
```

For Codex, this prevents dashboards from summing balances, percentages, ratios, averages, and snapshots incorrectly.

## Codex trigger

Apply this when Codex is:

- designing measures
- building dashboards
- writing SQL aggregations
- defining semantic metrics
- modeling snapshots
- creating BI tables
- reviewing analytics queries
- debugging wrong totals

## Signals and smells

Codex should notice:

- balance summed across days
- percentages summed directly
- averages averaged without weighting
- inventory snapshot summed across time
- ratios stored without numerator/denominator
- semi-additive facts not documented
- BI tool treats every numeric field as sum
- dashboard totals look inflated

## Desired Codex behavior

Codex should classify each fact:

```text
Additive: can sum across all dimensions.
Semi-additive: can sum across some dimensions but not time.
Non-additive: cannot be summed directly.
```

Codex should recommend storing base components for ratios.

## Implementation guidance

Codex should:

- document additivity of each measure
- store additive components when possible
- store numerator/denominator for ratios
- avoid summing percentages
- treat balances/snapshots as semi-additive
- create semantic layer rules for aggregation
- name measures clearly
- define default aggregation behavior in BI models

## Review guidance

Codex should ask:

- Can this measure be summed?
- Across which dimensions?
- Across time?
- Is this a ratio/percentage?
- Should numerator and denominator be stored instead?
- Does BI tool aggregate this correctly?
- Are dashboard totals meaningful?

## Testing / verification guidance

Codex should recommend:

- metric aggregation tests
- semantic model aggregation tests
- ratio calculation tests
- snapshot period tests
- reconciliation to known business totals
- dashboard query validation

## Tradeoffs and cautions

Sometimes storing non-additive metrics is useful for convenience, but Codex should also store the additive base facts when accurate aggregation is needed.

## Example transformation

**Before:**

```text
class_performance_fact:
class_key
date_key
attendance_rate
```

Dashboard averages attendance_rate across classes and months incorrectly.

**After:**

```text
class_attendance_fact:
class_key
date_key
students_present_count
students_expected_count

attendance_rate = SUM(students_present_count) / SUM(students_expected_count)
```

## Distilled skill rule

Classify every measure’s additivity and store additive components for ratios, averages, balances, and snapshots.

---

# 12. Use Transaction Fact Tables for Discrete Events

## Core teaching

Transaction fact tables record individual business events at the moment they occur. They are usually sparse, atomic, and highly detailed.

The engineering behavior being taught is:

```text
Use transaction facts for discrete events that can be counted, summed, and analyzed by context.
```

Examples:

```text
sale line
payment transaction
invoice line
registration submitted
attendance recorded
shipment delivered
support ticket opened
```

## Codex trigger

Apply this when Codex models:

- sales
- payments
- invoices
- registrations
- attendance
- clicks/events
- shipments
- transactions
- audit-like business events

## Signals and smells

Codex should notice:

- event data stored only in current-state tables
- reports need event history
- transaction details overwritten by latest status
- event counts hard to compute
- facts represent multiple event types
- line/header grain mixed
- facts lack event date/context
- metrics cannot be traced to source events

## Desired Codex behavior

Codex should create transaction fact tables for discrete business events with clear grain.

## Implementation guidance

Codex should:

- define event grain
- include event date/time dimension keys
- include foreign keys to relevant dimensions
- include additive measures
- include degenerate transaction identifiers
- avoid mixing event types with different grains
- preserve atomic event detail when practical
- record source lineage/audit columns

## Review guidance

Codex should ask:

- What discrete event occurred?
- What is one row?
- What measures were captured at event time?
- What context describes the event?
- Is this event immutable or corrected later?
- Are header and line grains separated?

## Testing / verification guidance

Codex should recommend:

- event row uniqueness tests
- source event count reconciliation
- fact foreign key tests
- measure range/null tests
- duplicate transaction tests
- aggregate reconciliation to operational totals

## Tradeoffs and cautions

Some events may need updates/corrections. Codex should handle corrections explicitly rather than pretending transaction facts never change.

## Example transformation

**Before:**

```text
family_account table stores current_total_paid.
No payment event history.
```

**After:**

```text
payment_transaction_fact:
Grain: one row per payment transaction.
date_key
family_key
student_key
payment_method_key
payment_id
amount_paid
```

## Distilled skill rule

Use transaction fact tables for atomic business events, with clear grain, context dimensions, and additive measures.

---

# 13. Use Periodic Snapshot Facts for Regular State

## Core teaching

Periodic snapshot fact tables record measurements at regular intervals, such as daily, weekly, monthly, or yearly. They are useful for balances, inventory, enrollment counts, and status over time.

The engineering behavior being taught is:

```text
Use periodic snapshots when the question is “what was the state during this period?”
```

For Codex, this prevents trying to answer all state-over-time questions from transaction facts alone.

## Codex trigger

Apply this when Codex models:

- daily balances
- monthly revenue summaries
- inventory levels
- enrollment counts
- active users
- class capacity by day
- account status over time
- open tickets by day
- pipeline/backlog levels

## Signals and smells

Codex should notice:

- dashboard needs daily/monthly state
- current-state table cannot show history
- transaction facts require expensive reconstruction
- balances summed incorrectly across time
- report asks “as of date”
- metrics are semi-additive
- no consistent period grain

## Desired Codex behavior

Codex should recommend periodic snapshot facts when regular time-based state matters.

It should declare:

```text
Grain: one row per [entity] per [period].
```

Examples:

```text
one row per account per day
one row per product per store per day
one row per class per school month
one row per subscription per month
```

## Implementation guidance

Codex should:

- choose snapshot period based on reporting need
- include date/period dimension key
- include entity dimensions
- store balances/status/counts valid for period
- document semi-additive measures
- derive snapshots from transactions where possible
- test completeness of period/entity rows
- handle missing periods intentionally

## Review guidance

Codex should ask:

- What state is being measured?
- What period grain is needed?
- Are measures semi-additive?
- Can this be derived from transactions?
- Are missing snapshots meaningful?
- Will users sum this incorrectly over time?

## Testing / verification guidance

Codex should recommend:

- snapshot completeness tests
- one-row-per-entity-per-period tests
- reconciliation to source state
- period-end balance tests
- semi-additive aggregation tests
- missing snapshot detection

## Tradeoffs and cautions

Snapshots can grow large. Choose a period grain that matches real reporting needs. Do not create daily snapshots if monthly is sufficient, unless drilldown or trend needs justify it.

## Example transformation

**Before:**

```text
Dashboard calculates daily enrolled students by replaying all registrations and cancellations every time.
```

**After:**

```text
class_enrollment_daily_snapshot_fact:
Grain: one row per class per day.
class_key
date_key
active_student_count
capacity
available_seats
```

## Distilled skill rule

Use periodic snapshot facts to represent regular state over time, with clear period grain and semi-additive measure rules.

---

# 14. Use Accumulating Snapshot Facts for Lifecycle Workflows

## Core teaching

Accumulating snapshot fact tables track progress through a defined workflow with multiple milestones. One row represents a pipeline item, and milestone dates/measures are updated as the item advances.

The engineering behavior being taught is:

```text
Use accumulating snapshots when the business process has a known lifecycle with milestones.
```

Examples:

```text
order fulfillment
loan application
student registration pipeline
support ticket lifecycle
claim processing
admissions process
project delivery
```

## Codex trigger

Apply this when Codex models:

- multi-step workflows
- pipeline dashboards
- lifecycle reporting
- stage conversion
- time-between-stage metrics
- status progress
- SLA tracking
- process bottlenecks

## Signals and smells

Codex should notice:

- workflow has stages like submitted → approved → paid → completed
- users ask time between milestones
- current status table loses stage history
- many date fields appear across events
- reporting wants funnel/pipeline view
- transaction facts alone make lifecycle reporting awkward
- workflow row changes as process progresses

## Desired Codex behavior

Codex should consider an accumulating snapshot fact when a process has predictable milestones.

Typical columns:

```text
pipeline_item_key / degenerate ID
dimension keys
submitted_date_key
approved_date_key
paid_date_key
completed_date_key
current_status_key
days_to_approval
days_to_completion
```

## Implementation guidance

Codex should:

- define lifecycle grain
- identify standard milestones
- include role-playing date dimensions for milestones
- update row as milestones occur
- store durations between milestones
- handle skipped/optional stages explicitly
- preserve transaction facts separately if detailed events matter
- test update logic carefully

## Review guidance

Codex should ask:

- Does this process have predictable milestones?
- What is one lifecycle item?
- Which dates represent milestones?
- Are stages optional or repeatable?
- Is current status derivable?
- Do we also need transaction event history?
- How are late/corrected milestones handled?

## Testing / verification guidance

Codex should recommend:

- lifecycle stage transition tests
- milestone date update tests
- duration calculation tests
- skipped stage tests
- status consistency tests
- reconciliation to underlying transaction events
- one-row-per-workflow-item tests

## Tradeoffs and cautions

Accumulating snapshots are less appropriate for highly irregular workflows with many repeated/looping stages. Event logs plus derived process models may be better.

## Example transformation

**Before:**

```text
student_registration_events:
Submitted
DocumentsReceived
Approved
PaymentSetup
ClassAssigned

Dashboard recomputes lifecycle status with complex event logic.
```

**After:**

```text
student_registration_accumulating_fact:
Grain: one row per registration application.
submitted_date_key
documents_received_date_key
approved_date_key
payment_setup_date_key
class_assigned_date_key
current_registration_status_key
days_to_approval
days_to_class_assignment
```

## Distilled skill rule

Use accumulating snapshot facts for workflows with defined milestones and lifecycle-duration reporting needs.

---

# 15. Handle Degenerate Dimensions Intentionally

## Core teaching

A degenerate dimension is a dimension key or identifier stored directly in the fact table without a separate dimension table, usually because it has no meaningful descriptive attributes.

Examples:

```text
order number
invoice number
payment transaction ID
registration application ID
ticket number
claim number
```

The engineering behavior being taught is:

```text
Keep operational identifiers in fact tables when they identify events but do not need their own dimension.
```

## Codex trigger

Apply this when Codex sees:

- transaction identifiers
- invoice/order/application numbers
- operational IDs used for drill-through
- identifiers with no attributes
- proposed dimension table with only ID column
- reporting needs traceability to source transaction

## Signals and smells

Codex should notice:

- dimension table contains only `invoice_number`
- fact lacks transaction identifier for traceability
- BI users need drill-through to operational record
- operational ID treated as a measure
- ID duplicated inconsistently across facts
- no source lineage for event

## Desired Codex behavior

Codex should store degenerate identifiers directly on the fact when they are useful for traceability but do not warrant dimension attributes.

## Implementation guidance

Codex should:

- include transaction/order/invoice/application ID in fact table
- not create empty dimension tables for identifiers alone
- distinguish degenerate dimensions from surrogate dimension keys
- preserve source system identifier for lineage/drill-through
- ensure ID uniqueness rules match grain
- document degenerate dimension purpose

## Review guidance

Codex should ask:

- Does this identifier have descriptive attributes?
- Would a separate dimension add value?
- Is this needed for drill-through?
- Is it part of the fact grain?
- Is the identifier stable and unique?

## Testing / verification guidance

Codex should recommend:

- identifier uniqueness tests where applicable
- non-null tests for required transaction IDs
- source reconciliation tests
- drill-through tests
- duplicate detection tests

## Tradeoffs and cautions

If an identifier later gains descriptive attributes or relationships, a dimension may become useful. Do not overuse degenerate dimensions for rich entities like customer/student/product.

## Example transformation

**Before:**

```text
invoice_dim:
invoice_number

invoice_line_fact:
invoice_key
amount
```

**After:**

```text
invoice_line_fact:
invoice_number   -- degenerate dimension
student_key
date_key
amount
```

## Distilled skill rule

Store transaction identifiers as degenerate dimensions in fact tables when they support traceability but have no separate descriptive attributes.

---

# 16. Use Junk Dimensions for Low-Cardinality Flags

## Core teaching

Junk dimensions combine miscellaneous low-cardinality flags and indicators into a single dimension, keeping fact tables cleaner and avoiding many tiny dimensions.

The engineering behavior being taught is:

```text
Group unrelated low-cardinality indicators into a controlled descriptive dimension instead of cluttering facts.
```

Examples:

```text
is_online
is_discounted
is_late
payment_channel
document_complete_flag
manual_review_flag
```

## Codex trigger

Apply this when Codex sees:

- many boolean flags on fact table
- many tiny dimensions with few values
- miscellaneous indicators used for filtering
- fact table cluttered with status flags
- BI users need to filter by operational indicators
- flags are descriptive, not measures

## Signals and smells

Codex should notice:

- `is_x`, `has_y`, `flag_z` columns everywhere
- separate one-column dimensions for booleans
- fact table has many low-cardinality descriptors
- report filters use miscellaneous flags
- flags are not part of a coherent main dimension
- combinations of flags matter

## Desired Codex behavior

Codex should consider a junk dimension when multiple unrelated low-cardinality descriptors belong to the fact context.

## Implementation guidance

Codex should:

- identify low-cardinality descriptive flags
- create a junk dimension with combinations of values
- replace many flag columns with one junk dimension key
- ensure values are understandable
- avoid junk dimension if flags belong in a real domain dimension
- document flag definitions
- manage default/unknown combinations

## Review guidance

Codex should ask:

- Are these flags descriptive or measurable?
- Do they belong to a real dimension?
- Are there many low-cardinality indicators?
- Would a junk dimension simplify the fact table?
- Are combinations manageable?
- Will BI users understand this dimension?

## Testing / verification guidance

Codex should recommend:

- junk dimension combination tests
- valid flag value tests
- fact foreign key tests
- unknown/default flag combination tests
- report filter tests

## Tradeoffs and cautions

Junk dimensions can grow if too many attributes or high-cardinality values are included. Do not put real domain entities or high-cardinality attributes into junk dimensions.

## Example transformation

**Before:**

```text
registration_fact:
is_late
is_manual_review
has_missing_documents
is_transfer_student
registration_channel
```

**After:**

```text
registration_fact:
registration_indicator_key

registration_indicator_dim:
is_late
is_manual_review
has_missing_documents
is_transfer_student
registration_channel
```

## Distilled skill rule

Use junk dimensions to group miscellaneous low-cardinality flags and indicators without cluttering fact tables.

---

# 17. Handle Unknown, Missing, and Late-Arriving Dimensions

## Core teaching

Real data warehouses must handle facts that arrive before their dimensions, missing source attributes, unknown values, and late corrections. Dimensional models need explicit unknown/default members and late-arriving strategies.

The engineering behavior being taught is:

```text
Design for imperfect data instead of letting pipelines fail or create broken joins.
```

For Codex, this means avoiding analytics pipelines that assume perfect source ordering and completeness.

## Codex trigger

Apply this when Codex is:

- loading fact tables
- joining facts to dimensions
- building ETL/ELT pipelines
- integrating multiple sources
- handling streaming/event data
- processing late events
- designing warehouse constraints
- debugging missing dimension keys

## Signals and smells

Codex should notice:

- fact load fails because dimension missing
- null foreign keys in fact tables
- BI reports drop rows due to inner joins
- late-arriving customer/student/product data
- unknown values stored inconsistently
- missing data handled differently per pipeline
- source events arrive out of order
- placeholder rows not updated later

## Desired Codex behavior

Codex should use explicit unknown/default dimension members and late-arriving dimension handling.

Common special members:

```text
Unknown
Not applicable
Missing
To be determined
Error
```

## Implementation guidance

Codex should:

- create default dimension rows for unknown/not applicable cases
- avoid null dimension foreign keys in facts where possible
- use surrogate key for unknown member
- support inferred dimension members for late-arriving dimensions
- update inferred dimension when full data arrives
- track data quality issues separately
- choose left joins carefully in BI queries
- document missing/unknown semantics

## Review guidance

Codex should ask:

- What happens if dimension row is missing?
- Are null foreign keys allowed?
- Is unknown different from not applicable?
- Can facts arrive before dimensions?
- How are inferred members completed?
- Are missing values visible in data quality reports?

## Testing / verification guidance

Codex should recommend:

- unknown dimension member tests
- late-arriving fact tests
- inferred dimension update tests
- no-null-key tests where applicable
- data quality tests for unknown rates
- reconciliation tests after late updates

## Tradeoffs and cautions

Overusing unknown members can hide data quality issues. Codex should track and alert on unknown rates, not merely absorb them silently.

## Example transformation

**Before:**

```text
payment_fact load fails when student_dim row is missing.
```

**After:**

```text
payment_fact uses student_key = Unknown or creates inferred student_dim row with natural ID.
When student details arrive, inferred row is completed.
Data quality dashboard tracks unknown/inferred counts.
```

## Distilled skill rule

Handle missing and late-arriving dimension data explicitly with unknown/inferred members and data quality tracking.

---

# 18. Separate Staging, Integration, and Presentation Layers

## Core teaching

A robust data warehouse architecture separates raw/staging data, integration/cleansing, and dimensional presentation. The dimensional model should not be polluted by raw source quirks.

The engineering behavior being taught is:

```text
Keep ingestion/source capture separate from business-facing dimensional presentation.
```

For Codex, this helps avoid turning star schemas into messy source-system dumps.

## Codex trigger

Apply this when Codex is:

- designing ETL/ELT pipelines
- creating warehouse schemas
- integrating source systems
- building marts
- modeling analytics layers
- handling raw data ingestion
- designing dbt/project layers

## Signals and smells

Codex should notice:

- BI users query raw source tables
- presentation tables contain source-system technical fields
- transformations happen directly inside dashboards
- raw and curated data mixed
- no lineage from source to mart
- no place for data quality checks
- source schema changes break reports immediately
- dimensional tables include raw operational noise

## Desired Codex behavior

Codex should recommend layered architecture:

```text
raw/staging: source-aligned capture
integration/cleansing: business rules, standardization, conformance
presentation/dimensional marts: facts, dimensions, semantic models
```

## Implementation guidance

Codex should:

- load raw source data into staging with lineage
- transform and clean in intermediate layer
- map/conform dimensions before presentation
- expose star schemas or semantic models to BI users
- keep technical source fields out of presentation unless useful
- document lineage and transformations
- avoid dashboards directly depending on raw tables

## Review guidance

Codex should ask:

- Which layer is this table in?
- Is raw source data separated from business presentation?
- Are transformations reusable or hidden in BI?
- Can source schema changes be absorbed?
- Is lineage clear?
- Are facts/dimensions exposed cleanly?

## Testing / verification guidance

Codex should recommend:

- source freshness tests
- staging row-count reconciliation
- transformation tests
- data quality tests
- dimensional integrity tests
- lineage documentation checks
- dashboard regression tests

## Tradeoffs and cautions

Small projects may not need many physical layers, but logical separation still helps. Codex can implement layers as schemas, folders, dbt models, views, or naming conventions depending on stack size.

## Example transformation

**Before:**

```text
PowerBI dashboard queries operational Students, Families, Payments, Classes tables directly and applies transformations in dashboard logic.
```

**After:**

```text
raw_* tables capture source.
int_* models clean/conform data.
dim_student, dim_family, fact_payment, fact_registration form presentation layer.
PowerBI uses presentation layer only.
```

## Distilled skill rule

Separate raw ingestion, integration/cleansing, and dimensional presentation so BI does not depend on source-system quirks.

---

# 19. ETL/ELT Must Preserve Lineage and Reconciliation

## Core teaching

Data warehouse pipelines must be auditable. Users need to trust that facts reconcile to source data, transformations are explainable, and metric differences can be traced.

The engineering behavior being taught is:

```text
Make data movement traceable from source to report.
```

For Codex, this means not writing opaque transformations that produce numbers nobody can verify.

## Codex trigger

Apply this when Codex is:

- writing ETL/ELT jobs
- transforming source data into facts/dimensions
- creating metrics
- reconciling reports
- debugging incorrect dashboards
- building warehouse pipelines
- designing audit columns

## Signals and smells

Codex should notice:

- no source record ID in warehouse
- no load timestamp/batch ID
- no reconciliation checks
- transformed numbers cannot be traced
- source row counts differ silently
- dashboards disagree with source systems
- pipeline overwrites data without audit
- no error/quarantine path
- no metadata about transformation version

## Desired Codex behavior

Codex should include lineage and reconciliation as part of pipeline design.

Important metadata:

```text
source_system
source_record_id
load_batch_id
loaded_at
updated_at
effective dates
pipeline_version
data_quality_status
```

## Implementation guidance

Codex should:

- preserve source identifiers in staging and facts/dimensions where useful
- add load/audit columns
- create reconciliation checks
- track rejected/quarantined rows
- maintain source-to-target mapping documentation
- make transformations deterministic and reviewable
- support reruns where practical
- log pipeline row counts and error counts

## Review guidance

Codex should ask:

- Can this fact be traced to source?
- Can totals reconcile to source?
- What rows were rejected?
- What batch loaded this data?
- Are transformations documented?
- Can the pipeline be rerun safely?
- Is data quality visible?

## Testing / verification guidance

Codex should recommend:

- source-to-target row-count tests
- checksum/sum reconciliation
- rejected row tests
- duplicate detection
- load audit tests
- rerun/idempotency tests
- lineage field non-null tests
- pipeline freshness tests

## Tradeoffs and cautions

Not every field needs full lineage in every layer, but critical facts and dimensions should have enough metadata to debug trust issues.

## Example transformation

**Before:**

```text
fact_payment contains amount and date, but no source payment ID or load metadata.
```

**After:**

```text
fact_payment includes:
payment_transaction_id
source_system
source_payment_id
load_batch_id
loaded_at
amount
date_key

Pipeline reconciles SUM(amount) to source payments per batch.
```

## Distilled skill rule

Design warehouse pipelines so facts and metrics can be traced, reconciled, and audited back to source data.

---

# 20. Dimensional Models Should Serve BI Usability

## Core teaching

A technically correct warehouse can still fail if analysts and business users cannot understand or use it. Dimensional models should use business language, intuitive relationships, clear metrics, and consistent definitions.

The engineering behavior being taught is:

```text
Optimize the analytics layer for human queryability and shared business understanding.
```

For Codex, this means not only designing tables that are “normalized enough” or “technically right,” but designing models people can use.

## Codex trigger

Apply this when Codex is:

- creating BI schema
- naming tables/columns
- building semantic layer
- writing dashboard queries
- designing data marts
- documenting metrics
- creating analytics APIs
- reviewing usability of reporting model

## Signals and smells

Codex should notice:

- cryptic source-system names
- analysts need engineers for basic queries
- same metric has multiple names
- dimensions/facts not documented
- columns have unclear meaning
- BI model exposes technical staging fields
- users join tables incorrectly
- filters behave inconsistently
- reports contain duplicated business logic

## Desired Codex behavior

Codex should design with BI consumers in mind.

It should provide:

```text
business-friendly names
clear fact grain
clear dimension definitions
metric definitions
default aggregations
semantic layer where useful
documented joins
conformed dimensions
hidden technical fields
```

## Implementation guidance

Codex should:

- name tables after business processes/entities
- name facts/dimensions clearly
- avoid obscure abbreviations
- hide staging/audit fields from BI where not useful
- define metrics in a shared semantic layer if available
- document grain and additivity
- provide example queries
- validate model with representative reporting questions

## Review guidance

Codex should ask:

- Can a non-engineer analyst understand this?
- Are names business-friendly?
- Are metric definitions consistent?
- Is grain documented?
- Are joins obvious?
- Are technical fields hidden or explained?
- Does this model answer real questions simply?

## Testing / verification guidance

Codex should recommend:

- representative BI query tests
- metric definition tests
- semantic layer tests
- dashboard validation with business users
- query performance tests
- usability review of table/column names
- documentation checks

## Tradeoffs and cautions

Business-friendly modeling should not hide important caveats. If data is stale, incomplete, or filtered, that must be visible.

## Example transformation

**Before:**

```text
Table: src_tbl_pmt_hdr_x
Columns: amt1, cd_typ, dt_eff, flag2
```

**After:**

```text
Table: payment_fact
Columns:
payment_amount
payment_method_key
payment_date_key
is_late_payment
```

Documentation:

```text
Grain: one row per payment transaction.
payment_amount is additive.
```

## Distilled skill rule

Design the analytical presentation layer in business language with clear grain, joins, metrics, and aggregation behavior.

---

# 21. Avoid One Big Enterprise Model Before Delivering Value

## Core teaching

Dimensional warehouse design often grows through bus architecture: build process-focused marts with conformed dimensions so they integrate over time. This avoids both isolated data silos and endless upfront enterprise modeling.

The engineering behavior being taught is:

```text
Deliver useful dimensional marts incrementally while conforming shared dimensions for integration.
```

For Codex, this means not recommending a massive warehouse rewrite before the first useful dashboard exists.

## Codex trigger

Apply this when Codex is:

- planning data warehouse roadmap
- designing first data mart
- integrating multiple business processes
- creating enterprise analytics architecture
- deciding between big upfront model and isolated dashboards
- sequencing data architecture work

## Signals and smells

Codex should notice:

- project attempts to model entire enterprise before first report
- isolated dashboards define dimensions inconsistently
- data marts cannot be combined
- no conformed dimension plan
- users wait months for any value
- each team builds its own incompatible mart
- architecture is either too centralized or too siloed

## Desired Codex behavior

Codex should recommend incremental data mart delivery with a bus matrix/conformed dimensions.

It should identify:

```text
business processes as rows
shared dimensions as columns
priority marts
conformance requirements
delivery sequence
```

## Implementation guidance

Codex should:

- create a data warehouse bus matrix
- prioritize high-value business processes
- define conformed dimensions early
- deliver one mart at a time
- reuse conformed dimensions across marts
- avoid building all facts upfront
- avoid isolated local dimensions that block integration
- validate each mart with business use cases

## Review guidance

Codex should ask:

- What is the first high-value business process?
- What shared dimensions are needed?
- Does this mart integrate with future marts?
- Are we over-modeling before delivering value?
- Are we creating isolated departmental silos?
- What is the next mart?

## Testing / verification guidance

Codex should recommend:

- bus matrix review
- conformed dimension tests
- mart-level acceptance tests
- cross-mart metric reconciliation
- incremental delivery checkpoints
- business validation per mart

## Tradeoffs and cautions

Too much enterprise coordination can slow delivery. Too little creates inconsistent silos. Codex should balance incremental delivery with shared dimension governance.

## Example transformation

**Before:**

```text
Data warehouse project spends six months designing all possible tables.
```

**After:**

```text
Codex proposes bus matrix:
Processes:
- Registration
- Payments
- Attendance
- Class placement

Conformed dimensions:
- Date
- Student
- Family
- Class
- School year

First mart: Registration, because it supports urgent reporting.
```

## Distilled skill rule

Deliver dimensional marts incrementally around business processes while conforming shared dimensions for enterprise consistency.

---

# 22. Build a Data Warehouse Bus Matrix

## Core teaching

A bus matrix maps business processes to shared dimensions. It is a planning tool that reveals conformed dimension needs and guides incremental warehouse delivery.

The engineering behavior being taught is:

```text
Use a bus matrix to plan analytics architecture across processes and dimensions.
```

For Codex, this provides a concrete planning artifact for data architecture.

## Codex trigger

Apply this when:

- designing multiple marts
- planning data warehouse roadmap
- integrating facts across processes
- deciding conformed dimensions
- organizing analytics work
- user asks “where do we start?”
- reports span multiple business processes

## Signals and smells

Codex should notice:

- no roadmap for data marts
- shared dimensions discovered late
- inconsistent date/customer/product definitions
- mart projects conflict
- analysts cannot combine metrics
- unclear process/dimension coverage
- warehouse work is not sequenced

## Desired Codex behavior

Codex should produce or recommend a bus matrix.

Format:

```text
Rows: business processes / fact tables
Columns: dimensions
Cells: dimension used by process
```

Example:

```text
                 Date Student Family Class SchoolYear PaymentMethod
Registration      X     X       X      X      X
Payment           X     X       X             X          X
Attendance        X     X              X      X
ClassSnapshot     X     X?             X      X
```

## Implementation guidance

Codex should:

- list business processes
- list candidate dimensions
- mark shared dimensions
- identify conformed dimensions
- prioritize first mart
- detect isolated/special dimensions
- use matrix to prevent inconsistent mart design
- update matrix as warehouse evolves

## Review guidance

Codex should ask:

- Are business processes clearly listed?
- Are dimensions reusable?
- Which dimensions must be conformed?
- Which process should be delivered first?
- Are any dimensions overloaded?
- Are any marts isolated unnecessarily?
- Does the matrix match real reporting questions?

## Testing / verification guidance

Codex should recommend:

- conformance checks for dimensions marked shared
- mart completeness validation
- cross-process query tests
- roadmap review after each mart
- documentation updates when matrix changes

## Tradeoffs and cautions

A bus matrix is a planning tool, not a rigid prison. Update it as the business understanding evolves.

## Example transformation

**Before:**

```text
Codex designs payment mart without considering whether student/date/class dimensions match registration mart.
```

**After:**

```text
Codex creates bus matrix and identifies Date, Student, Family, SchoolYear as conformed dimensions needed by both Registration and Payment marts.
```

## Distilled skill rule

Use a bus matrix to plan business-process fact tables and shared conformed dimensions across the warehouse.

---

# 23. Factless Fact Tables Model Events and Coverage

## Core teaching

Some fact tables have no numeric measurements. They record that an event happened or that a relationship/coverage condition existed.

The engineering behavior being taught is:

```text
Use factless facts to count events, model eligibility/coverage, or capture many-to-many analytical relationships.
```

Examples:

```text
student attended class
student eligible for service
promotion covered product/store/date
student assigned to class
doctor available at clinic
```

## Codex trigger

Apply this when Codex needs to model:

- attendance
- eligibility
- coverage
- assignments
- enrollments
- events with no amount
- many-to-many relationships over time
- “who could have” vs “who did”
- missing activity analysis

## Signals and smells

Codex should notice:

- fact table has only keys and no measures
- developers avoid table because “there are no facts”
- need to count occurrences
- need to compare eligible vs actual
- many-to-many relationship needs time context
- reports ask “which students did not attend?”
- coverage cannot be analyzed

## Desired Codex behavior

Codex should recognize that event occurrence itself can be the fact.

It should model:

```text
event factless fact
coverage factless fact
```

## Implementation guidance

Codex should:

- declare grain clearly
- include dimension keys
- include date/period keys
- optionally include a constant count measure = 1 for BI ease
- use factless coverage tables for eligibility/opportunity
- combine coverage and activity facts to answer “what did not happen”
- test uniqueness at grain

## Review guidance

Codex should ask:

- Is the occurrence itself the measurement?
- What is one row?
- Is this event or coverage?
- Can this answer missing activity questions?
- Are dimensions sufficient for analysis?
- Should a count measure be included?

## Testing / verification guidance

Codex should recommend:

- uniqueness tests at grain
- row-count reconciliation
- coverage completeness tests
- attendance/event count tests
- missing activity query tests
- referential integrity tests

## Tradeoffs and cautions

Do not force fake numeric measures when the event/relationship is the fact. But include a count column if BI tools need a measure.

## Example transformation

**Before:**

```text
No attendance fact because there is no amount to sum.
```

**After:**

```text
student_class_attendance_fact:
Grain: one row per student per class session attended.
student_key
class_key
date_key
attendance_status_key
attendance_count = 1
```

## Distilled skill rule

Use factless fact tables when the analytical fact is event occurrence, eligibility, coverage, or relationship existence.

---

# 24. Bridge Tables Handle Many-to-Many Relationships Carefully

## Core teaching

Dimensional models sometimes need bridge tables to handle many-to-many relationships, hierarchies, or multi-valued dimensions. These must be designed carefully to avoid double-counting.

The engineering behavior being taught is:

```text
Model many-to-many analytical relationships explicitly and protect metrics from double-counting.
```

For Codex, this is important when facts relate to multiple categories, people, tags, diagnoses, promotions, or groups.

## Codex trigger

Apply this when:

- one fact relates to multiple dimension members
- many-to-many relationships appear in reports
- a customer belongs to multiple segments
- a transaction has multiple tags/categories
- a student has multiple programs/support tracks
- hierarchical/group reporting is needed
- totals get duplicated after joins

## Signals and smells

Codex should notice:

- comma-separated IDs in fact table
- repeated fact rows for each category causing double-counting
- many-to-many relationship flattened incorrectly
- reports overcount when joining tags/groups
- bridge weight/allocation missing
- hierarchy changes over time but not tracked
- BI users join bridge incorrectly

## Desired Codex behavior

Codex should introduce bridge tables or allocation factors when needed.

It should define:

```text
bridge grain
relationship meaning
effective dates if relationship changes
allocation/weight if measures are split
rules for counting
```

## Implementation guidance

Codex should:

- create bridge table between fact/dimension or dimensions
- include weighting/allocation factor when measures must be apportioned
- use effective dates for historical relationships
- document double-counting risk
- provide safe semantic-layer measures
- avoid multi-valued columns in fact tables
- test totals with and without bridge

## Review guidance

Codex should ask:

- Is this relationship many-to-many?
- Will joining duplicate fact rows?
- Is allocation required?
- Does relationship change over time?
- Is hierarchy/group membership historical?
- Are BI users protected from double-counting?

## Testing / verification guidance

Codex should recommend:

- bridge uniqueness tests
- allocation factor sum tests
- double-counting tests
- historical effective date tests
- report total reconciliation
- many-to-many query tests

## Tradeoffs and cautions

Bridge tables can complicate BI usage. Use them when many-to-many analysis is necessary, and hide complexity with semantic layer/views when possible.

## Example transformation

**Before:**

```text
student_fact stores program_codes = "A,B,C".
Reports split string and duplicate counts unpredictably.
```

**After:**

```text
student_program_bridge:
student_key
program_key
effective_start_date
effective_end_date
allocation_weight

Semantic layer defines safe counts.
```

## Distilled skill rule

Use bridge tables for many-to-many analytical relationships, and design safeguards against double-counting.

---

# 25. Hierarchies Need Explicit Modeling

## Core teaching

Dimensions often contain hierarchies: product category, geography, organization, school/class, calendar, customer segment. Hierarchies must be modeled so rollups are correct and understandable.

The engineering behavior being taught is:

```text
Make hierarchy levels explicit and stable enough for reporting.
```

## Codex trigger

Apply this when Codex models:

- geography
- organization/team
- school/class/grade
- product/category/subcategory
- account/customer group
- fiscal/calendar periods
- parent-child relationships
- rollup reports

## Signals and smells

Codex should notice:

- hierarchy encoded in text strings
- parent-child traversal needed for every report
- rollups inconsistent
- hierarchy changes over time
- facts can be counted under multiple parents
- no level names
- recursive structure exposed directly to BI users
- category attributes duplicated inconsistently

## Desired Codex behavior

Codex should choose a hierarchy modeling strategy based on reporting needs.

Options:

```text
flatten hierarchy attributes in dimension
parent-child dimension
bridge table for variable/deep hierarchy
historical Type 2 hierarchy tracking
```

## Implementation guidance

Codex should:

- flatten simple stable hierarchies for BI ease
- use bridge tables for complex many-to-many/deep hierarchies
- track hierarchy history if historical rollups matter
- define level names clearly
- avoid ambiguous parent relationships
- document current vs historical rollup behavior
- test rollup totals

## Review guidance

Codex should ask:

- What hierarchy levels matter?
- Is the hierarchy fixed or ragged?
- Does it change over time?
- Should reports use current hierarchy or historical hierarchy?
- Can facts roll up to multiple parents?
- Are rollups protected from double-counting?

## Testing / verification guidance

Codex should recommend:

- hierarchy completeness tests
- parent-child integrity tests
- rollup reconciliation tests
- historical hierarchy tests
- no-cycle tests for recursive structures
- double-counting tests for multi-parent hierarchies

## Tradeoffs and cautions

Flattened hierarchies are easy for BI but less flexible. Recursive hierarchies are flexible but harder for users. Choose based on reporting use.

## Example transformation

**Before:**

```text
class_dim has class_name = "Gan/A1/Teacher Cohen"
Reports parse string to group by gan/class/teacher.
```

**After:**

```text
class_dim:
school_level
grade
class_code
class_name
teacher_name
campus
school_year
```

## Distilled skill rule

Model reporting hierarchies explicitly so rollups are consistent, understandable, and protected from double-counting.

---

# 26. Data Quality Must Be Designed Into the Warehouse

## Core teaching

Data warehouses are trusted only when quality issues are detected, surfaced, and managed. Data quality is not a dashboard afterthought.

The engineering behavior being taught is:

```text
Treat data quality checks as part of the data model and pipeline.
```

For Codex, this means adding tests and validation around facts, dimensions, transformations, and business metrics.

## Codex trigger

Apply this when Codex is:

- writing ETL/ELT pipelines
- designing facts/dimensions
- reconciling reports
- integrating source systems
- loading dimensions
- loading facts
- defining metrics
- building dashboards

## Signals and smells

Codex should notice:

- null dimension keys
- duplicate natural keys
- invalid dates
- facts with impossible amounts
- missing source rows
- unknown dimension rate increasing
- dashboard numbers change unexpectedly
- no freshness checks
- pipeline succeeds despite bad data
- errors hidden in logs only

## Desired Codex behavior

Codex should include data quality checks and visible failure/alert paths.

Quality categories:

```text
completeness
validity
uniqueness
referential integrity
freshness
accuracy/reconciliation
consistency
timeliness
conformance
```

## Implementation guidance

Codex should:

- add schema tests for keys/nulls/uniqueness
- add range tests for measures
- add accepted-value tests for statuses/categories
- add referential integrity tests
- add freshness tests
- add reconciliation tests
- quarantine bad records where appropriate
- track data quality metrics over time
- expose data quality issues to owners

## Review guidance

Codex should ask:

- What can go wrong with this data?
- Are keys unique and non-null?
- Are dimension references valid?
- Are measures in valid ranges?
- Is data fresh?
- Does it reconcile to source?
- What happens to bad rows?
- Who owns quality issues?

## Testing / verification guidance

Codex should recommend:

- dbt-style tests or equivalent
- unit tests for transformations
- source-to-target reconciliation
- anomaly checks
- freshness checks
- bad-row quarantine tests
- data quality dashboard/alerts
- business validation of critical metrics

## Tradeoffs and cautions

Too many data tests can create noise. Prioritize checks that protect critical metrics and common failure modes.

## Example transformation

**Before:**

```text
payment_fact loads all rows. Negative payments, missing family keys, and duplicate payment IDs appear in reports.
```

**After:**

```text
Pipeline checks:
- payment_id unique
- amount within valid range
- family_key not unknown above threshold
- load reconciles to source total
- bad rows quarantined with reason
```

## Distilled skill rule

Build data quality checks into facts, dimensions, and pipelines so trust issues are detected before reports mislead users.

---

# 27. Performance Comes from Modeling and Aggregation Strategy

## Core teaching

Dimensional models improve query performance by simplifying joins and aligning storage with analytical access patterns. Performance also depends on partitioning, indexing, aggregate tables, materialized views, and BI query behavior.

The engineering behavior being taught is:

```text
Optimize analytical performance through appropriate grain, star schemas, aggregates, and physical design—not random query hacks.
```

## Codex trigger

Apply this when:

- dashboards are slow
- fact tables are large
- queries scan too much data
- reports need repeated expensive joins
- BI tool generates poor SQL
- users need summary dashboards
- query latency matters

## Signals and smells

Codex should notice:

- dashboard queries raw normalized OLTP schema
- no partitioning by date
- no indexes/clustering on common filters
- aggregate dashboard repeatedly scans atomic fact
- BI query joins unnecessary dimensions
- summary table grain undocumented
- materialized views not reconciled
- performance fixes change metric definitions

## Desired Codex behavior

Codex should recommend performance improvements that preserve semantic correctness.

Options:

```text
star schema
partitioning
clustering/indexing
aggregate fact tables
materialized views
semantic-layer pre-aggregation
query pruning
incremental refresh
```

## Implementation guidance

Codex should:

- preserve atomic facts as source of truth when feasible
- create aggregate facts for common high-level dashboards
- document aggregate grain
- reconcile aggregates to atomic facts
- partition large facts by date/period
- index/cluster on common dimension keys
- avoid premature aggregates
- test query performance with realistic data

## Review guidance

Codex should ask:

- Is slowness caused by model shape, data volume, or BI query?
- What is the common query pattern?
- Can a star schema simplify this?
- Is an aggregate table justified?
- Is aggregate grain documented?
- Does optimization preserve metric correctness?
- Can users drill through if needed?

## Testing / verification guidance

Codex should recommend:

- query performance tests
- aggregate reconciliation tests
- partition pruning checks
- explain-plan review
- dashboard load tests
- refresh time tests
- semantic metric tests

## Tradeoffs and cautions

Performance aggregates can create metric inconsistency if not governed. Do not create dashboard-specific summary tables without clear lineage and reconciliation.

## Example transformation

**Before:**

```text
Dashboard calculates monthly payments by scanning payment transactions and joining 10 dimensions every load.
```

**After:**

```text
payment_monthly_summary_fact:
Grain: one row per month per class per payment method.
Derived from payment_transaction_fact.
Reconciled daily.
Dashboard uses summary; drill-through uses atomic fact.
```

## Distilled skill rule

Improve analytical performance with star schemas, partitioning, and governed aggregates that preserve grain and metric correctness.

---

# 28. Senior Engineering Judgment from _The Data Warehouse Toolkit_

## Core teaching

The deeper lesson is that good analytics architecture is not a dump of application data. It is a deliberate business-facing model of measurable processes, descriptive context, historical change, shared definitions, and trustworthy metrics.

Codex should internalize this:

```text
Analytical models must be understandable, consistent, historically accurate, queryable, and trusted.
```

## Codex trigger

Apply broadly when Codex is working on:

- data warehouses
- BI/reporting models
- dashboards
- analytics schemas
- ETL/ELT pipelines
- semantic layers
- metrics definitions
- data marts
- source-to-target transformations
- cross-process reporting

## Signals and smells

Codex should notice:

- source-system copy used as analytics model
- no fact grain
- mixed grains
- unclear facts/dimensions
- inconsistent date/student/customer/product definitions
- no slowly changing dimension strategy
- no conformed dimensions
- no data quality checks
- no metric definitions
- reports double-count
- dashboards query raw operational systems
- business users cannot understand model
- totals cannot reconcile to source

## Desired Codex behavior

Codex should:

- identify business process
- declare grain
- separate facts/dimensions
- prefer atomic facts
- design star schemas
- conform shared dimensions
- define SCD strategy
- use surrogate keys where needed
- classify fact additivity
- choose transaction/snapshot/accumulating facts appropriately
- handle unknown/late dimensions
- preserve lineage
- add data quality tests
- design for BI usability

## Implementation guidance

Codex should:

- produce dimensional models with clear fact/dimension structure
- document grain and metric definitions
- avoid copying OLTP schema into reporting layer
- create conformed dimensions for shared entities
- implement SCD Type 1/Type 2 based on history needs
- add ETL/ELT tests and reconciliation
- design aggregate tables only as derived, documented layers
- include data quality/freshness checks
- write example BI queries where useful

## Review guidance

Codex should check:

- What business process is modeled?
- What is the grain?
- Are facts/dimensions separated?
- Are measures additive/semi-additive/non-additive?
- Are shared dimensions conformed?
- Are historical changes handled?
- Are unknown/late-arriving values handled?
- Can metrics reconcile?
- Can business users query this?
- Is lineage visible?

## Testing / verification guidance

Codex should recommend:

- grain uniqueness tests
- row-count reconciliation
- referential integrity tests
- dimension conformance tests
- SCD versioning tests
- fact additivity tests
- metric reconciliation tests
- data freshness tests
- source-to-target tests
- aggregate-to-detail reconciliation
- dashboard query validation

## Tradeoffs and cautions

Dimensional modeling is for analytical workloads. Do not impose dimensional schemas on transactional application design.

Do not build enterprise-scale warehouse architecture for small reporting needs unless justified. But even small reporting models benefit from clear grain, metric definitions, and separation from source-system quirks.

## Example transformation

**Before:**

```text
Application database:
students
families
classes
payments
registrations

Dashboard joins these directly and computes:
total registered
total paid
balance
class occupancy
late documents
```

**After:**

```text
Dimensional model:
registration_fact
Grain: one row per registration application.

payment_transaction_fact
Grain: one row per payment transaction.

class_enrollment_daily_snapshot_fact
Grain: one row per class per day.

student_dim
family_dim
class_dim
date_dim
school_year_dim
payment_method_dim
registration_indicator_dim

Metrics:
total_registered = COUNT(registration_fact)
total_paid = SUM(payment_transaction_fact.amount)
class_occupancy = active_student_count / capacity
```

## Distilled skill rule

For analytics, model measurable business processes with declared grain, conformed dimensions, trustworthy facts, historical strategy, lineage, and data quality checks.

---

# Compression Candidates for Future `SKILL.md`

These are candidate rules to compress into a future Codex skill:

```text
Design analytical models around measurable business processes, not around source-system table structure.
```

```text
Declare the fact table grain before choosing facts or dimensions; never mix multiple grains in one fact table.
```

```text
Put measurable values in fact tables and descriptive context in dimensions, with each column’s role explicit.
```

```text
Store facts at the lowest practical grain and derive aggregates from detailed facts when possible.
```

```text
Use star schemas in analytical presentation layers so business users can query facts by clear descriptive dimensions.
```

```text
Use conformed dimensions for shared business entities so facts from different processes can be compared consistently.
```

```text
Centralize calendar, fiscal, and business-period logic in a shared date dimension.
```

```text
Use role-playing dimensions with explicit role names when the same dimension appears in multiple contexts.
```

```text
For changing dimensions, explicitly choose overwrite or history tracking per attribute based on reporting requirements.
```

```text
Use dimension surrogate keys to support history, conformance, and source-system independence; keep natural keys for lineage.
```

```text
Classify every measure’s additivity and store additive components for ratios, averages, balances, and snapshots.
```

```text
Use transaction fact tables for atomic business events, with clear grain, context dimensions, and additive measures.
```

```text
Use periodic snapshot facts to represent regular state over time, with clear period grain and semi-additive measure rules.
```

```text
Use accumulating snapshot facts for workflows with defined milestones and lifecycle-duration reporting needs.
```

```text
Store transaction identifiers as degenerate dimensions in fact tables when they support traceability but have no separate descriptive attributes.
```

```text
Use junk dimensions to group miscellaneous low-cardinality flags and indicators without cluttering fact tables.
```

```text
Handle missing and late-arriving dimension data explicitly with unknown/inferred members and data quality tracking.
```

```text
Separate raw ingestion, integration/cleansing, and dimensional presentation so BI does not depend on source-system quirks.
```

```text
Design warehouse pipelines so facts and metrics can be traced, reconciled, and audited back to source data.
```

```text
Design the analytical presentation layer in business language with clear grain, joins, metrics, and aggregation behavior.
```

```text
Deliver dimensional marts incrementally around business processes while conforming shared dimensions for enterprise consistency.
```

```text
Use a bus matrix to plan business-process fact tables and shared conformed dimensions across the warehouse.
```

```text
Use factless fact tables when the analytical fact is event occurrence, eligibility, coverage, or relationship existence.
```

```text
Use bridge tables for many-to-many analytical relationships, and design safeguards against double-counting.
```

```text
Model reporting hierarchies explicitly so rollups are consistent, understandable, and protected from double-counting.
```

```text
Build data quality checks into facts, dimensions, and pipelines so trust issues are detected before reports mislead users.
```

```text
Improve analytical performance with star schemas, partitioning, and governed aggregates that preserve grain and metric correctness.
```

```text
For analytics, model measurable business processes with declared grain, conformed dimensions, trustworthy facts, historical strategy, lineage, and data quality checks.
```
