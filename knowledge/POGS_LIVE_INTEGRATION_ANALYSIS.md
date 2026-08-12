# POGS Live Integration Analysis

## Purpose

This document summarizes the real current state of the `medical_automation` project versus the actual locally running POGS application in `C:\pogs\node-pogs`.

It is meant to answer four questions:

1. What is already built in `medical_automation`?
2. What does the live POGS app actually require?
3. How feasible is automatic upload from Excel and Google Docs?
4. What is the safest implementation path for reliable automation?

## Executive Summary

Automatic upload into the local POGS app is technically feasible.

The main blocker is not transport or authentication. The main blocker is schema completeness.

The current project can already:

- ingest raw cases from Google Docs or replay local raw case files
- parse some demographic and clinical fields
- classify pregnancy vs gyne vs postpartum
- map a very small confirmed subset of gyne diagnoses
- build a partial POGS candidate
- validate the partial candidate
- route cases into `for_checking` or `gaps`
- generate knowledge and regression artifacts

The current project cannot yet reliably:

- populate the full live POGS case schema
- satisfy live pregnancy and delivery requirements
- build neonatal arrays correctly
- determine all conditional branches required for close-ready submission
- safely perform unattended end-to-end POGS case close/submission

The correct near-term target is draft case creation, not full close-ready automation.

## Current `medical_automation` Progress

### What is actually implemented

The active workflows are:

- `workflows/case-new-processing.json`
- `workflows/knowledge-regression.json`

The active processing workflow currently performs:

1. Read raw cases from `data/raw_cases/new`
2. Normalize Google Docs content into plain text
3. Parse selected demographic and clinical fields
4. Classify the case as pregnancy, gyne, and/or postpartum
5. Extract a few deterministic diagnosis terms
6. Map only one currently confirmed gyne diagnosis path
7. Build a partial POGS candidate
8. Validate the candidate conservatively
9. Generate knowledge and regression artifacts
10. Route cases to `for_checking` or `gaps`

### What is not implemented

There is no active `pogs-processing` workflow yet.

The only create/update logic for POGS exists in:

- `workflows/medical_automation(outdated for reference only).json`

That file is useful as historical reference only. It should not be treated as production-ready because:

- it predates the current split-workflow architecture
- it uses older node wiring assumptions
- it requires multi-item safety review
- it is not aligned to the fully reverse engineered live POGS schema

## Regression Evidence

Latest regression summary:

- file: `logs/latest-regression.json`
- generated at: `2026-08-09T22:37:42.988Z`
- total cases: 29
- ready for POGS: 0
- not ready for POGS: 29
- total mapped terms: 0
- total unresolved terms: 4
- total validation issues: 36
- total unsatisfied rules: 9

Interpretation:

- the pipeline is functioning as a parser/triage engine
- it is not yet functioning as a live POGS uploader
- the zero ready count is expected given the intentional pregnancy safety block and incomplete schema coverage

## Live POGS Reverse Engineering Findings

Primary live source locations:

- `C:\pogs\node-pogs\app\routes\pogs.routes.js`
- `C:\pogs\node-pogs\app\models\pogs-patient.model.js`
- `C:\pogs\node-pogs\app\models\pogs-case.model.js`
- `C:\pogs\node-pogs\app\controllers\pogs-case.controller.js`
- `C:\pogs\node-pogs\app\controllers\pogs-case-validations.js`
- `C:\pogs\node-pogs\app\controllers\pogs-patient.controller.js`
- `C:\pogs\node-pogs\app\controllers\pogs-submissions.controller.js`
- `C:\pogs\node-pogs\app\references\index.js`
- `C:\pogs\node-pogs\public\js\app.66ef3b47.js.map`

Important reverse engineering conclusion:

The live frontend currently served by POGS comes from `public/js/app.66ef3b47.js`, not from older root bundle files.

That means the safest source of truth is:

1. live backend controllers and models
2. live frontend source map in `public/js/app.66ef3b47.js.map`
3. live reference datasets in `app/references`

## Real POGS Integration Shape

### Authentication and write path

The local POGS API supports:

- `POST /api/accounts/login`
- `GET /api/patientcases`
- `POST /api/patientcases`
- `POST /api/patients`
- `POST /api/patients/:patientid/cases`
- `PUT /api/patients/:patientid/cases/:caseid`
- `PUT /api/patients/:patientid/cases/:caseid/close`

This means browser automation is not required for normal create and update operations.

### Patient schema

Live patient fields are minimal:

- `firstName` required
- `birthDate` required
- `middleName` optional
- `lastName` optional
- `avatar` optional
- `isArchived` internal

The live app often uses `caseNum` as placeholder patient name values. That is strange but it means patient creation is not the hard part.

### Case schema

The live case model is much larger than the current candidate.

The current knowledge artifact `knowledge/pogs-form-rules.json` already captures 102 live form fields.

Examples of major live field groups:

- admission and demographics
- obstetric score
- pregnancy classification
- delivery details
- neonatal records
- comorbidities and histories
- gyne diagnosis and procedures
- GTD branches
- PCOS branches
- maternal outcome and mortality branches
- MIGS information

