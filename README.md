# Medical Automation Pipeline

## Full Description

This project is a local, privacy-focused clinical automation pipeline designed to reduce repetitive manual encoding work while keeping patient data under local control.

The system begins with clinical cases referenced from Google Sheets. Each selected spreadsheet row contains a Google Docs smart chip or document link. The workflow retrieves the corresponding Google Doc, preserves a raw local copy of the source document structure, extracts and normalizes clinically relevant information, classifies the case, recognizes diagnosis terms, maps only confirmed clinical values to POGS reference values, validates the resulting case candidate, and routes the case according to whether it is safe to continue.

The automation is not intended to replace clinical review. Its purpose is to make first-pass extraction, normalization, validation, mapping, and local POGS preparation deterministic, reproducible, and auditable.

POGS remains the final clinical system. The automation is intentionally limited to the local POGS API. It does not automate POGS cloud submission. Human review remains a required control before a case is treated as completed and ready for the existing POGS cloud-submission process.

The system follows these principles:

1. **Patient data stays local whenever possible.** Raw Google Docs case data is archived locally and is not intended to be shared externally.
2. **The automation never invents clinical mappings.** POGS category IDs, condition IDs, stages, and other reference-coded values are used only when confirmed.
3. **Uncertainty is preserved instead of hidden.** Missing, ambiguous, unresolved, unsupported, or suspicious values become gaps rather than guesses.
4. **Automation success does not equal clinical approval.** A case that passes automated validation still goes to a human-review queue.
5. **Folder location is the source of truth for raw-case state.** Raw JSON files do not carry lifecycle/status fields.
6. **Raw cases are globally deduplicated.** Once a Google document exists in any raw-case folder, it must not be recreated.
7. **Regression testing is isolated from live POGS writes.** Archived raw cases can be replayed without allowing writes to POGS.
8. **Knowledge files are sanitized.** They store mapping, validation, rule, and regression information rather than raw patient narratives.

The project combines four related systems:

- Google Sheets / Google Docs ingestion
- deterministic clinical parsing and mapping
- local POGS integration
- local raw-case, knowledge, and regression tooling

The intended lifecycle is:

```text
Google Sheets / Google Docs
        |
        v
Global raw-case duplicate check
        |
        +-- already known --> no duplicate raw file
        |
        +-- new document --> raw_cases/new
                               |
                               v
                     Clinical processing
                               |
                  +------------+-------------+
                  |                          |
                  v                          v
           automation passes          blocking gap found
                  |                          |
                  v                          v
        raw_cases/for_checking         raw_cases/gaps
                  |
                  v
             manual review
             /           \
            /             \
           v               v
raw_cases/completed   raw_cases/gaps
```

A manually reviewed case in `completed` is considered accepted by the human review process and ready to proceed through the existing POGS/cloud-submission process. The n8n automation itself still stops before POGS cloud submission.

---

## Technical Architecture

### Project Root

Canonical Windows project root:

```text
C:\dev\AI_Automation\medical_automation
```

Primary directories:

```text
C:\dev\AI_Automation\medical_automation
├── data
│   └── raw_cases
│       ├── new
│       ├── for_checking
│       ├── gaps
│       └── completed
├── knowledge
├── logs
└── compose/project files
```

Docker-visible paths:

```text
/data/cases/raw_cases/new
/data/cases/raw_cases/for_checking
/data/cases/raw_cases/gaps
/data/cases/raw_cases/completed
/data/knowledge
/data/logs
```

Recommended compose mounts:

```yaml
volumes:
  - medical_automation_n8n_data:/home/node/.n8n
  - ./data:/data/cases
  - ./knowledge:/data/knowledge
  - ./logs:/data/logs
```

n8n filesystem restriction:

```yaml
- N8N_RESTRICT_FILE_ACCESS_TO=/data/cases;/data/knowledge;/data/logs
```

Recommended `.gitignore` entries:

```gitignore
.env
*.env
secrets/
data/
knowledge/
logs/
backups/
*.jsonl
*.log
```

---

## Configuration Separation

Environment-specific and confidential configuration should live outside this README.

Examples include:

```text
Google spreadsheet identifiers
worksheet/tab configuration
production row ranges
Google OAuth configuration
POGS credentials
API tokens
local secrets
patient/case identifiers
```

Documentation should describe the expected configuration shape without embedding the actual values.

---

## Runtime Environment

### n8n

The workflow runs on a self-hosted n8n instance inside Docker Desktop / WSL2.

Observed environment:

```text
n8n version: 2.33.4 Self Hosted
container: <local-n8n-container>
compose project: <local-compose-project>
local bind: 127.0.0.1:5678
```

The n8n instance should remain bound to localhost and should not be publicly exposed.

### POGS

POGS runs locally on Windows.

```text
POGS Express API: 127.0.0.1:3000
MongoDB:          127.0.0.1:27017
Database:         pogsv7
```

From the n8n Docker container:

```text
host.docker.internal:3000
```

Neither POGS port `3000` nor n8n port `5678` should be publicly exposed.

MongoDB 3.4 access control is currently disabled, so local host/network isolation is important.

---

## Security Model

### Documentation Sanitization

This README is intentionally architecture-focused and must remain safe to store in source control or share with authorized developers.

Do not place the following in this README:

- spreadsheet IDs
- worksheet/tab names tied to production data
- gids or production row ranges
- Google document IDs
- raw-case IDs from real patients
- case numbers or hospital numbers
- patient names, addresses, dates of birth, or other patient identifiers
- OAuth client details
- access tokens or refresh tokens
- JWTs
- usernames or passwords
- production secrets
- confidential URLs containing identifiers or credentials

Use placeholders such as `<SPREADSHEET_ID>`, `<DOCUMENT_ID>`, `<RAW_CASE_ID>`, and `<LOCAL_CONFIG>` when an example requires an identifier.

- Do not expose n8n or POGS directly to the public internet.
- Do not commit credentials, OAuth tokens, JWTs, passwords, or patient data to Git.
- Do not place secrets in raw, knowledge, or regression files.
- Do not send raw patient cases outside the controlled local environment unless explicitly required.
- Do not automate POGS cloud submission.
- Do not guess POGS reference IDs.
- Keep regression mode incapable of entering the live POGS write branch.
- Keep n8n environment-variable access restrictions enabled unless there is a strong reason to change them.

---

## Raw Case Storage Model

Raw cases are source-oriented JSON snapshots.

Example:

```json
{
  "rawCaseId": "RAW-DOC-...",
  "documentId": "...",
  "capturedAt": "...",
  "googleDoc": {}
}
```

Do **not** put workflow lifecycle fields inside the JSON:

```text
status
lifecycle
manualReview
automationResult
```

The folder is the workflow state.

### `new`

Newly discovered and archived; automated processing has not yet completed.

### `for_checking`

Automation passed without a blocking issue. Human review is still required.

### `gaps`

A blocking issue, missing value, unsupported requirement, ambiguous result, incorrect result, or other problem requires investigation.

A reviewer may manually move an apparently valid case from `for_checking` to `gaps`.

### `completed`

The case was manually reviewed and accepted.

This means the case is ready for the existing POGS/cloud-submission process. n8n still does not perform the cloud submission.

---

## Global Raw Case Deduplication

Each Google Doc receives a stable raw-case identity derived from its Google `documentId`.

Example:

```text
RAW-DOC-<stable-id>
```

Before writing a newly extracted Google Doc, ingestion checks:

```text
raw_cases/new
raw_cases/for_checking
raw_cases/gaps
raw_cases/completed
```

If the same `rawCaseId` exists in any folder, no new raw file is created.

If it exists nowhere, it is written to:

```text
raw_cases/new
```

Core invariant:

```text
one Google document
=
one rawCaseId
=
one raw-case file
=
one current folder
```

---

## Stable Raw Case Identity

A deterministic ID is generated from the Google document ID.

```javascript
function stableHash(value) {
  const str = String(value);
  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c6ce57;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }

  hash1 =
    Math.imul(hash1 ^ (hash1 >>> 16), 2246822507) ^
    Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);

  hash2 =
    Math.imul(hash2 ^ (hash2 >>> 16), 2246822507) ^
    Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);

  return (
    (hash2 >>> 0).toString(16).padStart(8, "0") +
    (hash1 >>> 0).toString(16).padStart(8, "0")
  );
}

const rawCaseId = `RAW-DOC-${stableHash(documentId)}`;
```

