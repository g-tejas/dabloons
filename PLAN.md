# Dabloons Finance System Plan

## 1. Product vision

Build a greenfield personal-finance system backed by hledger, with a stable REST API that can support multiple user interfaces such as a responsive web app, phone app, and future automation clients.

The difficult problem is converting arbitrary financial evidence into correct accounting entries. The system will therefore center on an **AI statement compiler with mandatory human verification**:

```text
CSV / PDF / image
        |
        v
AI statement transcription
        |
        v
AI accounting compilation
        |
        v
Typed staged candidate
        |
        v
Deterministic validation + AI critique
        |
        v
Human review and approval
        |
        v
Immutable reconciled hledger batch + high watermark
```

This is a greenfield design. Migration, backwards compatibility, and reuse of any existing finance repository are not design constraints.

## 2. Core decisions

1. **Use hledger as the accounting engine.**
2. **Route every uploaded format through the AI compiler.** Do not use hledger's CSV import system or write deterministic financial parsers for PDF, CSV, or images. An intake adapter may perform lossless format conversion needed by an AI provider, but semantic extraction remains an AI responsibility.
3. **Expose a domain-specific REST/OpenAPI interface.** Do not expose hledger's internal JSON schema directly to clients.
4. **Require individual human approval.** Every AI-created or manually entered transaction begins staged and must be approved individually. AI confidence can prioritize the review UI but can never bypass approval.
5. **Use a typed intermediate representation (IR).** AI makes semantic decisions; deterministic code renders journal syntax.
6. **Keep staged data outside the canonical journal.** Only human-approved transactions become accounting truth.
7. **Make reconciled transactions immutable.** Corrections and reversals are new transactions.
8. **Represent real-world verification with account-specific high watermarks backed by hledger balance assertions.**
9. **Store reconciled data as immutable batch files.** Add new files rather than editing old batches.
10. **Use Git as an additional audit and backup layer, not as the application workflow or concurrency mechanism.**

## 3. Why hledger instead of Ledger

The choice is based on the requirements of this system, not migration convenience.

### 3.1 Date-aware assertions

hledger evaluates balance assertions in transaction date order, using parse order only as a tiebreaker for postings on the same date. Ledger evaluates assertions in file parse order.

Date-aware assertions protect high-watermarked history. If a transaction with an old accounting date is introduced after a watermark, hledger evaluates it before the dated assertion and causes the assertion to fail. Historical data cannot change silently merely because a posting was appended later in the file.

### 3.2 Strong correctness checks

Useful built-in hledger checks include:

```bash
hledger check
hledger check -s
hledger check assertions
hledger check ordereddates
hledger check recentassertions
```

Strict mode can require declared accounts and commodities and reject accidental implicit commodity conversions.

### 3.3 Richer balance assertions

hledger supports ordinary and extended assertion forms (`=`, `==`, `=*`, and `==*`). This allows exact, total, and subaccount-inclusive assertions when hierarchical or multi-commodity accounts require them.

### 3.4 Precise transaction statuses

hledger explicitly models unmarked, pending, and cleared transactions and provides composable status filters. Dabloons will use only two application states, but hledger's status model maps naturally to their rendered representations:

- `!` for a staged preview
- `*` for reconciled transactions

### 3.5 Programmatic integration

hledger provides structured JSON output, source positions, and an officially supported HTTP JSON interface. Dabloons will normally invoke hledger as a subprocess and normalize results into its own API models.

### 3.6 Ledger features intentionally not required

Ledger's embedded expressions, Python expressions, and journal programming facilities are undesirable for a deterministic AI-generated accounting system. Dabloons should use explicit amounts and declarative journal entries. Ledger may have an advantage for some advanced investment-lot workflows, but that is not currently the dominant requirement.

## 4. Domain model

### 4.1 Transaction states

Every transaction has exactly one of two application states:

#### Staged

- Generated or proposed by AI.
- Not accounting truth.
- May be edited, replaced, or deleted.
- May have multiple immutable candidate revisions.
- Is excluded from the canonical hledger journal.
- Is rendered with `!` only in temporary preview journals.