## Coverage Gap: Current Project vs Live POGS

The current `Build POGS Candidate` output contains about 20 top-level fields.

Only 12 of those directly align to live POGS form-rule fields:

- `admissionDate`
- `room`
- `weight`
- `height`
- `isPostpartum`
- `obscoreG`
- `obscoreP`
- `obscoreFT`
- `obscorePr`
- `obscoreAb`
- `obscoreLB`
- `gynecologicalDiagnosis`

Major live fields still not produced by the current project include:

- `age`
- `bmi`
- `caseFormType`
- `admissionAOGType`
- `admissionAOG`
- `pregnancyType`
- `isDelivered`
- `institutionalDelivery`
- `infantsNumber`
- `deliveryDate`
- `deliveryManner`
- `deliveryIndication`
- `isTOLAC`
- `complicatedPregnancy`
- `isInduced`
- `morbidities`
- `medicalHistory`
- `obstetricHistory`
- `concomitantProcedure`
- `obProcedure`
- `neonatal`
- `pcosHistory`
- `pcosSymptoms`
- `gyneOrgan`
- `organCondition`
- `gtdDiagnosis`
- `dischargeDate`
- `motherCondition`
- `deathTiming`
- `deathReviewed`
- `MIGSSurgeon`
- `MIGSAssist`

This is the core reason full automatic upload is not ready yet.

## Feasibility Assessment

### Feasible now or soon

These are realistic in the current architecture:

1. Create draft POGS patient records
2. Create draft POGS case records
3. Update existing open POGS cases
4. Search duplicates by `caseNum`
5. Persist partial mappings and unresolved gaps locally
6. Block unsafe cases before close

### Feasible with moderate work

These are realistic if the parser and rule engine are expanded:

1. Calculate `bmi` deterministically from weight and height
2. Populate `age` from birth date and admission date
3. Extract more deterministic pregnancy and delivery facts
4. Build deterministic conditional field applicability
5. Populate structured array fields such as `medicalHistory`, `morbidities`, and `neonatal`
6. Perform safe create-versus-update logic against the local POGS API

### Not yet safe for unattended production

These are currently not reliable enough:

1. Auto-closing every case after upload
2. Full pregnancy submission without missing branch logic
3. Full neonatal completion without deterministic extraction
4. End-to-end unattended final plotting of all POGS-required data from arbitrary source documents

## Why Transport Is Not the Problem

The live POGS app exposes a clear local API.

The difficult parts are:

- conditional field visibility
- conditional required logic
- reference ID correctness
- field-group branching
- structured nested arrays
- close-case validation alignment

This is good news.

It means the engineering challenge is controllable. We do not need fragile browser clicks first. We need a reliable schema-driven writer.

## Best Automation Strategy

### Phase 1: Draft-only integration

Recommended immediate path:

1. Login to local POGS API
2. Search for existing case by `caseNum`
3. If found, update the open case
4. If not found, create placeholder patient
5. Create draft case with only verified fields
6. Keep `isClose = false`
7. Store unresolved required fields in local knowledge and gaps

This delivers value quickly while staying safe.

### Phase 2: Schema-complete candidate building

Expand the rule engine so it can produce:

- demographic completion
- pregnancy branch completion
- delivery branch completion
- maternal outcome branch completion
- neonatal subdocuments
- gyne and GTD branch completeness
- exact reference-coded arrays

### Phase 3: Safe close automation

Only after deterministic validation matches the live POGS close behavior should the automation call:

- `PUT /api/patients/:patientid/cases/:caseid/close`

That close step should only run when all applicable fields are confirmed.

## Important POGS Behaviors to Preserve

The live backend has behaviors that the automation must respect:

- case close uses backend validation rules, not just frontend assumptions
- neonatal completion rules are conditional on infant status and anomaly flags
- `false` is valid for booleans; only `null` and `undefined` should be treated as missing
- admission and discharge dates are range-validated
- multiple pregnancy and delivery branches can change required fields
- patient naming may be auto-updated using `caseNum`

## Recommended Source of Truth Inside This Project

Use these local project files as the integration contract:

- `knowledge/pogs-live-integration-schema.json`
- `knowledge/pogs-form-rules.json`
- `knowledge/pogs-reference-values.json`
- `knowledge/clinical-automation-semantic-layer-v1.3.0.json`

Recommended authority order:

1. live POGS backend and live source map
2. `pogs-live-integration-schema.json`
3. `pogs-form-rules.json`
4. workflow implementation

If the workflow disagrees with the live POGS app, the live POGS app wins.

## Practical Conclusion

The project is real and viable.

The current progress is best described as:

- strong ingestion and reasoning foundation
- partial gyne mapping
- good regression architecture
- incomplete live POGS write layer
- incomplete schema coverage for close-ready automation

So yes, automatic upload from Excel and Google Docs into the local POGS app is feasible.

But the correct claim today is:

- draft upload is feasible now
- reliable full automatic submission is not yet complete

The immediate engineering goal should be:

build a schema-driven `pogs-processing` workflow that creates and updates draft cases using the live API, while keeping close automation disabled until the candidate covers the live conditional rules.