The ID must be derived from the current Google Docs item, not from a backward `$node[...]` reference that can misassociate items during batch execution.

---

## Google Sheets Ingestion

Clinical cases are discovered from an authorized Google Sheets source.

The relevant spreadsheet rows contain Google Docs smart chips or document links. The workflow should use bounded Sheets API ranges rather than repeatedly retrieving an entire workbook, both for efficiency and to reduce unnecessary API access.

Configuration-specific values such as the spreadsheet ID, worksheet/tab name, gid, column location, and production row ranges must **not** be stored in this README. They should be maintained in the local workflow configuration or another appropriately protected local configuration source.

Conceptual bounded request:

```text
GET https://sheets.googleapis.com/v4/spreadsheets/<SPREADSHEET_ID>?includeGridData=true&ranges=<ENCODED_RANGE>
```

The Sheets response is one n8n item containing `rowData[]`, so `Extract Google Doc Link` runs:

```text
Run Once for All Items
```

and emits one item per discovered document.

No production spreadsheet identifiers, worksheet names, or row locations should be committed to documentation intended for sharing or source control.

---

## Google Docs Retrieval

The Google Docs node retrieves the document using:

```text
{{ $json.documentId }}
```

The raw Google Docs API response serves two purposes:

1. raw archival
2. clinical normalization

The raw archive preserves the Google Docs API structure rather than only flattened text.

---

## Main Workflow

```text
Google Sheets
→ HTTP Request - Get Smart Chip(s)
→ Extract Google Doc Link
→ Extract Google Doc Text
→ Normalize Data
→ Parse Clinical Sections
→ Classify Case Type
→ Extract Diagnosis Terms
→ Map Diagnosis to POGS References
→ Build POGS Candidate
→ Validate POGS Candidate
```

From validation, separate branches handle:

```text
A. live POGS eligibility
B. knowledge generation
C. regression reporting
D. raw-case routing
```

Raw archival begins from the raw Google Docs response rather than from normalized clinical text.

---

## Normalize Data

`Normalize Data` converts raw Google Docs API JSON into:

```json
{
  "title": "...",
  "documentText": "...",
  "runContext": {}
}
```

It recursively extracts paragraph text, table content, nested cell content, and table-of-contents content.

Execution mode:

```text
Run Once for Each Item
```

Regression replay uses:

```json
{
  "mode": "REGRESSION",
  "rawCaseId": "RAW-DOC-..."
}
```

Live processing defaults to:

```json
{
  "mode": "LIVE",
  "rawCaseId": null
}
```

---

## Clinical Parsing

`Parse Clinical Sections` extracts deterministic structured fields including:

- patient name
- hospital number
- address
- birth date
- age
- sex
- admission date/time
- discharge date
- obstetric score
- selected medical-history flags
- blood pressure
- heart rate
- respiratory rate
- oxygen saturation
- temperature
- weight
- height
- reason for admission
- history of present illness
- final diagnosis
- course in ward

Birth-date labels currently supported include:

```text
Birthday
Birthdate
Birth Date
Date of Birth
DOB
```

Supported observed date formats include:

```text
M/D/YYYY
MM/DD/YYYY
M-D-YYYY
MM-DD-YYYY
```

Dates are normalized to `MM/DD/YYYY` before later conversion to POGS ISO format.

---

## Case Classification

`Classify Case Type` determines:

```text
isPregnancy
isGyne
isPostpartum
```

Classification is deterministic and retains evidence.

Examples:

```text
Current-pregnancy terminology found
Gynecologic diagnosis/condition terminology found
```

Classification uncertainty must not be silently turned into a valid POGS candidate.

---

## Diagnosis Recognition

The recognition layer identifies terms before mapping.

Current recognized concepts include:

```text
abnormal uterine bleeding
submucous myoma
endometrial thickening
anemia
acute blood loss
obesity
blood transfusion
endometrial sampling
DMPA
```

Each recognized term is classified as:

```text
mapped
unresolved
ignored
```

Recognition and mapping remain separate.

---

## POGS Mapping Policy