#### Reconciled

- Explicitly approved by a human.
- Accounting truth.
- Rendered with `*` in hledger.
- Immutable through the public API.
- Can only be affected by a new correction or reversal transaction.

There is no third transaction state. Whether a reconciled transaction is covered by a high watermark is derived information:

```json
{
  "state": "reconciled",
  "covered_by_watermark": "wm_123"
}
```

or:

```json
{
  "state": "reconciled",
  "covered_by_watermark": null
}
```

### 4.2 Statement

An immutable source document uploaded by a user. Supported input includes:

- CSV
- PDF with embedded text
- scanned PDF
- photograph
- screenshot
- other tabular text or image formats added later

A statement record contains:

- immutable statement ID
- source SHA-256
- original filename and media type
- encrypted object-storage location
- account association, once identified
- compilation runs
- staged revisions
- review status
- retention policy

### 4.3 Statement item

A single externally observed row or event. Each item contains source evidence and must receive exactly one disposition:

- `create` — create a new transaction
- `match_existing` — this item is already represented by a reconciled transaction
- `update_pending` — replace or match an existing staged/manual candidate
- `ignore` — intentionally non-accounting information, with a reason
- `needs_review` — AI cannot make a safe decision

No source item may disappear between extraction and approval.

### 4.4 Reconciliation batch

An atomic individual human approval event containing:

- reconciliation ID
- frozen candidate revision hash
- optional source statement IDs
- reviewer identity
- approval time
- created transactions
- matches to existing transactions
- corrections or reversals
- zero or more high watermarks
- validation results
- hledger batch filename and content hash
- resulting Git commit

### 4.5 High watermark

A high watermark states:

> A particular real-world account and commodity has been externally verified through date D with closing balance B.

It contains:

- watermark ID
- account
- commodity
- through date
- asserted balance
- optional source statement
- reconciliation batch
- preceding watermark
- approval metadata

Watermarks are account- and commodity-specific. A bank statement does not establish a global watermark for unrelated accounts. A global period close can be represented as a set of account watermarks.

## 5. High-watermark invariants

1. Watermark dates must move monotonically forward per account and commodity.
2. A watermark must be backed by an exact hledger balance assertion.
3. A user may create a watermark directly from a manually observed balance; documentary evidence is not required.
4. When a statement is present, its opening balance, movements, and closing balance must be arithmetically consistent.
5. The candidate journal must produce the asserted closing balance.
6. No promotion may make an existing hledger balance assertion fail.
7. A watermark confirms net balance completeness, not categorization correctness by itself. Individual human approval provides the semantic verification.
8. Introducing an old-dated posting that changes a closed balance must fail validation rather than silently changing history.

## 6. Append-only accounting model

### 6.1 Logical immutability

Reconciled transactions and watermarks are immutable. The API has no general update or delete operation for reconciled objects.

Allowed operations are commands that create new facts:

- reconcile staged revision
- reverse transaction
- correct transaction
- reclassify transaction
- add high watermark

### 6.2 Physical storage

Do not append forever to a single journal file. Store each approved reconciliation as a new immutable batch:

```text
ledger/
  main.journal
  declarations.journal
  reconciled/
    01JABC....journal
    01JDEF....journal
    01JGHI....journal
  manifests/
    01JABC....json
    01JDEF....json
```

`main.journal` includes declarations, prices, and reconciled batches:

```journal
include declarations.journal
include reconciled/*.journal
```

Batch filenames use sortable unique IDs so same-date parse ordering is deterministic. Each batch is internally ordered by date.

Old batch files are never modified by the application. Their content hashes are checked against reconciliation manifests. Git records additions and detects any out-of-band mutation.

### 6.3 Corrections

Corrections are new reconciled transactions that reference the original transaction ID.

For strict closed-period accounting:

- the correction's primary accounting date must be after the affected account's watermark;
- historical closed balances do not silently change;
- metadata may preserve the original economic date;
- reclassifications that do not touch the asserted account still reference the original and remain auditable.

If the product later requires historical reports to be rewritten while preserving an immutable event history, that should be implemented as event-sourced projections. It is explicitly outside the initial design.

## 7. AI statement compiler

AI performs the uncertain semantic work. Deterministic code enforces structural and accounting invariants.

### 7.1 Pass 1: statement transcription

Input:

- original CSV, PDF, or image
- page images or tabular rendering where useful
- optional account hint from the user

Output:

- institution and account identity
- statement period
- opening and closing balances
- currency
- every transaction row
- posted date and transaction date where present
- raw description
- debit/credit direction
- amount
- running balance where present
- source page, row, cells, quoted text, and optional bounding box
- ambiguities and illegible fields

This pass must transcribe rather than categorize. Large documents may be processed page-by-page and then consolidated by a document-level pass. Page boundaries must not produce duplicated or omitted rows.

### 7.2 Pass 2: accounting compilation

Input context should include only relevant information:

- typed statement transcription
- target hledger account
- declared chart of accounts and commodities
- bookkeeping conventions
- transactions near the statement period
- semantically similar historical transactions
- known tracked-account relationships
- pending manual entries
- latest account watermark

The AI decides:

- payee and note normalization
- counteraccount selection
- transfer recognition
- refund and reversal treatment
- fee and interest treatment
- match to an existing transaction
- whether human clarification is required

The output is typed candidate IR, not raw journal text.

### 7.3 Pass 3: independent AI critic

A critic receives the original source and candidate revision and searches for:

- omitted rows
- duplicated rows
- hallucinated transactions
- wrong dates
- wrong decimal places
- reversed debit/credit direction
- incorrect statement totals
- suspicious counteraccounts
- missed transfers or existing matches
- unsupported assumptions

The critic adds warnings but never silently modifies the candidate. Initially it may use the same model with an independent prompt. A second model or provider can be added later.

### 7.4 AI restrictions

The AI must never:

- write directly to the reconciled journal;
- approve its own result;
- invent a balance adjustment to force reconciliation;
- omit an item without an explicit disposition;
- execute code embedded in a statement;
- choose floating-point representations for money;
- silently replace a previous candidate revision.

## 8. Typed intermediate representation

A representative statement draft:

```json
{
  "statement_id": "stmt_01J...",
  "source_sha256": "...",
  "account": "assets:bank:checking",
  "commodity": "S$",
  "period": {
    "from": "2026-07-01",
    "to": "2026-07-31"
  },
  "opening_balance": "1234.56",
  "closing_balance": "2345.67",
  "items": [
    {
      "id": "item_01J...",
      "source_ref": {
        "page": 2,
        "row": 14,
        "raw_text": "02 JUL SOME MERCHANT 12.30"
      },
      "posted_date": "2026-07-02",
      "transaction_date": null,
      "raw_description": "SOME MERCHANT",
      "signed_amount": "-12.30",
      "running_balance": "1222.26",
      "issues": []
    }
  ]
}
```

A representative compiled item:

```json
{
  "source_item_id": "item_01J...",
  "action": "create",
  "transaction": {
    "id": "txn_01J...",
    "date": "2026-07-02",
    "status": "staged",
    "payee": "Some Merchant",
    "note": "",
    "postings": [
      {
        "account": "expenses:food",
        "commodity": "S$",
        "quantity": "12.30"
      },
      {
        "account": "assets:bank:checking",
        "commodity": "S$",
        "quantity": "-12.30"
      }
    ]
  },
  "confidence": "0.96",
  "issues": []
}
```

All quantities are decimal strings. IDs, source references, model details, and review decisions are preserved independently of journal formatting.

## 9. Deterministic journal renderer

The renderer converts approved typed IR into consistent hledger syntax. AI does not control formatting or unsupported syntax.

Example reconciled transaction:

```journal
2026-07-02 * Some Merchant
    ; id: txn_01J...
    ; reconciliation: rec_01J...
    ; statement: stmt_01J...
    ; source-ref: page-2-row-14
    ; ai-run: run_01J...
    expenses:food                 S$12.30
    assets:bank:checking
```

Example high watermark:

```journal
2026-07-31 * Bank statement high watermark
    ; watermark-id: wm_01J...
    ; reconciliation: rec_01J...
    ; statement: stmt_01J...
    assets:bank:checking          S$0 = S$2,345.67
```

The renderer owns:

- escaping
- spacing and alignment
- decimal and commodity formatting
- transaction status markers
- metadata keys
- inferred final posting policy
- deterministic ordering within a batch

## 10. Deterministic validation

Validation occurs before review, after every human edit, and immediately before promotion.

### 10.1 Source completeness

- Every document page or CSV region has been processed.
- Every extracted statement item has a source reference.
- Every statement item has exactly one disposition.
- No source reference appears twice unless explicitly linked as a correction or split.
- Extracted row counts and totals are consistent where the source provides them.

### 10.2 Accounting validation

- Every transaction balances exactly.
- All money uses arbitrary-precision decimal values.
- Every account and commodity is declared.
- No accidental cross-commodity balancing is permitted.
- Dates are valid and plausible for the statement.
- Transaction IDs and source IDs are unique.
- Existing-transaction matches are valid and not already consumed incompatibly.
- No candidate violates a prior watermark.

### 10.3 Statement arithmetic

Where signs are normalized consistently:

```text
opening balance + sum(statement movements) = closing balance
```

Running balances are checked row-by-row when available. Debit totals, credit totals, and transaction counts are checked against statement summaries when provided.

### 10.4 hledger validation

A temporary journal is assembled from the canonical reconciled journal plus the frozen staged revision and proposed assertions. At minimum run:

```bash
hledger -f temporary.journal check
hledger -f temporary.journal check -s ordereddates
```

`recentassertions` should be used as a reconciliation policy or scheduled health check; it need not block every transaction accepted after the latest periodic watermark.

Balance matching alone does not prove correctness because offsetting errors can cancel. Source provenance, independent criticism, and mandatory human review remain required.

## 11. Human review experience

The primary UI is a source-to-ledger review workspace.

```text
+--------------------------+-----------------------------+
| Original statement       | Candidate transaction       |
| Page, image, or CSV grid | Date, payee, and postings   |
| Highlight source item    | Amount, account, warnings   |
+--------------------------+-----------------------------+
| Opening | Debits | Credits | Closing | Difference      |
+--------------------------------------------------------+
```

The reviewer can:

- navigate source items;
- see the corresponding candidate immediately;
- inspect AI confidence and critic warnings;
- edit date, payee, note, amount, commodity, or account;
- split or merge items;
- match an item to an existing reconciled transaction;
- match or replace a staged manual transaction;
- mark an item ignored with a required reason;
- view the exact rendered journal patch;
- inspect statement arithmetic and resulting balances;
- approve each frozen transaction revision individually.

High confidence reduces visual noise but never skips human approval. Corrections made during review become retrievable examples for future AI runs, not mandatory deterministic import rules.

## 12. Approval and promotion protocol

Individual approval is the only transition from staged to reconciled. Reviewing a
statement can produce many staged transactions, but there is no bulk approval
operation.

```text
mutable staged work
        |
        v
freeze exact revision
        |
        v
acquire journal write lock
        |
        v
rebase and duplicate checks
        |
        v
render temporary immutable batch
        |
        v
validate complete journal
        |
        v
atomic batch-file rename
        |
        v
Git commit and database finalization
```

Detailed protocol:

1. Freeze the reviewed candidate revision and compute its hash.
2. Acquire a global journal promotion lock.
3. Reload the latest reconciled state.
4. Re-run duplicate, match, and watermark checks.
5. Render the proposed batch to a temporary file.
6. Assemble and validate the complete temporary journal.
7. Atomically rename the batch into `reconciled/`.
8. Write its content-addressed reconciliation manifest.
9. Commit the batch and manifest to Git.
10. Mark the database reconciliation record committed.
11. Refresh projections and read models.
12. Release the lock.

Filesystem, Git, and database changes cannot share one true transaction. Every step must therefore be idempotent. Startup and background recovery compare reconciliation IDs, batch hashes, Git state, and database state to finish or report interrupted promotions safely.

## 13. REST API