Only confirmed POGS mappings are written automatically.

Confirmed gyne mapping:

```text
Source:
Prolapsed submucous myoma

POGS:
categoryId  = 12
conditionId = 114
gyneStage   = 6
```

Stored shape:

```json
{
  "conditionId": 114,
  "categoryId": 12,
  "gyneStage": 6,
  "others": null,
  "othersField": null
}
```

Known reference meanings:

```text
categoryId 12
= Benign Neoplasm of the Uterus

conditionId 114
= Leiomyoma
```

`gyneStage: 6` is treated as the POGS/frontend value used for these nonmalignant diagnoses, not as an independently inferred clinical cancer stage.

Do not map:

```text
Endometrial thickening
```

to:

```text
Endometrial hyperplasia, unspecified
```

merely because POGS condition `116` exists.

Anemia, acute blood loss, and obesity are not automatically treated as `gynecologicalDiagnosis`.

Blood transfusion, endometrial sampling, and DMPA are recognized as treatment/procedure/medication concepts and ignored for `gynecologicalDiagnosis`.

---

## Build POGS Candidate

Primary candidate fields:

```text
caseNum
birthDate
admissionDate
room
weight
height
isPregnancy
isGyne
isPostpartum
obscoreG
obscoreP
obscoreFT
obscorePr
obscoreAb
obscoreLB
gynecologicalDiagnosis
unresolvedDiagnoses
ignoredDiagnosisTerms
classificationEvidence
source
runContext
```

Dates are converted from:

```text
MM/DD/YYYY
```

to:

```text
YYYY-MM-DD
```

before POGS API use.

---

## Validation Model

`Validate POGS Candidate` is the automated safety gate before a live candidate may proceed toward POGS.

Current checks include:

- case number
- birth date
- admission date
- classification completeness
- pregnancy/gyne classification consistency
- OB-score sanity
- missing weight warning
- missing height warning
- confirmed gyne diagnosis requirement
- unresolved-term warnings

### Pregnancy Cases

Pregnancy-specific required rules are handled separately.

Until those rules are implemented and explicitly validated:

```text
isPregnancy = true
→ issue:
  "Pregnancy-specific POGS validation pending"
→ readyForPOGS = false
```

This is an intentional safety boundary.

### Gyne Cases

Gyne cases require at least one confirmed POGS `gynecologicalDiagnosis` mapping.

Unresolved terms remain warnings unless a future deterministic rule makes them required.

---

## Candidate Ready Gate

The live POGS branch is protected by:

```javascript
{{
  $json.validation.readyForPOGS === true
  &&
  $json.runContext?.mode !== "REGRESSION"
}}
```

This prevents both invalid cases and regression replays from reaching the live POGS write path.

---

## Raw Case Routing

Automation result:

```text
passes validation
→ new → for_checking
```

```text
blocking issue
→ new → gaps
```

Manual review:

```text
for_checking → completed
```

or:

```text
for_checking → gaps
```

A reviewer may reject a case even when automation passed it.

---

## POGS Local API Integration

Known useful endpoints:

```text
GET  /ping
POST /api/accounts/login
POST /api/patientcases
GET  /api/patientcases?search=<caseNum>
POST /api/patients/:patientid/cases
GET  /api/patients/:patientid/cases/:caseid
PUT  /api/patients/:patientid/cases/:caseid
```

Authentication:

```text
POST /api/accounts/login
```

Subsequent calls use:

```text
Authorization: Bearer <token>
```

Credentials and JWTs must never be stored in raw, knowledge, regression, or repository files.

---

## POGS Duplicate Checking

Current path:

```text
POGS - Check Existing Case
→ Normalize Case Check
→ Case Already Exists?
```

Before enabling large live batches, all backward node references in this branch must be audited for multi-item correctness.

A search result, patient ID, case ID, or write request from one candidate must never be associated with another candidate.

---

## POGS Write Boundary

The automation may:

- authenticate locally
- search local POGS
- create a local patient placeholder
- create a local POGS case
- update a local POGS case when intentionally implemented
- verify the local POGS result

The automation must not:

- automate POGS cloud submission
- bypass final clinical review
- guess missing clinical reference values

---

## Knowledge Layer

The knowledge layer stores sanitized case-level mapping and validation information.

It should help answer:

- which terms are recognized
- which terms map successfully
- which terms remain unresolved
- which rules are satisfied
- which cases need mapping review
- whether a change improved or regressed behavior

Knowledge files should not contain:

- patient names
- addresses
- full HPI
- full final diagnosis narratives
- raw Google Docs data
- OAuth tokens
- JWTs
- passwords

Each case has one current stable knowledge file:

```text
/data/knowledge/CASE-<id>.json
```

The current file is overwritten rather than duplicated.

---

## Knowledge Comparison

Comparison happens before the current knowledge file is overwritten.

Intended order:

```text
Build Knowledge Record
   ├──────────────→ Merge Knowledge + Previous (Input 1)
   │
   └→ Read Existing Knowledge File
            └────→ Merge Knowledge + Previous (Input 2)

Merge Knowledge + Previous
→ Compare Knowledge Record
→ Write Current Knowledge
```

Operational fields should not create false semantic changes.

Comparison ignores fields such as:

```text
lastUpdatedAt
timestamp
executionId
capturedAt
runContext
```

---

## Regression Replay

Archived raw cases can be replayed locally without Google API calls.

Regression mode:

```json
{
  "mode": "REGRESSION",
  "rawCaseId": "RAW-DOC-..."
}
```

Typical path:

```text
Manual Trigger
→ Read Raw Case File(s)
→ Load Raw Case
→ Normalize Data
→ Parse Clinical Sections
→ Classify Case Type
→ Extract Diagnosis Terms
→ Map Diagnosis to POGS References
→ Build POGS Candidate
→ Validate POGS Candidate
→ Build Knowledge Record
→ Compare Knowledge Record
→ Regression Summary
```

Regression must never write to POGS.

---

## n8n Binary File Handling

External binary storage means direct access such as:

```javascript
$binary.data.data
```

is not reliable.

Use:

```javascript
await this.helpers.getBinaryDataBuffer(
  itemIndex,
  binaryPropertyName
);
```

For multiple items, use the correct item index such as `$itemIndex`, not a constant `0`.

---

## Regression Summary

The regression summary tracks:

```text
totalCases
NEW
IMPROVED
REGRESSED
CHANGED
UNCHANGED
UNKNOWN
readyForPOGS
notReadyForPOGS
totalMappedTerms
totalUnresolvedTerms
totalValidationIssues
totalWarnings
totalUnsatisfiedRules
totalUnknownFields
needsAttention
allCasesStable
```

Current summary file:

```text
/data/logs/latest-regression.json
```

It is overwritten by the latest regression run.

---

## Current Validated Parser Baseline

Before the pregnancy safety gate was reintroduced, the current parser regression set reached:

```text
11 total cases
10 unchanged
1 improved
0 regressed
0 parser validation issues
allCasesStable = true
```

The previously failing case using the source label `Birthdate` was fixed by expanding the accepted birth-date labels.

Because pregnancy candidates are now intentionally blocked pending their separate rules, future `readyForPOGS` totals should reflect that policy rather than the earlier 11/11-ready baseline.

---

## Current Gyne Mapping State

One current gyne regression case contains:

```text
1 mapped diagnosis
5 unresolved terms
3 ignored procedure/intervention terms
```

Confirmed:

```text
Leiomyoma
categoryId 12
conditionId 114
gyneStage 6
```

Current unresolved terms:

```text
Abnormal uterine bleeding
Endometrial thickening
Anemia
Acute blood loss
Obesity
```

Current ignored terms:

```text
Status post blood transfusion
Status post ultrasound guided endometrial sampling
Status post DMPA injection
```

These distinctions are intentional.

---

## Node Execution Modes

### Run Once for All Items

```text
Extract Google Doc Link
Load Raw Case
Regression Summary
```

### Run Once for Each Item

```text
Normalize Data
Parse Clinical Sections
Classify Case Type
Extract Diagnosis Terms
Map Diagnosis to POGS References
Build POGS Candidate
Validate POGS Candidate
Build Knowledge Record
Knowledge Record to File
Build Raw Case Snapshot
Raw Case to File
Compare Knowledge Record
```

Correct execution mode is important for multi-case safety.