REST with OpenAPI is preferred over gRPC because it is directly usable from browsers and mobile clients and can generate TypeScript, Swift, and Kotlin clients.

Representative endpoints:

```text
POST   /v1/statements
GET    /v1/statements/{statementId}
GET    /v1/statements/{statementId}/source
POST   /v1/statements/{statementId}/compile
GET    /v1/statements/{statementId}/runs

GET    /v1/staged-transactions
GET    /v1/staged-transactions/{transactionId}
PATCH  /v1/staged-transactions/{transactionId}
DELETE /v1/staged-transactions/{transactionId}

POST   /v1/staged-transactions/{transactionId}/approve

GET    /v1/reconciled-transactions
GET    /v1/reconciled-transactions/{transactionId}
POST   /v1/reconciled-transactions/{transactionId}/corrections
POST   /v1/reconciled-transactions/{transactionId}/reversals

GET    /v1/accounts
GET    /v1/accounts/{accountId}
GET    /v1/accounts/{accountId}/watermarks
POST   /v1/accounts/{accountId}/watermarks

GET    /v1/reports/net-worth
GET    /v1/reports/expenses
GET    /v1/reports/register
```

There are deliberately no `PUT`, `PATCH`, or `DELETE` endpoints for reconciled transactions or watermarks.

All mutating commands require idempotency keys. Long-running AI compilation reports progress using server-sent events initially; WebSockets are unnecessary unless later interaction requires bidirectional streaming.

## 14. Proposed system architecture

Build a modular monolith before considering separate services:

```text
Web PWA / Phone app / Other clients
                 |
                 v
         REST/OpenAPI application
                 |
       +---------+----------+
       |                    |
Statement compiler     Accounting domain
       |                    |
AI provider adapters   Reconciliation service
       |                    |
Document storage       hledger engine adapter
       |                    |
       +---------+----------+
                 |
   +-------------+--------------+
   |             |              |
PostgreSQL   Object storage   Journal + Git
```

Proposed implementation stack:

- Python
- FastAPI and Pydantic
- PostgreSQL for workflow state, immutable revisions, and projections
- a background-job mechanism for model calls
- encrypted filesystem or S3-compatible object storage for source documents
- hledger CLI invoked through a narrow adapter
- responsive web/PWA frontend first

The hledger adapter owns subprocess execution and normalization. The rest of the application depends on domain interfaces, not hledger's JSON types.

## 15. Security and privacy

Financial statements are highly sensitive.

Requirements:

- encrypt source documents at rest;
- use TLS for all remote access;
- require authenticated users and short-lived sessions/tokens;
- never expose hledger-web directly to the network;
- never log statement bodies, model payloads, balances, or complete transactions by default;
- redact errors before sending them to observability systems;
- select AI providers with explicit no-training and suitable retention terms;
- make provider and model use visible in the review audit trail;
- support source-document deletion or retention policies without deleting reconciled provenance hashes;
- keep secrets outside Git;
- encrypt backups;
- audit reads of original statements and all approval actions.

## 16. AI reproducibility and provenance

Every compiler run records:

- run ID
- model provider and exact model version
- prompt/template version
- compiler code version
- source document hash
- retrieved context IDs and hashes
- chart-of-accounts version
- previous-watermark context
- raw structured model response
- normalized IR
- critic results
- token usage and latency

A rerun creates a new immutable revision. It never overwrites the previous result.

## 17. Golden evaluation corpus

Robustness depends more on evaluation than on prompt wording. Build a private golden corpus containing representative examples and approved outputs:

- native PDF statement
- scanned PDF
- photograph or screenshot
- CSV
- multi-page statement
- credit-card statement
- foreign-currency statement
- investment statement
- refunds and reversals
- transactions split across pages
- transfers between tracked accounts
- manually entered pending transaction later appearing on a statement
- ambiguous or illegible rows

For each fixture preserve:

- expected statement transcription
- expected source references
- expected dispositions
- expected typed ledger candidates
- expected hledger output
- expected validation warnings
- expected closing balance and watermark

Track at least:

- statement-row recall
- hallucinated row count
- duplicate row count
- date accuracy
- amount accuracy
- debit/credit accuracy
- running-balance consistency
- existing-transaction match accuracy
- categorization acceptance rate
- closing-balance agreement
- number and severity of human corrections

No prompt or model change should be promoted without running this corpus.

## 18. Test strategy

### 18.1 Unit tests

- IR schema and decimal handling
- deterministic renderer
- source-item disposition rules
- transaction balancing
- watermark monotonicity
- correction constraints
- API authorization and forbidden mutations
- content hashing and idempotency

### 18.2 Integration tests

- invoke the real pinned hledger binary;
- validate batches spanning multiple files;
- prove old-dated postings invalidate prior assertions;
- prove staged transactions never affect canonical reports;
- promote a complete statement atomically;
- recover from interruption after each promotion step;
- reject concurrent conflicting approvals;
- match transfers and existing transactions;
- produce and query high watermarks.

### 18.3 End-to-end tests

- upload source document;
- compile and critique;
- review and edit;
- approve;
- observe new immutable batch;
- verify hledger balance and assertion;
- query the result through REST;
- submit a later correction without mutating history.

## 19. Delivery phases

### Phase 0: contracts and accounting prototype

- Pin an hledger version.
- Define transaction, statement, reconciliation, and watermark schemas.
- Implement deterministic journal renderer.
- Implement hledger adapter and core validation.
- Prove immutable multi-file batches and date-aware watermark behavior.
- Decide metadata and account declaration conventions.

### Phase 1: first complete vertical slice

Support one representative statement from upload through approval:

1. encrypted upload;
2. AI transcription;
3. AI accounting compilation;
4. typed candidate revision;
5. deterministic checks;
6. minimal source/candidate review UI;
7. human approval;
8. immutable batch and high watermark;
9. REST query of reconciled results.

Do not build dashboards, budgets, or a native phone app before this works reliably.

### Phase 2: robustness

- independent AI critic;
- PDF/image/CSV variations;
- page-level source evidence;
- golden-corpus evaluation automation;
- historical-context retrieval;
- transfer and existing-transaction matching;
- pending manual-entry matching;
- crash recovery and concurrent-approval tests.

### Phase 3: complete accounting workflow

- corrections, reversals, and reclassifications;
- multi-account reconciliation;
- foreign currencies and investment accounts;
- watermark health monitoring;
- projections and standard reports;
- notifications for statements awaiting review or accounts lacking recent watermarks.

### Phase 4: additional clients and operations

- polished PWA;
- native phone app only if the PWA is insufficient;
- deployment hardening;
- encrypted backup and restore drills;
- provider fallback;
- operational metrics and cost controls.

## 20. Success criteria

The first production-worthy version must demonstrate:

1. A user can upload a CSV, PDF, or image without writing an import rule.
2. AI produces a complete source-mapped candidate rather than raw unauditable text.
3. The system detects arithmetic, balancing, duplication, and watermark violations deterministically.
4. The user can efficiently compare every proposed result with source evidence.
5. No transaction becomes accounting truth without explicit human approval.
6. Approval creates an immutable hledger batch and auditable reconciliation manifest.
7. A balance assertion establishes a queryable account high watermark.
8. Reconciled history cannot be changed through the REST API.
9. Corrections create new linked entries.
10. Interrupted or repeated approval requests cannot duplicate or corrupt accounting data.
11. Model or prompt regressions are caught by the golden evaluation corpus.

## 21. Open decisions

These should be resolved during Phase 0 without changing the core architecture:

- AI provider(s), privacy terms, and fallback policy
- hosting and authentication model
- source-document retention duration
- exact database and background-job technology
- chart-of-accounts declaration and naming conventions
- handling of transactions that affect two separately watermarked real-world accounts
- exact correction-date and reporting policy
- global-close UX for a set of account watermarks
- offline requirements for the eventual phone client
- whether reviewer corrections should be retrieved as examples automatically or curated first

The default recommendation is individual transaction approval, strict closed-period accounting, explicit declared accounts/commodities, and automatic retrieval of previously approved similar transactions as AI context.