---

## Raw Archive File Conversion

Raw JSON is converted to binary for the n8n file-write node.

```javascript
const record = $json;
const content = JSON.stringify(record, null, 2);

return {
  json: {
    rawCaseId: record.rawCaseId,
    fileName: `${record.rawCaseId}.json`
  },
  binary: {
    data: {
      data: Buffer.from(content, "utf8").toString("base64"),
      mimeType: "application/json",
      fileName: `${record.rawCaseId}.json`
    }
  }
};
```

With the new folder model, unseen files should be written to:

```text
/data/cases/raw_cases/new/<rawCaseId>.json
```

---

## Planned Raw Case Refactor

Next implementation work:

1. create `new`, `for_checking`, `gaps`, and `completed`
2. check all four folders for duplicate `rawCaseId`
3. write unseen Google Docs only to `new`
4. route automated passes from `new` to `for_checking`
5. route blocking failures from `new` to `gaps`
6. allow manual `for_checking → completed`
7. allow manual `for_checking → gaps`
8. ensure a raw case never exists in multiple folders
9. update regression replay for the new folder layout

---

## Deferred Pregnancy Rules

Pregnancy-specific POGS rules use a separate rules/file workflow and are not yet fully implemented.

Until they are:

```text
pregnancy case
→ pregnancy-specific validation pending
→ readyForPOGS = false
```

This is a safety boundary, not a parser failure.

The eventual pregnancy workflow should explicitly validate all required pregnancy-specific POGS fields before allowing the case to become ready.

---

## Multi-Item Safety Work Still Required

Before production batch writes are enabled, explicit backward node references in the live POGS branch must be audited.

Priority nodes:

```text
POGS - Check Existing Case
Normalize Case Check
Create Patient Case Record
Create Case
POGS - Verify Created Case
```

The workflow must preserve one-to-one item identity throughout the batch.

Live batch writes should remain disabled until this is verified.

---

## Manual Review Philosophy

Human review is part of the system design.

Automation answers:

```text
Did this case pass all currently implemented deterministic rules?
```

Human review answers:

```text
Is this case actually correct and acceptable?
```

A case may therefore be automation-valid but human-invalid, in which case it moves from:

```text
for_checking
```

to:

```text
gaps
```

---

## Improvement Loop

```text
Real local case
→ raw archive
→ deterministic parser
→ deterministic mapping
→ validation
→ human review
→ identify gap
→ improve parser/mapping/rule
→ replay regression set
→ compare results
→ deploy only when stable
```

This allows real-world case variation to improve the system while keeping raw patient data local.

---

## Project Boundaries

The project is intended to automate:

- source discovery
- Google document retrieval
- local raw archival
- text normalization
- structured clinical extraction
- deterministic classification
- diagnosis recognition
- confirmed POGS mapping
- automated validation
- local POGS preparation
- local POGS creation/verification when allowed
- knowledge generation
- regression testing
- gap detection
- human-review queue management

The project is not intended to automate:

- unsupported clinical inference
- speculative diagnosis mapping
- final clinical approval
- POGS cloud submission
- removal of human review from ambiguous cases

---

## Current Priority Order

1. Finish raw-case folder restructuring.
2. Implement global duplicate detection across all raw-case folders.
3. Route unseen raw cases into `new`.
4. Route automated passes into `for_checking`.
5. Route blocking cases into `gaps`.
6. Preserve manual movement to `completed` or `gaps`.
7. Update regression replay for the new folder layout.
8. Keep pregnancy candidates blocked until separate pregnancy rules are implemented.
9. Continue expanding confirmed gyne mapping coverage.
10. Audit all live POGS nodes for multi-item identity safety.
11. Only then enable controlled live batch POGS writes.
12. Keep POGS cloud submission outside n8n.

---

## Design Summary

The system should always prefer:

```text
deterministic extraction
over guessing

confirmed POGS references
over approximate mapping

visible gaps
over silent assumptions

human review
over false confidence

local storage
over unnecessary data exposure

regression testing
over untested workflow changes
```

The objective is a controlled clinical automation pipeline that reduces repetitive POGS encoding work while preserving traceability, local privacy, deterministic behavior, and human clinical oversight.
