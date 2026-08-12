import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : medical_automation(outdated for reference only)
// Nodes   : 46  |  Connections: 47
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// WhenClickingExecuteWorkflow        manualTrigger
// ExtractGoogleDocsLink              code
// ExtractRowData                     httpRequest                [creds]
// ParseClinicalSections              code
// BuildPogsCandidate                 code
// ValidatePogsCandidate              code
// CandidateReady                     if
// ClassifyCaseType                   code
// ExtractDiagnosisTerms              code
// MapDiagnosisToPogsReferences       code
// Ping                               httpRequest
// Login                              httpRequest
// CreatePatientCaseRecord            httpRequest
// CreateCase                         httpRequest
// CheckExistingCase                  httpRequest                [alwaysOutput]
// CaseAlreadyExists                  if
// NormalizeCaseCheck                 code
// DuplicateCaseStop                  set
// VerifyCreatedCase                  httpRequest
// BuildKnowledgeRecord               code
// KnowledgeRecordToFile              code
// BuildPogsResultKnowledge           code
// ResultRecordToFile                 code
// ReadWriteFilesFromDisk1            readWriteFile
// ExtractGoogleDocText               googleDocs                 [creds]
// BuildRawCaseSnapshot               code
// RawCaseToFile                      code
// NormalizeData                      code
// LoadRawCase                        code
// RegressionSummary                  code
// SummaryToFile                      code
// WriteRegressionReport              readWriteFile
// ReadExistingKnowledgeFile          readWriteFile              [onError→regular]
// CompareKnowledgeRecord             code
// WriteKnowledgeFile                 readWriteFile
// Merge                              merge
// BuildRawCaseIdentity               code
// RawCaseAlreadyExists               if
// WriteRawCase                       readWriteFile
// BuildRegressionEvidenceBundle      code
// RegressionEvidenceBundleToFile     code
// WriteRegressionEvidenceBundle      readWriteFile
// ReadRawCaseMatches                 readWriteFile              [onError→regular]
// NormalizeRawCaseCheck              code
// MergeRawCaseCheckData              merge
// ReadNewRawCaseFile                 readWriteFile
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WhenClickingExecuteWorkflow
//    → ReadNewRawCaseFile
//      → LoadRawCase
//        → NormalizeData
//          → ParseClinicalSections
//            → ClassifyCaseType
//              → ExtractDiagnosisTerms
//                → MapDiagnosisToPogsReferences
//                  → BuildPogsCandidate
//                    → ValidatePogsCandidate
//                      → CandidateReady
//                        → Ping
//                          → Login
//                            → CheckExistingCase
//                              → NormalizeCaseCheck
//                                → CaseAlreadyExists
//                                  → DuplicateCaseStop
//                                 .out(1) → CreatePatientCaseRecord
//                                    → CreateCase
//                                      → VerifyCreatedCase
//                                        → BuildPogsResultKnowledge
//                                          → ResultRecordToFile
//                                            → ReadWriteFilesFromDisk1
//                      → BuildKnowledgeRecord
//                        → ReadExistingKnowledgeFile
//                          → Merge.in(1)
//                            → CompareKnowledgeRecord
//                              → KnowledgeRecordToFile
//                                → WriteKnowledgeFile
//                              → RegressionSummary
//                                → BuildRegressionEvidenceBundle
//                                  → RegressionEvidenceBundleToFile
//                                    → WriteRegressionEvidenceBundle
//                                → SummaryToFile
//                                  → WriteRegressionReport
//                        → Merge (↩ loop)
// ExtractRowData
//    → ExtractGoogleDocsLink
//      → BuildRawCaseIdentity
//        → ReadRawCaseMatches
//          → NormalizeRawCaseCheck
//            → MergeRawCaseCheckData
//              → RawCaseAlreadyExists
//               .out(1) → ExtractGoogleDocText
//                  → NormalizeData (↩ loop)
//                  → BuildRawCaseSnapshot
//                    → RawCaseToFile
//                      → WriteRawCase
//        → MergeRawCaseCheckData.in(1) (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'ofTTyTl8AFjvPpSk',
    name: 'medical_automation(outdated for reference only)',
    active: false,
    isArchived: false,
    settings: { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: false },
})
export class MedicalAutomationOutdatedForReferenceOnlyWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '32572b83-5a3b-4740-9edd-9aec2b3f62e6',
        name: 'When clicking ‘Execute workflow’',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [1344, -1088],
    })
    WhenClickingExecuteWorkflow = {};

    @node({
        id: '76824f54-8211-45aa-8a04-271a1f8e9194',
        name: 'Extract Google Docs Link',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [448, -1328],
    })
    ExtractGoogleDocsLink = {
        jsCode: `const rows =
  $json.sheets?.[0]
    ?.data?.[0]
    ?.rowData ?? [];

const results = [];

for (let i = 0; i < rows.length; i++) {
  const cell =
    rows[i]?.values?.[0];

  const uri =
    cell
      ?.chipRuns?.[0]
      ?.chip
      ?.richLinkProperties
      ?.uri;

  if (!uri) continue;

  const match =
    uri.match(/\\/document\\/d\\/([^/]+)/);

  if (!match) continue;

  results.push({
    json: {
      sourceRowOffset: i,
      documentUrl: uri,
      documentId: match[1]
    }
  });
}

return results;`,
    };

    @node({
        id: 'f6a73c89-e38f-41ca-b88e-b8ed4a9bd572',
        name: 'Extract Row Data',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.5,
        position: [224, -1328],
        credentials: { googleSheetsOAuth2Api: { id: 'w8CHG10kDhGNfouo', name: 'medical_automation Google OAuth2' } },
        retryOnFail: false,
        maxTries: 5,
        waitBetweenTries: 5000,
    })
    ExtractRowData = {
        url: 'https://sheets.googleapis.com/v4/spreadsheets/15r_HPrVzCHuPGxCrJNhDj_kFjepHKwRAdPvHovhnXIk?includeGridData=true&ranges=July%202026!H232:H242',
        authentication: 'predefinedCredentialType',
        nodeCredentialType: 'googleSheetsOAuth2Api',
        options: {},
    };

    @node({
        id: '083ab847-cc3e-4c56-bd87-d0e37d7cee6a',
        name: 'Parse Clinical Sections',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2240, -1136],
    })
    ParseClinicalSections = {
        mode: 'runOnceForEachItem',
        jsCode: `const text = $json.documentText || '';

function clean(value) {
  return (value || '')
    .replace(/\\s+/g, ' ')
    .trim();
}

function sectionBetween(startPattern, endPattern) {
  const start = text.search(startPattern);

  if (start === -1) {
    return '';
  }

  const afterStart = text.slice(start);
  const end = afterStart.search(endPattern);

  if (end === -1) {
    return clean(afterStart);
  }

  return clean(
    afterStart.slice(0, end)
  );
}


// --------------------------------------------------
// Flexible date extraction
// Supports:
// M/D/YYYY
// MM/DD/YYYY
// M-D-YYYY
// MM-DD-YYYY
//
// Returns normalized MM/DD/YYYY
// --------------------------------------------------

function findDateNearLabel(
  labelPattern,
  maxChars = 180
) {
  const labelMatch =
    text.match(labelPattern);

  if (
    !labelMatch ||
    labelMatch.index === undefined
  ) {
    return null;
  }

  const nearby =
    text.slice(
      labelMatch.index,
      labelMatch.index + maxChars
    );

  const dateMatch =
    nearby.match(
      /\\b(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{4})\\b/
    );

  if (!dateMatch) {
    return null;
  }

  const month =
    dateMatch[1].padStart(2, '0');

  const day =
    dateMatch[2].padStart(2, '0');

  const year =
    dateMatch[3];

  return \`\${month}/\${day}/\${year}\`;
}


// --------------------------------------------------
// Patient demographics
// --------------------------------------------------

const nameMatch =
  text.match(
    /Name\\s*\\|\\s*:\\s*\\|\\s*([^|\\n]+)/i
  );

const hospitalMatch =
  text.match(
    /Hospital Number\\s*\\|\\s*:\\s*\\|\\s*([0-9]+)/i
  );

const addressMatch =
  text.match(
    /Address\\s*\\|\\s*:\\s*\\|\\s*([^|]+?)\\s*\\|\\s*(?:Birthday|Birthdate|Birth\\s*Date|Date\\s+of\\s+Birth|DOB)/i
  );


// --------------------------------------------------
// Birth date
//
// Supports common labels:
// Birthday
// Birthdate
// Birth Date
// Date of Birth
// DOB
// --------------------------------------------------

const birthDate =
  findDateNearLabel(
    /\\b(?:Birthday|Birthdate|Birth\\s*Date|Date\\s+of\\s+Birth|DOB)\\b/i
  );


// --------------------------------------------------
// Age / Sex
//
// Independent from birth-date extraction so a
// layout difference does not cause all three fields
// to fail together.
//
// Example:
// Birthdate | 07/01/1990 | 36 / F
// --------------------------------------------------

const ageSexMatch =
  text.match(
    /\\b(?:Birthday|Birthdate|Birth\\s*Date|Date\\s+of\\s+Birth|DOB)\\b[\\s\\S]{0,180}?\\b(\\d{1,3})\\s*\\/\\s*([MF])\\b/i
  );


// --------------------------------------------------
// Admission / discharge dates
// --------------------------------------------------

const admissionDate =
  findDateNearLabel(
    /Date\\s+of\\s+Admission/i
  );

const dischargeDate =
  findDateNearLabel(
    /Date\\s+of\\s+Discharge/i
  );


// --------------------------------------------------
// Admission time
// --------------------------------------------------

const admissionTimeMatch =
  text.match(
    /Time\\s+of\\s+Admission[\\s|:]*([0-9]{1,2}(?::[0-9]{2})?\\s*(?:AM|PM|am|pm)?)/i
  );


// --------------------------------------------------
// Obstetric score
//
// Example:
// G4 P3 (3-0-0-3)
// --------------------------------------------------

const obIndexMatch =
  text.match(
    /\\bG(\\d+)\\s*P(\\d+)\\s*\\((\\d+)-(\\d+)-(\\d+)-(\\d+)\\)/i
  );


// --------------------------------------------------
// Medical history
// --------------------------------------------------

const hasChronicHypertension =
  /\\(\\+\\)\\s*Chronic hypertension/i
    .test(text);

const diabetesNegative =
  /Diabetes mellitus\\s*\\|\\s*\\(-\\)/i
    .test(text);

const asthmaNegative =
  /Bronchial asthma\\s*\\|\\s*\\(-\\)/i
    .test(text);

const thyroidNegative =
  /Thyroid disease\\s*\\|\\s*\\(-\\)/i
    .test(text);


// --------------------------------------------------
// Vitals
// --------------------------------------------------

const bpMatch =
  text.match(
    /BP:\\s*([0-9]+\\/[0-9]+)\\s*mmHg/i
  );

const hrMatch =
  text.match(
    /HR:\\s*([0-9]+)\\s*bpm/i
  );

const rrMatch =
  text.match(
    /RR:\\s*([0-9]+)\\s*cpm/i
  );

const o2Match =
  text.match(
    /O2 Sat:\\s*([0-9]+)%/i
  );

const tempMatch =
  text.match(
    /Temp:\\s*([0-9.]+)°?C/i
  );


// --------------------------------------------------
// Measurements
// --------------------------------------------------

const weightMatch =
  text.match(
    /Weight:\\s*([0-9]+(?:\\.[0-9]+)?)\\s*kg/i
  );

const heightMatch =
  text.match(
    /Height:\\s*([0-9]+(?:\\.[0-9]+)?)\\s*cm/i
  );


// --------------------------------------------------
// Output
// --------------------------------------------------

return {
  json: {

    runContext:
      $json.runContext ?? {
        mode: 'LIVE',
        rawCaseId: null
      },

    sourceTitle:
      $json.title ?? null,

    patient: {

      name:
        clean(
          nameMatch?.[1]
        ),

      hospitalNumber:
        clean(
          hospitalMatch?.[1]
        ),

      address:
        clean(
          addressMatch?.[1]
        ),

      birthDate,

      age:
        ageSexMatch
          ? Number(
              ageSexMatch[1]
            )
          : null,

      sex:
        ageSexMatch?.[2]
          ?.toUpperCase() ??
        null
    },


    admission: {

      date:
        admissionDate,

      time:
        clean(
          admissionTimeMatch?.[1]
        ) || null,

      dischargeDate
    },


    obstetric: {

      gravida:
        obIndexMatch
          ? Number(
              obIndexMatch[1]
            )
          : null,

      para:
        obIndexMatch
          ? Number(
              obIndexMatch[2]
            )
          : null,

      fullTerm:
        obIndexMatch
          ? Number(
              obIndexMatch[3]
            )
          : null,

      preterm:
        obIndexMatch
          ? Number(
              obIndexMatch[4]
            )
          : null,

      abortion:
        obIndexMatch
          ? Number(
              obIndexMatch[5]
            )
          : null,

      living:
        obIndexMatch
          ? Number(
              obIndexMatch[6]
            )
          : null
    },


    medicalHistory: {

      chronicHypertension:
        hasChronicHypertension,

      diabetesMellitus:
        diabetesNegative
          ? false
          : null,

      bronchialAsthma:
        asthmaNegative
          ? false
          : null,

      thyroidDisease:
        thyroidNegative
          ? false
          : null
    },


    vitals: {

      bloodPressure:
        bpMatch?.[1] ??
        null,

      heartRate:
        hrMatch
          ? Number(
              hrMatch[1]
            )
          : null,

      respiratoryRate:
        rrMatch
          ? Number(
              rrMatch[1]
            )
          : null,

      oxygenSaturation:
        o2Match
          ? Number(
              o2Match[1]
            )
          : null,

      temperatureC:
        tempMatch
          ? Number(
              tempMatch[1]
            )
          : null
    },


    measurements: {

      weightKg:
        weightMatch
          ? Number(
              weightMatch[1]
            )
          : null,

      heightCm:
        heightMatch
          ? Number(
              heightMatch[1]
            )
          : null
    },


    sections: {

      reasonForAdmission:
        sectionBetween(
          /REASON FOR ADMISSION:/i,
          /HISTORY OF PRESENT ILLNESS/i
        ),

      historyOfPresentIllness:
        sectionBetween(
          /HISTORY OF PRESENT ILLNESS/i,
          /Pertinent Past Medical History:/i
        ),

      finalDiagnosis:
        sectionBetween(
          /Final Diagnosis/i,
          /Physicians-in-Charge/i
        ),

      courseInWard:
        sectionBetween(
          /COURSE IN THE WARD/i,
          /SURGICAL PROCEDURE/i
        )
    }
  }
};`,
    };

    @node({
        id: '35485fee-8f97-4fbe-ac55-8e40157db11e',
        name: 'Build POGS Candidate',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3136, -1136],
    })
    BuildPogsCandidate = {
        mode: 'runOnceForEachItem',
        jsCode: `const src = $json;

function toISODate(mmddyyyy) {
  if (!mmddyyyy) return null;

  const match = String(mmddyyyy).match(
    /^(\\d{2})\\/(\\d{2})\\/(\\d{4})$/
  );

  if (!match) return null;

  return \`\${match[3]}-\${match[1]}-\${match[2]}\`;
}

const gynecologicalDiagnosis =
  (src.pogsDiagnosisMapping?.mapped ?? [])
    .map(item => ({
      categoryId: item.categoryId,
      conditionId: item.conditionId,
      gyneStage: item.gyneStage,
      others: null,
      othersField: null
    }));

return {
  json: {
    runContext:
      src.runContext ?? {
        mode: "LIVE",
        rawCaseId: null
      },

    caseNum:
      src.patient?.hospitalNumber ?? null,

    birthDate:
      toISODate(src.patient?.birthDate),

    admissionDate:
      toISODate(src.admission?.date),

    room: null,

    weight:
      src.measurements?.weightKg ?? null,

    height:
      src.measurements?.heightCm ?? null,

    isPregnancy:
      src.classification?.isPregnancy ?? null,

    isGyne:
      src.classification?.isGyne ?? null,

    isPostpartum:
      src.classification?.isPostpartum ?? null,

    obscoreG:
      src.obstetric?.gravida ?? null,

    obscoreP:
      src.obstetric?.para ?? null,

    obscoreFT:
      src.obstetric?.fullTerm ?? null,

    obscorePr:
      src.obstetric?.preterm ?? null,

    obscoreAb:
      src.obstetric?.abortion ?? null,

    obscoreLB:
      src.obstetric?.living ?? null,

    gynecologicalDiagnosis,

    unresolvedDiagnoses:
      src.pogsDiagnosisMapping?.unresolved ?? [],

    ignoredDiagnosisTerms:
      src.pogsDiagnosisMapping?.ignored ?? [],

    classificationEvidence:
      src.classification?.reasons ?? [],

    source: {
      title:
        src.sourceTitle ?? null,

      patientName:
        src.patient?.name ?? null,

      hospitalNumber:
        src.patient?.hospitalNumber ?? null,

      finalDiagnosis:
        src.sections?.finalDiagnosis ?? null,

      reasonForAdmission:
        src.sections?.reasonForAdmission ?? null
    }
  }
};`,
    };

    @node({
        id: 'a13ba302-c259-425f-95b4-1e1bdaacac6d',
        name: 'Validate POGS Candidate',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3360, -1136],
    })
    ValidatePogsCandidate = {
        mode: 'runOnceForEachItem',
        jsCode: `const data = $json;

const issues = [];
const warnings = [];


// --------------------------------------------------
// Required core identifiers
// --------------------------------------------------

if (!data.caseNum) {
  issues.push("Missing caseNum");
}

if (!data.birthDate) {
  issues.push("Missing birthDate");
}

if (!data.admissionDate) {
  issues.push("Missing admissionDate");
}


// --------------------------------------------------
// Case classification
// --------------------------------------------------

if (
  data.isPregnancy === null ||
  data.isPregnancy === undefined
) {
  issues.push("isPregnancy not classified");
}

if (
  data.isGyne === null ||
  data.isGyne === undefined
) {
  issues.push("isGyne not classified");
}

if (
  data.isPostpartum === null ||
  data.isPostpartum === undefined
) {
  issues.push("isPostpartum not classified");
}

if (
  data.isPregnancy === false &&
  data.isGyne === false
) {
  issues.push(
    "Neither pregnancy nor gyne case is selected"
  );
}


// --------------------------------------------------
// OB score sanity checks
// --------------------------------------------------

const obFields = [
  "obscoreG",
  "obscoreP",
  "obscoreFT",
  "obscorePr",
  "obscoreAb",
  "obscoreLB"
];

for (const field of obFields) {
  const value = data[field];

  if (
    value !== null &&
    value !== undefined &&
    (
      !Number.isInteger(value) ||
      value < 0
    )
  ) {
    issues.push(
      \`\${field} is invalid\`
    );
  }
}


// --------------------------------------------------
// Physical measurements
// --------------------------------------------------

if (
  data.weight === null ||
  data.weight === undefined
) {
  warnings.push(
    "Weight not extracted or requires review"
  );
}

if (
  data.height === null ||
  data.height === undefined
) {
  warnings.push(
    "Height not extracted or requires review"
  );
}


// --------------------------------------------------
// Gyne diagnosis requirement
//
// A gyne case must have at least one confirmed
// POGS gynecologicalDiagnosis mapping.
// --------------------------------------------------

if (data.isGyne === true) {
  const mappedGyne =
    data.gynecologicalDiagnosis || [];

  if (mappedGyne.length === 0) {
    issues.push(
      "Gyne case has no confirmed POGS gynecologicalDiagnosis mapping"
    );
  }
}


// --------------------------------------------------
// Pregnancy-specific validation
//
// Pregnancy-specific required rules are handled by
// a separate pregnancy rules/workflow.
//
// Until that separate validation is implemented and
// explicitly confirms the case, pregnancy cases must
// NOT enter the POGS write branch.
// --------------------------------------------------

if (data.isPregnancy === true) {
  issues.push(
    "Pregnancy-specific POGS validation pending"
  );
}


// --------------------------------------------------
// Unresolved clinical terms
//
// These remain warnings unless a separate rule
// specifically makes them required.
// --------------------------------------------------

for (
  const item of
  data.unresolvedDiagnoses || []
) {
  warnings.push(
    \`Unresolved clinical term: \${item.sourceLabel}\`
  );
}


// --------------------------------------------------
// Final validation state
// --------------------------------------------------

const readyForPOGS =
  issues.length === 0;

return {
  json: {
    ...data,

    validation: {
      readyForPOGS,
      needsReview:
        !readyForPOGS,
      issues,
      warnings
    }
  }
};`,
    };

    @node({
        id: '949a0672-ca3b-411f-b34e-b3f90f0cc59f',
        name: 'Candidate Ready?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [3584, -1424],
    })
    CandidateReady = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '3971f87d-595f-408f-bf2a-654ed11b53eb',
                    leftValue: `={{
  $json.validation.readyForPOGS === true
  &&
  $json.runContext?.mode !== "REGRESSION"
}}`,
                    rightValue: '',
                    operator: {
                        type: 'boolean',
                        operation: 'true',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: 'da293466-239d-4916-9ff2-31e2c73bfd3b',
        name: 'Classify Case Type',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2464, -1136],
    })
    ClassifyCaseType = {
        mode: 'runOnceForEachItem',
        jsCode: `const data = $json;

// Use the clinical text that we already extracted.
// Combine the most useful sections so classification is explainable.
const text = [
  data.sections?.reasonForAdmission,
  data.sections?.historyOfPresentIllness,
  data.sections?.finalDiagnosis
]
  .filter(Boolean)
  .join(' ')
  .toLowerCase();

const reasons = [];

/*
 * PREGNANCY
 *
 * Only mark true when there is reasonably explicit evidence of
 * a current pregnancy.
 */
const pregnancyPatterns = [
  /\\bcurrent pregnancy\\b/i,
  /\\bpregnancy uterine\\b/i,
  /\\bpregnant\\b/i,
  /\\bage of gestation\\b/i,
  /\\baog\\b/i,
  /\\bweeks? (?:and \\d+ days? )?(?:age of gestation|aog)\\b/i,
  /\\bfetal\\b/i,
  /\\bfht\\b/i
];

let isPregnancy = pregnancyPatterns.some(pattern => pattern.test(text));

if (isPregnancy) {
  reasons.push("Current-pregnancy terminology found");
}

/*
 * GYNE
 *
 * Use explicit gynecologic diagnoses/conditions rather than simply
 * assuming every female OB-GYN admission is a gyne case.
 */
const gynePatterns = [
  /\\babnormal uterine bleeding\\b/i,
  /\\bmyoma\\b/i,
  /\\bfibroid\\b/i,
  /\\bendometrial\\b/i,
  /\\bmenorrhagia\\b/i,
  /\\bmetrorrhagia\\b/i,
  /\\bamenorrhea\\b/i,
  /\\bdysmenorrhea\\b/i,
  /\\bovarian\\b/i,
  /\\bovary\\b/i,
  /\\bcervical\\b/i,
  /\\bcervix\\b/i,
  /\\bvaginal bleeding\\b/i,
  /\\bgynecologic\\b/i,
  /\\bgynecological\\b/i
];

let isGyne = gynePatterns.some(pattern => pattern.test(text));

if (isGyne) {
  reasons.push("Gynecologic diagnosis/condition terminology found");
}

/*
 * POSTPARTUM
 *
 * Require relatively explicit postpartum/puerperium evidence.
 */
const postpartumPatterns = [
  /\\bpostpartum\\b/i,
  /\\bpost-partum\\b/i,
  /\\bpuerperal\\b/i,
  /\\bpost delivery\\b/i,
  /\\bpost-delivery\\b/i,
  /\\bstatus post delivery\\b/i,
  /\\bs\\/p delivery\\b/i
];

let isPostpartum = postpartumPatterns.some(pattern => pattern.test(text));

if (isPostpartum) {
  reasons.push("Postpartum/puerperium terminology found");
}

/*
 * Negative current-pregnancy evidence.
 *
 * A negative pregnancy test can support false, but only when there is
 * no stronger explicit current-pregnancy evidence.
 */
const fullText = JSON.stringify(data).toLowerCase();

const pregnancyTestNegative =
  /pregnancy test[^a-z0-9]*negative/i.test(fullText);

if (!isPregnancy && pregnancyTestNegative) {
  reasons.push("Pregnancy test documented as negative");
}

/*
 * Do not force a classification if the text is ambiguous.
 *
 * null means "needs review", which is safer than guessing.
 */
if (!isPregnancy && !isGyne && !isPostpartum) {
  isPregnancy = null;
  isGyne = null;
  isPostpartum = null;

  reasons.push("No sufficiently explicit case-type evidence found");
}

return {
  json: {
    ...data,

    classification: {
      isPregnancy,
      isGyne,
      isPostpartum,
      pregnancyTestNegative,
      reasons
    }
  }
};`,
    };

    @node({
        id: '3cae945f-47ee-4806-bc2e-05718df98273',
        name: 'Extract Diagnosis Terms',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2688, -1136],
    })
    ExtractDiagnosisTerms = {
        mode: 'runOnceForEachItem',
        jsCode: `const data = $json;

const diagnosisText =
  data.sections?.finalDiagnosis || '';

const normalized = diagnosisText
  .replace(/^Final Diagnosis\\s*\\|\\s*:\\s*\\|?/i, '')
  .replace(/\\|\\s*\\|\\s*\\|/g, ' ')
  .replace(/\\s+/g, ' ')
  .trim();

const terms = [];

// Deterministic recognizers only.
// These produce human-readable concepts, not POGS IDs.

const patterns = [
  {
    key: 'abnormalUterineBleeding',
    label: 'Abnormal uterine bleeding',
    regex: /\\babnormal uterine bleeding\\b/i
  },
  {
    key: 'submucousMyoma',
    label: 'Prolapsed submucous myoma',
    regex: /\\bprolapsed submucous myoma\\b/i
  },
  {
    key: 'endometrialThickening',
    label: 'Endometrial thickening',
    regex: /\\bendometrial thickening\\b/i
  },
  {
    key: 'anemia',
    label: 'Anemia',
    regex: /\\banemia\\b/i
  },
  {
    key: 'acuteBloodLoss',
    label: 'Acute blood loss',
    regex: /\\bacute blood loss\\b/i
  },
  {
    key: 'obesity',
    label: 'Obesity',
    regex: /\\bobese\\b|\\bobesity\\b/i
  },
  {
    key: 'bloodTransfusion',
    label: 'Status post blood transfusion',
    regex: /\\bs\\/p blood transfusion\\b/i
  },
  {
    key: 'endometrialSampling',
    label: 'Status post ultrasound guided endometrial sampling',
    regex: /\\bendometrial sampling\\b/i
  },
  {
    key: 'dmpa',
    label: 'Status post DMPA injection',
    regex: /\\bdmpa injection\\b/i
  }
];

for (const item of patterns) {
  if (item.regex.test(normalized)) {
    terms.push({
      key: item.key,
      label: item.label,
      matched: true
    });
  }
}

return {
  json: {
    ...data,

    diagnosisExtraction: {
      raw: diagnosisText,
      normalized,
      terms
    }
  }
};`,
    };

    @node({
        id: 'a43c59a4-8214-496c-8137-580261a238df',
        name: 'Map Diagnosis to POGS References',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2912, -1136],
    })
    MapDiagnosisToPogsReferences = {
        mode: 'runOnceForEachItem',
        jsCode: `const data = $json;

const lookup = {
  abnormalUterineBleeding: {
    status: "unmapped",
    reason: "No exact POGS gynecologicalDiagnosis reference confirmed"
  },

  submucousMyoma: {
    status: "mapped",
    categoryId: 12,
    conditionId: 114,
    gyneStage: 6
  },

  endometrialThickening: {
    status: "unmapped",
    reason: "POGS has Endometrial hyperplasia, unspecified, but source only says endometrial thickening"
  },

  anemia: {
    status: "unmapped",
    reason: "Not a gynecologicalDiagnosis mapping"
  },

  acuteBloodLoss: {
    status: "unmapped",
    reason: "Not a gynecologicalDiagnosis mapping"
  },

  obesity: {
    status: "unmapped",
    reason: "Not a gynecologicalDiagnosis mapping"
  },

  bloodTransfusion: {
    status: "ignored",
    reason: "Treatment/procedure, not gynecologicalDiagnosis"
  },

  endometrialSampling: {
    status: "ignored",
    reason: "Procedure, not gynecologicalDiagnosis"
  },

  dmpa: {
    status: "ignored",
    reason: "Medication/intervention, not gynecologicalDiagnosis"
  }
};

const mapped = [];
const unresolved = [];
const ignored = [];

for (const term of data.diagnosisExtraction?.terms || []) {

  const ref = lookup[term.key];

  if (!ref) {
    unresolved.push({
      sourceKey: term.key,
      sourceLabel: term.label,
      reason: "No mapping rule defined"
    });

    continue;
  }

  if (ref.status === "mapped") {

    mapped.push({
      sourceKey: term.key,
      sourceLabel: term.label,

      categoryId: ref.categoryId,
      conditionId: ref.conditionId,
      gyneStage: ref.gyneStage
    });

  } else if (ref.status === "ignored") {

    ignored.push({
      sourceKey: term.key,
      sourceLabel: term.label,
      reason: ref.reason
    });

  } else {

    unresolved.push({
      sourceKey: term.key,
      sourceLabel: term.label,
      reason: ref.reason
    });
  }
}

return {
  json: {
    ...data,

    pogsDiagnosisMapping: {
      mapped,
      unresolved,
      ignored,

      // Important:
      // unresolved terms do NOT necessarily mean the whole case
      // cannot go to POGS. Some terms simply belong elsewhere.
      complete: unresolved.length === 0
    }
  }
};`,
    };

    @node({
        id: 'bd912049-744f-42fd-8c6d-31f818dccbe1',
        name: 'Ping',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.5,
        position: [3808, -1424],
    })
    Ping = {
        url: 'http://host.docker.internal:3000/ping',
        options: {},
    };

    @node({
        id: '478d5108-1360-46c1-a934-3c47edc464c6',
        name: 'Login',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.5,
        position: [4032, -1424],
    })
    Login = {
        method: 'POST',
        url: 'http://host.docker.internal:3000/api/accounts/login',
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Content-Type',
                    value: 'application/json',
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={
  "username": "admin",
  "password": "kUgt6FAUM0"
}`,
        options: {},
    };

    @node({
        id: 'a5a22c5c-f077-46f0-a900-8270163b84a2',
        name: 'Create Patient Case Record',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.5,
        position: [4928, -1328],
    })
    CreatePatientCaseRecord = {
        method: 'POST',
        url: 'http://host.docker.internal:3000/api/patientcases',
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Content-Type',
                    value: 'application/json',
                },
                {
                    name: 'Authorization',
                    value: '={{ "Bearer " + $node["Login"].json["token"] }}',
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={
  "caseNum": "{{ $node["Validate POGS Candidate"].json.caseNum }}",
  "birthDate": "{{ $node["Validate POGS Candidate"].json.birthDate }}"
}`,
        options: {},
    };

    @node({
        id: '22e975d8-ad5d-4b1f-9a3a-d7f8ba021c82',
        name: 'Create Case',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.5,
        position: [5152, -1328],
    })
    CreateCase = {
        method: 'POST',
        url: `={{
"http://host.docker.internal:3000/api/patients/"
+
$node["Create Patient Case Record"].json["_id"]
+
"/cases"
}}`,
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Content-Type',
                    value: 'application/json',
                },
                {
                    name: 'Authorization',
                    value: '={{ "Bearer " + $node["Login"].json["token"] }}',
                },
            ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `=={{
  {
    caseNum:
      $node["Validate POGS Candidate"].json.caseNum,

    admissionDate:
      $node["Validate POGS Candidate"].json.admissionDate,

    room:
      $node["Validate POGS Candidate"].json.room,

    weight:
      $node["Validate POGS Candidate"].json.weight,

    height:
      $node["Validate POGS Candidate"].json.height,

    isPregnancy:
      $node["Validate POGS Candidate"].json.isPregnancy,

    isGyne:
      $node["Validate POGS Candidate"].json.isGyne,

    isPostpartum:
      $node["Validate POGS Candidate"].json.isPostpartum,

    obscoreG:
      $node["Validate POGS Candidate"].json.obscoreG,

    obscoreP:
      $node["Validate POGS Candidate"].json.obscoreP,

    obscoreFT:
      $node["Validate POGS Candidate"].json.obscoreFT,

    obscorePr:
      $node["Validate POGS Candidate"].json.obscorePr,

    obscoreAb:
      $node["Validate POGS Candidate"].json.obscoreAb,

    obscoreLB:
      $node["Validate POGS Candidate"].json.obscoreLB,

    gynecologicalDiagnosis:
      $node["Validate POGS Candidate"].json.gynecologicalDiagnosis
  }
}}`,
        options: {},
    };

    @node({
        id: '8ca69ced-ffd8-4fb9-b878-3dec186287c9',
        name: 'Check Existing Case',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.5,
        position: [4256, -1424],
        alwaysOutputData: true,
    })
    CheckExistingCase = {
        url: '=http://host.docker.internal:3000/api/patientcases',
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'search',
                    value: '={{ $node["Validate POGS Candidate"].json["caseNum"] }}',
                },
            ],
        },
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: '={{ "Bearer " + $node["Login"].json["token"] }}',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '0cc0ac5f-4d23-4e47-9ff5-bedc865510a3',
        name: 'Case Already Exists?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [4704, -1424],
    })
    CaseAlreadyExists = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '54c7c21f-7daf-463f-8e6f-b383647a327c',
                    leftValue: '={{ $json.exists }}',
                    rightValue: 0,
                    operator: {
                        type: 'boolean',
                        operation: 'true',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: 'c0191010-db0c-4634-a242-e4bfa5a3078d',
        name: 'Normalize Case Check',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4480, -1424],
    })
    NormalizeCaseCheck = {
        jsCode: `const requestedCaseNum = $node["Validate POGS Candidate"].json.caseNum;

const matches = $items("Check Existing Case")
  .map(item => item.json)
  .filter(row => row.caseNum === requestedCaseNum);

return [
  {
    json: {
      caseNum: requestedCaseNum,
      exists: matches.length > 0,
      matchCount: matches.length,
      matches
    }
  }
];`,
    };

    @node({
        id: 'a38d966d-b97b-458d-a719-083019c1b646',
        name: 'Duplicate Case - STOP',
        type: 'n8n-nodes-base.set',
        version: 3.5,
        position: [4928, -1520],
    })
    DuplicateCaseStop = {
        mode: 'raw',
        jsonOutput: `={
  "status": "skipped",
  "reason": "case_number_already_exists",
  "caseNum": "{{ $node['Validate POGS Candidate'].json['caseNum'] }}"
}`,
        options: {},
    };

    @node({
        id: '64b08050-b0e9-4da4-b9d8-c3082aa37eb0',
        name: 'Verify Created Case',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.5,
        position: [5376, -1328],
    })
    VerifyCreatedCase = {
        url: `={{
  "http://host.docker.internal:3000/api/patients/"
  + $node["Create Patient Case Record"].json["_id"]
  + "/cases/"
  + $node["Create Case"].json["_id"]
}}`,
        sendHeaders: true,
        headerParameters: {
            parameters: [
                {
                    name: 'Authorization',
                    value: '={{ "Bearer " + $node["Login"].json["token"] }}',
                },
            ],
        },
        options: {},
    };

    @node({
        id: '596ac9c5-e119-4b17-8dbf-ea95b32b09c1',
        name: 'Build Knowledge Record',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3584, -1040],
    })
    BuildKnowledgeRecord = {
        mode: 'runOnceForEachItem',
        jsCode: `const d = $json;

const knownFields = new Set([
  "caseNum",
  "birthDate",
  "admissionDate",
  "room",
  "weight",
  "height",
  "isPregnancy",
  "isGyne",
  "isPostpartum",
  "obscoreG",
  "obscoreP",
  "obscoreFT",
  "obscorePr",
  "obscoreAb",
  "obscoreLB",
  "gynecologicalDiagnosis",
  "unresolvedDiagnoses",
  "ignoredDiagnosisTerms",
  "classificationEvidence",
  "source",
  "validation",
  "runContext"
]);

const unknownFields = Object.keys(d)
  .filter(key => !knownFields.has(key));

const mappedDiagnoses =
  d.gynecologicalDiagnosis ?? [];

const unresolvedDiagnoses =
  d.unresolvedDiagnoses ?? [];

const ignoredDiagnosisTerms =
  d.ignoredDiagnosisTerms ?? [];

const recognizedTerms =
  mappedDiagnoses.length +
  unresolvedDiagnoses.length +
  ignoredDiagnosisTerms.length;

const mappedTerms =
  mappedDiagnoses.length;

const unresolvedTerms =
  unresolvedDiagnoses.length;

const ignoredTerms =
  ignoredDiagnosisTerms.length;

const mappingComplete =
  unresolvedTerms === 0;

const needsClinicalMappingReview =
  unresolvedTerms > 0;

const ruleEvaluation = [];

// Gyne diagnosis rules
if (d.isGyne === true) {
  ruleEvaluation.push({
    field: "gynecologicalDiagnosis",
    visible: true,
    required: true,
    applicable: true,
    reason: "isGyne = true",
    satisfied: mappedDiagnoses.length > 0
  });
} else if (d.isGyne === false) {
  ruleEvaluation.push({
    field: "gynecologicalDiagnosis",
    visible: false,
    required: false,
    applicable: false,
    reason: "isGyne = false",
    satisfied: true
  });
} else {
  ruleEvaluation.push({
    field: "gynecologicalDiagnosis",
    visible: null,
    required: null,
    applicable: null,
    reason: "isGyne is not classified",
    satisfied: false
  });
}

// Pregnancy section
if (d.isPregnancy === true) {
  ruleEvaluation.push({
    field: "pregnancySection",
    visible: true,
    required: true,
    applicable: true,
    reason: "isPregnancy = true",
    satisfied: null
  });
} else if (d.isPregnancy === false) {
  ruleEvaluation.push({
    field: "pregnancySection",
    visible: false,
    required: false,
    applicable: false,
    reason: "isPregnancy = false",
    satisfied: true
  });
} else {
  ruleEvaluation.push({
    field: "pregnancySection",
    visible: null,
    required: null,
    applicable: null,
    reason: "isPregnancy is not classified",
    satisfied: false
  });
}

// Postpartum section
if (d.isPostpartum === true) {
  ruleEvaluation.push({
    field: "postpartumSection",
    visible: true,
    required: null,
    applicable: true,
    reason: "isPostpartum = true",
    satisfied: null
  });
} else if (d.isPostpartum === false) {
  ruleEvaluation.push({
    field: "postpartumSection",
    visible: false,
    required: false,
    applicable: false,
    reason: "isPostpartum = false",
    satisfied: true
  });
} else {
  ruleEvaluation.push({
    field: "postpartumSection",
    visible: null,
    required: null,
    applicable: null,
    reason: "isPostpartum is not classified",
    satisfied: false
  });
}

// OB score applicability
const obScoreValues = [
  d.obscoreG,
  d.obscoreP,
  d.obscoreFT,
  d.obscorePr,
  d.obscoreAb,
  d.obscoreLB
];

const hasAnyOBScore =
  obScoreValues.some(
    value => value !== null && value !== undefined
  );

ruleEvaluation.push({
  field: "obstetricScore",
  visible: null,
  required: null,
  applicable: hasAnyOBScore,
  reason: hasAnyOBScore
    ? "OB score data was extracted from source"
    : "No OB score data was extracted",
  satisfied: hasAnyOBScore
});

// Weight extraction
ruleEvaluation.push({
  field: "weight",
  visible: true,
  required: false,
  applicable: true,
  reason: "General patient measurement",
  satisfied:
    d.weight !== null &&
    d.weight !== undefined
});

// Height extraction
ruleEvaluation.push({
  field: "height",
  visible: true,
  required: false,
  applicable: true,
  reason: "General patient measurement",
  satisfied:
    d.height !== null &&
    d.height !== undefined
});

const unsatisfiedRules =
  ruleEvaluation.filter(
    rule =>
      rule.required === true &&
      rule.satisfied === false
  );

const timestamp =
  new Date().toISOString();

// Generate a stable non-identifying knowledge ID.
// The same caseNum will always generate the same ID,
// so rerunning the same candidate overwrites its knowledge file.

if (!d.caseNum) {
  throw new Error("Cannot generate knowledgeId: candidate has no caseNum");
}

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
    Math.imul(
      hash1 ^ (hash1 >>> 16),
      2246822507
    ) ^
    Math.imul(
      hash2 ^ (hash2 >>> 13),
      3266489909
    );

  hash2 =
    Math.imul(
      hash2 ^ (hash2 >>> 16),
      2246822507
    ) ^
    Math.imul(
      hash1 ^ (hash1 >>> 13),
      3266489909
    );

  return (
    (hash2 >>> 0).toString(16).padStart(8, "0") +
    (hash1 >>> 0).toString(16).padStart(8, "0")
  );
}

const knowledgeId =
  \`CASE-\${stableHash(d.caseNum)}\`;

return {
  json: {
    schemaVersion: 2,

    knowledgeId,
    timestamp,

    executionId:
      $execution?.id ?? null,

    classification: {
      isPregnancy:
        d.isPregnancy ?? null,

      isGyne:
        d.isGyne ?? null,

      isPostpartum:
        d.isPostpartum ?? null,

      evidence:
        d.classificationEvidence ?? []
    },

    runContext: {
      mode: d.runContext?.mode ?? "UNKNOWN",
      rawCaseId: d.runContext?.rawCaseId ?? null
    },

    extracted: {
      birthDatePresent:
        Boolean(d.birthDate),

      admissionDatePresent:
        Boolean(d.admissionDate),

      roomPresent:
        d.room !== null &&
        d.room !== undefined,

      weightPresent:
        d.weight !== null &&
        d.weight !== undefined,

      heightPresent:
        d.height !== null &&
        d.height !== undefined,

      obscoreG:
        d.obscoreG ?? null,

      obscoreP:
        d.obscoreP ?? null,

      obscoreFT:
        d.obscoreFT ?? null,

      obscorePr:
        d.obscorePr ?? null,

      obscoreAb:
        d.obscoreAb ?? null,

      obscoreLB:
        d.obscoreLB ?? null
    },

    mapped: {
      gynecologicalDiagnosis:
        mappedDiagnoses
    },

    unresolved:
      unresolvedDiagnoses,

    ignored:
      ignoredDiagnosisTerms,

    mappingCoverage: {
      recognizedTerms,
      mappedTerms,
      unresolvedTerms,
      ignoredTerms
    },

    mappingStatus: {
      mappingComplete,
      needsClinicalMappingReview
    },

    ruleEvaluation,

    ruleStatus: {
      evaluatedRules:
        ruleEvaluation.length,

      unsatisfiedRequiredRules:
        unsatisfiedRules,

      needsRuleReview:
        unsatisfiedRules.length > 0
    },

    validation: {
      readyForPOGS:
        d.validation?.readyForPOGS ?? false,

      issues:
        d.validation?.issues ?? [],

      warnings:
        d.validation?.warnings ?? []
    },

    discovery: {
      unknownTopLevelFields:
        unknownFields,

      needsMappingReview:
        needsClinicalMappingReview,

      needsRuleReview:
        unknownFields.length > 0 ||
        unsatisfiedRules.length > 0
    }
  }
};`,
    };

    @node({
        id: '8348b2b9-c956-44c1-ab25-c3ae1bdef764',
        name: 'Knowledge Record to File',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4480, -1232],
    })
    KnowledgeRecordToFile = {
        mode: 'runOnceForEachItem',
        jsCode: `const record =
  $json.currentRecord;

if (!record?.knowledgeId) {
  throw new Error(
    "Missing current knowledge record"
  );
}

const content =
  JSON.stringify(
    record,
    null,
    2
  );

return {
  json: {
    knowledgeId:
      record.knowledgeId,

    fileName:
      \`\${record.knowledgeId}.json\`,

    regressionResult:
      $json.regressionResult
  },

  binary: {
    data: {
      data:
        Buffer
          .from(content, "utf8")
          .toString("base64"),

      mimeType:
        "application/json",

      fileName:
        \`\${record.knowledgeId}.json\`
    }
  }
};`,
    };

    @node({
        id: 'ef2bf0ec-f7aa-498a-993a-32ae8eb28195',
        name: 'Build POGS Result Knowledge',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [5600, -1328],
    })
    BuildPogsResultKnowledge = {
        jsCode: `const candidate =
  $node["Validate POGS Candidate"].json;

const verified =
  $json;

const timestamp =
  new Date().toISOString();

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

if (!candidate.caseNum) {
  throw new Error("Cannot generate knowledgeId: missing caseNum");
}

const knowledgeId =
  \`CASE-\${stableHash(candidate.caseNum)}\`;

const differences = [];

function compare(field, expected, actual) {
  const a = JSON.stringify(expected ?? null);
  const b = JSON.stringify(actual ?? null);

  if (a !== b) {
    differences.push({
      field,
      expected: expected ?? null,
      actual: actual ?? null
    });
  }
}

compare(
  "isPregnancy",
  candidate.isPregnancy,
  verified.isPregnancy
);

compare(
  "isGyne",
  candidate.isGyne,
  verified.isGyne
);

compare(
  "isPostpartum",
  candidate.isPostpartum,
  verified.isPostpartum
);

compare(
  "weight",
  candidate.weight,
  verified.weight
);

compare(
  "height",
  candidate.height,
  verified.height
);

compare(
  "obscoreG",
  candidate.obscoreG,
  verified.obscoreG
);

compare(
  "obscoreP",
  candidate.obscoreP,
  verified.obscoreP
);

compare(
  "gynecologicalDiagnosis",
  candidate.gynecologicalDiagnosis,
  verified.gynecologicalDiagnosis
);

return [{
  json: {
    schemaVersion: 1,

    knowledgeId,

    timestamp,

    executionId:
      $execution?.id ?? null,

    stage:
      "POGS_VERIFICATION",

    result: {
      verified:
        Boolean(verified?._id),

      caseIdPresent:
        Boolean(verified?._id),

      patientIdPresent:
        Boolean(
          verified?.patientId ||
          verified?.patientid
        )
    },

    expected: {
      isPregnancy:
        candidate.isPregnancy ?? null,

      isGyne:
        candidate.isGyne ?? null,

      isPostpartum:
        candidate.isPostpartum ?? null,

      weight:
        candidate.weight ?? null,

      height:
        candidate.height ?? null,

      obscoreG:
        candidate.obscoreG ?? null,

      obscoreP:
        candidate.obscoreP ?? null,

      gynecologicalDiagnosis:
        candidate.gynecologicalDiagnosis ?? []
    },

    stored: {
      isPregnancy:
        verified.isPregnancy ?? null,

      isGyne:
        verified.isGyne ?? null,

      isPostpartum:
        verified.isPostpartum ?? null,

      weight:
        verified.weight ?? null,

      height:
        verified.height ?? null,

      obscoreG:
        verified.obscoreG ?? null,

      obscoreP:
        verified.obscoreP ?? null,

      gynecologicalDiagnosis:
        verified.gynecologicalDiagnosis ?? []
    },

    differences,

    needsPOGSBehaviorReview:
      differences.length > 0
  }
}];`,
    };

    @node({
        id: '40304019-7aae-41ef-a0e0-f0f7a67640dc',
        name: 'Result Record to File',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [5824, -1328],
    })
    ResultRecordToFile = {
        jsCode: `const record = $json;

const content =
  JSON.stringify(record, null, 2);

return [{
  json: {
    knowledgeId:
      record.knowledgeId,

    fileName:
      \`\${record.knowledgeId}-POGS.json\`
  },

  binary: {
    data: {
      data:
        Buffer
          .from(content, "utf8")
          .toString("base64"),

      mimeType:
        "application/json",

      fileName:
        \`\${record.knowledgeId}-POGS.json\`
    }
  }
}];`,
    };

    @node({
        id: '5bb294b9-d769-4b57-bf87-103619ca785c',
        name: 'Read/Write Files from Disk1',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [6048, -1328],
    })
    ReadWriteFilesFromDisk1 = {
        operation: 'write',
        fileName: '={{ "/data/knowledge/" + $json.fileName }}',
        options: {},
    };

    @node({
        id: '064116e9-77eb-4c11-b77c-f29835266d94',
        name: 'Extract Google Doc Text',
        type: 'n8n-nodes-base.googleDocs',
        version: 2,
        position: [1792, -1328],
        credentials: { googleDocsOAuth2Api: { id: 'NRlEgQamrPdmVK3h', name: 'Google Docs account' } },
    })
    ExtractGoogleDocText = {
        operation: 'get',
        documentURL: '={{ $json.documentId }}',
        simple: false,
    };

    @node({
        id: 'ac4c9e3b-e1bc-4403-b16f-0ba7d3063972',
        name: 'Build Raw Case Snapshot',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2016, -1376],
    })
    BuildRawCaseSnapshot = {
        mode: 'runOnceForEachItem',
        jsCode: `const doc = $json;

const documentId = doc.documentId;

if (!documentId) {
  throw new Error(
    "Missing Google documentId"
  );
}

function stableHash(value) {
  const str = String(value);

  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c6ce57;

  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);

    hash1 =
      Math.imul(
        hash1 ^ ch,
        2654435761
      );

    hash2 =
      Math.imul(
        hash2 ^ ch,
        1597334677
      );
  }

  hash1 =
    Math.imul(
      hash1 ^ (hash1 >>> 16),
      2246822507
    ) ^
    Math.imul(
      hash2 ^ (hash2 >>> 13),
      3266489909
    );

  hash2 =
    Math.imul(
      hash2 ^ (hash2 >>> 16),
      2246822507
    ) ^
    Math.imul(
      hash1 ^ (hash1 >>> 13),
      3266489909
    );

  return (
    (hash2 >>> 0)
      .toString(16)
      .padStart(8, "0")
    +
    (hash1 >>> 0)
      .toString(16)
      .padStart(8, "0")
  );
}

const rawCaseId =
  \`RAW-DOC-\${stableHash(documentId)}\`;

return {
  json: {
    rawCaseId,
    documentId,
    capturedAt:
      new Date().toISOString(),
    googleDoc: doc
  }
};`,
    };

    @node({
        id: 'bd393fbf-79cf-41b8-bf56-816e65e46107',
        name: 'Raw Case to File',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2240, -1376],
    })
    RawCaseToFile = {
        mode: 'runOnceForEachItem',
        jsCode: `const record = $json;

const content =
  JSON.stringify(
    record,
    null,
    2
  );

return {
  json: {
    rawCaseId:
      record.rawCaseId,

    fileName:
      \`\${record.rawCaseId}.json\`
  },

  binary: {
    data: {
      data:
        Buffer.from(
          content,
          "utf8"
        )
        .toString("base64"),

      mimeType:
        "application/json",

      fileName:
        \`\${record.rawCaseId}.json\`
    }
  }
};`,
    };

    @node({
        id: 'f3f961ba-a69a-46ec-a115-6166fac56857',
        name: 'Normalize Data',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2016, -1136],
    })
    NormalizeData = {
        mode: 'runOnceForEachItem',
        jsCode: `function extractParagraph(paragraph) {
  if (!paragraph?.elements) return '';

  return paragraph.elements
    .map(el => el.textRun?.content || '')
    .join('');
}

function extractStructuralElements(elements) {
  let output = '';

  for (const element of elements || []) {

    // Normal paragraph
    if (element.paragraph) {
      output += extractParagraph(element.paragraph);
    }

    // Table
    if (element.table) {
      for (const row of element.table.tableRows || []) {

        const cells = [];

        for (const cell of row.tableCells || []) {
          const cellText = extractStructuralElements(cell.content)
            .replace(/\\n+/g, ' ')
            .trim();

          cells.push(cellText);
        }

        // Preserve columns in a readable way
        output += cells.join(' | ') + '\\n';
      }
    }

    // Table of contents, if one exists
    if (element.tableOfContents) {
      output += extractStructuralElements(
        element.tableOfContents.content
      );
    }
  }

  return output;
}

const document = $json;

const documentText = extractStructuralElements(
  document.body?.content
)
  .replace(/[ \\t]+\\n/g, '\\n')
  .replace(/\\n{3,}/g, '\\n\\n')
  .trim();

return {
  json: {
    title: document.title,
    documentText,

    runContext:
      document.__runContext ?? {
        mode: "LIVE",
        rawCaseId: null
      }
  }
};`,
    };

    @node({
        id: '87aeecfe-99f5-4033-8da1-e279cfc60dfe',
        name: 'Load Raw Case',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1792, -1088],
    })
    LoadRawCase = {
        jsCode: `const items = $input.all();

if (items.length === 0) {
  throw new Error("No raw case files found");
}

const output = [];

for (let i = 0; i < items.length; i++) {
  const item = items[i];

  const binaryKeys =
    Object.keys(item.binary ?? {});

  if (binaryKeys.length === 0) {
    throw new Error(
      \`Raw case item \${i} has no binary file\`
    );
  }

  const binaryPropertyName =
    binaryKeys[0];

  const buffer =
    await this.helpers.getBinaryDataBuffer(
      i,
      binaryPropertyName
    );

  const text =
    buffer.toString("utf8");

  let record;

  try {
    record = JSON.parse(text);
  } catch (error) {
    throw new Error(
      \`Raw case item \${i} is invalid JSON: \${error.message}\`
    );
  }

  if (!record.googleDoc) {
    throw new Error(
      \`Raw case item \${i} does not contain googleDoc\`
    );
  }

  output.push({
    json: {
      ...record.googleDoc,

      __runContext: {
        mode: "REGRESSION",
        rawCaseId:
          record.rawCaseId ?? null
      }
    },

    pairedItem: {
      item: i
    }
  });
}

return output;`,
    };

    @node({
        id: 'ac5388a5-e4a6-4d57-85f3-35cccc2cc0bb',
        name: 'Regression Summary',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4480, -944],
    })
    RegressionSummary = {
        jsCode: `const items = $input.all();

const summary = {
  generatedAt: new Date().toISOString(),
  totalCases: items.length,

  statusCounts: {
    NEW: 0,
    IMPROVED: 0,
    REGRESSED: 0,
    CHANGED: 0,
    UNCHANGED: 0,
    UNKNOWN: 0
  },

  readyForPOGS: 0,
  notReadyForPOGS: 0,

  totalMappedTerms: 0,
  totalUnresolvedTerms: 0,
  totalValidationIssues: 0,
  totalWarnings: 0,
  totalUnsatisfiedRules: 0,
  totalUnknownFields: 0,

  needsAttention: 0,

  cases: []
};

for (const item of items) {
  const data = item.json;

  const regression =
    data.regressionResult ?? {};

  const current =
    data.currentRecord ?? {};

  const status =
    regression.status ?? "UNKNOWN";

  if (
    Object.prototype.hasOwnProperty.call(
      summary.statusCounts,
      status
    )
  ) {
    summary.statusCounts[status]++;
  } else {
    summary.statusCounts.UNKNOWN++;
  }

  const metrics =
    regression.currentMetrics ?? {};

  const ready =
    metrics.readyForPOGS === true;

  if (ready) {
    summary.readyForPOGS++;
  } else {
    summary.notReadyForPOGS++;
  }

  summary.totalMappedTerms +=
    Number(metrics.mapped ?? 0);

  summary.totalUnresolvedTerms +=
    Number(metrics.unresolved ?? 0);

  summary.totalValidationIssues +=
    Number(metrics.issues ?? 0);

  summary.totalWarnings +=
    Number(metrics.warnings ?? 0);

  summary.totalUnsatisfiedRules +=
    Number(metrics.unsatisfiedRules ?? 0);

  summary.totalUnknownFields +=
    Number(metrics.unknownFields ?? 0);

  const requiresAttention =
    status === "REGRESSED" ||
    status === "CHANGED" ||
    Number(metrics.unresolved ?? 0) > 0 ||
    Number(metrics.issues ?? 0) > 0 ||
    Number(metrics.unsatisfiedRules ?? 0) > 0 ||
    Number(metrics.unknownFields ?? 0) > 0;

  if (requiresAttention) {
    summary.needsAttention++;
  }

  summary.cases.push({
    knowledgeId:
      data.knowledgeId ?? null,

    rawCaseId:
      current.runContext?.rawCaseId ?? null,

    mode:
      current.runContext?.mode ?? "UNKNOWN",

    status,

    readyForPOGS: ready,

    mappedTerms:
      metrics.mapped ?? 0,

    unresolvedTerms:
      metrics.unresolved ?? 0,

    validationIssues:
      metrics.issues ?? 0,

    warnings:
      metrics.warnings ?? 0,

    unsatisfiedRules:
      metrics.unsatisfiedRules ?? 0,

    unknownFields:
      metrics.unknownFields ?? 0,

    changes:
      regression.changes ?? [],

    needsAttention:
      requiresAttention
  });
}

summary.allCasesStable =
  summary.statusCounts.REGRESSED === 0 &&
  summary.statusCounts.CHANGED === 0;

return [
  {
    json: summary
  }
];`,
    };

    @node({
        id: '78374d4d-f15a-4ae2-a368-edcfd86d6bcf',
        name: 'Summary to File',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4704, -1040],
    })
    SummaryToFile = {
        jsCode: `const report = $json;

const filename = "latest-regression.json";

const content =
  JSON.stringify(report, null, 2);

return [{
  json: {
    filename
  },

  binary: {
    data: {
      data:
        Buffer
          .from(content, "utf8")
          .toString("base64"),

      mimeType:
        "application/json",

      fileName:
        filename
    }
  }
}];`,
    };

    @node({
        id: 'a5cf59fa-b620-4cb2-8d0d-19d9fa054ebc',
        name: 'Write Regression Report',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [4928, -1040],
    })
    WriteRegressionReport = {
        operation: 'write',
        fileName: '={{ "/data/logs/" + $json.filename }}',
        options: {},
    };

    @node({
        id: '6cb86f34-87ff-49e9-bdd1-33f1340891c3',
        name: 'Read Existing Knowledge File',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [3808, -960],
        onError: 'continueRegularOutput',
        alwaysOutputData: false,
    })
    ReadExistingKnowledgeFile = {
        fileSelector: '={{ "/data/knowledge/" + $json.knowledgeId + ".json" }}',
        options: {},
    };

    @node({
        id: 'ed0e1a9e-eb09-4d9a-9d90-78b55275949f',
        name: 'Compare Knowledge Record',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4256, -1040],
    })
    CompareKnowledgeRecord = {
        mode: 'runOnceForEachItem',
        jsCode: `function comparable(record) {

  if (!record) return null;

  const copy =
    JSON.parse(
      JSON.stringify(record)
    );

  // Execution metadata - never affects semantic meaning
  delete copy.runContext;

  delete copy.lastUpdatedAt;
  delete copy.timestamp;
  delete copy.executionId;
  delete copy.capturedAt;

  // Optional transport/file metadata
  delete copy.fileName;
  delete copy.filePath;
  delete copy.mimeType;

  return copy;
}`,
    };

    @node({
        id: '4a31e3b0-86b9-4026-bc30-3c7604094fbd',
        name: 'Write Knowledge File',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [4704, -1232],
    })
    WriteKnowledgeFile = {
        operation: 'write',
        fileName: '={{ "/data/knowledge/" + $json.fileName }}',
        options: {},
    };

    @node({
        id: 'd9818984-4173-4871-8cc0-bbf40fb7f10a',
        name: 'Merge',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [4032, -1040],
    })
    Merge = {
        mode: 'combine',
        combineBy: 'combineByPosition',
        options: {},
    };

    @node({
        id: '2eb05a36-7c46-40a2-83e2-a1b40ac1f613',
        name: 'Build Raw Case Identity',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [672, -1328],
    })
    BuildRawCaseIdentity = {
        mode: 'runOnceForEachItem',
        jsCode: `const data = $json;

const documentId =
  data.documentId;

if (!documentId) {
  throw new Error(
    "Missing Google documentId"
  );
}

// Google document IDs should only contain characters
// safe for deterministic local identity generation.
if (
  !/^[A-Za-z0-9_-]+$/.test(documentId)
) {
  throw new Error(
    "Unexpected Google documentId format"
  );
}

function stableHash(value) {
  const str =
    String(value);

  let hash1 =
    0xdeadbeef;

  let hash2 =
    0x41c6ce57;

  for (
    let i = 0;
    i < str.length;
    i++
  ) {
    const ch =
      str.charCodeAt(i);

    hash1 =
      Math.imul(
        hash1 ^ ch,
        2654435761
      );

    hash2 =
      Math.imul(
        hash2 ^ ch,
        1597334677
      );
  }

  hash1 =
    Math.imul(
      hash1 ^ (hash1 >>> 16),
      2246822507
    ) ^
    Math.imul(
      hash2 ^ (hash2 >>> 13),
      3266489909
    );

  hash2 =
    Math.imul(
      hash2 ^ (hash2 >>> 16),
      2246822507
    ) ^
    Math.imul(
      hash1 ^ (hash1 >>> 13),
      3266489909
    );

  return (
    (hash2 >>> 0)
      .toString(16)
      .padStart(8, "0")
    +
    (hash1 >>> 0)
      .toString(16)
      .padStart(8, "0")
  );
}

const rawCaseId =
  \`RAW-DOC-\${stableHash(documentId)}\`;

return {
  json: {
    ...data,

    rawCaseId,

    rawCaseFileName:
      \`\${rawCaseId}.json\`
  }
};`,
    };

    @node({
        id: 'd0d332e6-5c47-4cd1-88c3-040bffab989b',
        name: 'Raw Case Already Exists?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1568, -1328],
    })
    RawCaseAlreadyExists = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: 'cb6c1f5a-b4ab-4eaf-9335-6ee8d9de012a',
                    leftValue: '={{ $json.rawCaseExists }}',
                    rightValue: '',
                    operator: {
                        type: 'boolean',
                        operation: 'true',
                        singleValue: true,
                    },
                },
            ],
            combinator: 'and',
        },
        options: {},
    };

    @node({
        id: 'da2c58e5-8f4d-42e1-88e6-44a3be01a6db',
        name: 'Write Raw Case',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [2464, -1376],
    })
    WriteRawCase = {
        operation: 'write',
        fileName: '={{ "/data/cases/raw_cases/new/" + $json.fileName }}',
        options: {},
    };

    @node({
        id: 'e5bc6738-7fd2-4076-bb03-0f001849e0cc',
        name: 'Build Regression Evidence Bundle',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4704, -848],
    })
    BuildRegressionEvidenceBundle = {
        jsCode: `// Regression Summary should provide exactly one item.
const summaryItems =
  $input.all();

if (summaryItems.length === 0) {
  throw new Error(
    "Regression Summary produced no output"
  );
}

const regression =
  summaryItems[0].json;


// --------------------------------------------------
// Get the exact knowledge records used in this
// regression run.
//
// Compare Knowledge Record already contains the
// current knowledge record for each case.
// --------------------------------------------------

const compareItems =
  $items(
    "Compare Knowledge Record"
  );

if (compareItems.length === 0) {
  throw new Error(
    "No Compare Knowledge Record items found"
  );
}


const knowledge = [];

for (const item of compareItems) {
  const record =
    item.json.currentRecord ??
    null;

  if (!record) {
    throw new Error(
      "Compare Knowledge Record item is missing currentRecord"
    );
  }

  if (!record.knowledgeId) {
    throw new Error(
      "Knowledge record is missing knowledgeId"
    );
  }

  const cleanRecord = {
    ...record
  };
  
  delete cleanRecord.mimeType;
  delete cleanRecord.fileType;
  delete cleanRecord.fileName;
  delete cleanRecord.fileExtension;
  delete cleanRecord.fileSize;
  
  knowledge.push(
    cleanRecord
  );
}


// --------------------------------------------------
// Deterministic ordering.
//
// This makes bundles easier to diff between runs.
// --------------------------------------------------

knowledge.sort(
  (a, b) =>
    String(a.knowledgeId)
      .localeCompare(
        String(b.knowledgeId)
      )
);


// --------------------------------------------------
// Use the regression timestamp as the run identity.
// --------------------------------------------------

const generatedAt =
  regression.generatedAt ??
  new Date().toISOString();

const regressionRunId =
  \`REG-\${generatedAt
    .replace(/[-:.]/g, "")
    .replace("T", "-")
    .replace("Z", "")}\`;


// --------------------------------------------------
// Final evidence bundle.
//
// IMPORTANT:
// This contains sanitized knowledge records,
// not raw Google Docs / PHI.
// --------------------------------------------------

return [
  {
    json: {
      schemaVersion: "1.0",

      artifactType:
        "regression-evidence-bundle",

      regressionRunId,

      generatedAt,

      knowledgeFileCount:
        knowledge.length,

      knowledge,

      regression
    }
  }
];`,
    };

    @node({
        id: '2ee31f05-8a11-4bf2-af16-9b109ef23da3',
        name: 'Regression Evidence Bundle to File',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4928, -848],
    })
    RegressionEvidenceBundleToFile = {
        mode: 'runOnceForEachItem',
        jsCode: `const bundle =
  $json;

if (!bundle.regressionRunId) {
  throw new Error(
    "Missing regressionRunId"
  );
}

const fileName =
  \`\${bundle.regressionRunId}.json\`;

const content =
  JSON.stringify(
    bundle,
    null,
    2
  );

return {
  json: {
    regressionRunId:
      bundle.regressionRunId,

    generatedAt:
      bundle.generatedAt,

    knowledgeFileCount:
      bundle.knowledgeFileCount,

    fileName
  },

  binary: {
    data: {
      data:
        Buffer.from(
          content,
          "utf8"
        ).toString(
          "base64"
        ),

      mimeType:
        "application/json",

      fileName
    }
  }
};`,
    };

    @node({
        id: 'd1c63f87-caa2-433f-b5b7-02f3b545e4f0',
        name: 'Write Regression Evidence Bundle',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [5152, -848],
    })
    WriteRegressionEvidenceBundle = {
        operation: 'write',
        fileName: '={{ "/data/logs/regression_runs/" + $json.fileName }}',
        options: {},
    };

    @node({
        id: 'aaca089b-08b0-44fa-bcaa-b546ac9c94f9',
        name: 'Read Raw Case Matches',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [896, -1392],
        onError: 'continueRegularOutput',
    })
    ReadRawCaseMatches = {
        fileSelector: '={{   "/data/cases/raw_cases/*/" +   $json.rawCaseId +   ".json" }}',
        options: {},
    };

    @node({
        id: 'ec1a3986-9657-4da8-9b5a-30480a3974b9',
        name: 'Normalize Raw Case Check',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1120, -1392],
    })
    NormalizeRawCaseCheck = {
        mode: 'runOnceForEachItem',
        jsCode: `const item = $json;

const rawCaseExists =
  Boolean(item.fileName) &&
  !item.error;

return {
  json: {
    rawCaseExists,
    matchedFileName:
      rawCaseExists
        ? item.fileName
        : null
  }
};`,
    };

    @node({
        id: 'e540b767-1479-4974-b210-4fccc52a4961',
        name: 'Merge Raw Case Check Data',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [1344, -1328],
    })
    MergeRawCaseCheckData = {
        mode: 'combine',
        combineBy: 'combineByPosition',
        options: {},
    };

    @node({
        id: '13ae1f84-927a-4a4f-b4c9-d2f8d1cf6ae7',
        name: 'Read New Raw Case File',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [1568, -1088],
    })
    ReadNewRawCaseFile = {
        fileSelector: '/data/cases/raw_cases/new/*.json',
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.WhenClickingExecuteWorkflow.out(0).to(this.ReadNewRawCaseFile.in(0));
        this.ExtractRowData.out(0).to(this.ExtractGoogleDocsLink.in(0));
        this.ExtractGoogleDocsLink.out(0).to(this.BuildRawCaseIdentity.in(0));
        this.ParseClinicalSections.out(0).to(this.ClassifyCaseType.in(0));
        this.BuildPogsCandidate.out(0).to(this.ValidatePogsCandidate.in(0));
        this.ValidatePogsCandidate.out(0).to(this.CandidateReady.in(0));
        this.ValidatePogsCandidate.out(0).to(this.BuildKnowledgeRecord.in(0));
        this.ClassifyCaseType.out(0).to(this.ExtractDiagnosisTerms.in(0));
        this.ExtractDiagnosisTerms.out(0).to(this.MapDiagnosisToPogsReferences.in(0));
        this.MapDiagnosisToPogsReferences.out(0).to(this.BuildPogsCandidate.in(0));
        this.Ping.out(0).to(this.Login.in(0));
        this.Login.out(0).to(this.CheckExistingCase.in(0));
        this.CreatePatientCaseRecord.out(0).to(this.CreateCase.in(0));
        this.CreateCase.out(0).to(this.VerifyCreatedCase.in(0));
        this.CheckExistingCase.out(0).to(this.NormalizeCaseCheck.in(0));
        this.CaseAlreadyExists.out(0).to(this.DuplicateCaseStop.in(0));
        this.CaseAlreadyExists.out(1).to(this.CreatePatientCaseRecord.in(0));
        this.NormalizeCaseCheck.out(0).to(this.CaseAlreadyExists.in(0));
        this.CandidateReady.out(0).to(this.Ping.in(0));
        this.BuildKnowledgeRecord.out(0).to(this.ReadExistingKnowledgeFile.in(0));
        this.BuildKnowledgeRecord.out(0).to(this.Merge.in(0));
        this.KnowledgeRecordToFile.out(0).to(this.WriteKnowledgeFile.in(0));
        this.VerifyCreatedCase.out(0).to(this.BuildPogsResultKnowledge.in(0));
        this.BuildPogsResultKnowledge.out(0).to(this.ResultRecordToFile.in(0));
        this.ResultRecordToFile.out(0).to(this.ReadWriteFilesFromDisk1.in(0));
        this.ExtractGoogleDocText.out(0).to(this.NormalizeData.in(0));
        this.ExtractGoogleDocText.out(0).to(this.BuildRawCaseSnapshot.in(0));
        this.BuildRawCaseSnapshot.out(0).to(this.RawCaseToFile.in(0));
        this.RawCaseToFile.out(0).to(this.WriteRawCase.in(0));
        this.NormalizeData.out(0).to(this.ParseClinicalSections.in(0));
        this.LoadRawCase.out(0).to(this.NormalizeData.in(0));
        this.RegressionSummary.out(0).to(this.BuildRegressionEvidenceBundle.in(0));
        this.RegressionSummary.out(0).to(this.SummaryToFile.in(0));
        this.SummaryToFile.out(0).to(this.WriteRegressionReport.in(0));
        this.ReadExistingKnowledgeFile.out(0).to(this.Merge.in(1));
        this.CompareKnowledgeRecord.out(0).to(this.KnowledgeRecordToFile.in(0));
        this.CompareKnowledgeRecord.out(0).to(this.RegressionSummary.in(0));
        this.Merge.out(0).to(this.CompareKnowledgeRecord.in(0));
        this.BuildRawCaseIdentity.out(0).to(this.ReadRawCaseMatches.in(0));
        this.BuildRawCaseIdentity.out(0).to(this.MergeRawCaseCheckData.in(1));
        this.RawCaseAlreadyExists.out(1).to(this.ExtractGoogleDocText.in(0));
        this.BuildRegressionEvidenceBundle.out(0).to(this.RegressionEvidenceBundleToFile.in(0));
        this.RegressionEvidenceBundleToFile.out(0).to(this.WriteRegressionEvidenceBundle.in(0));
        this.ReadRawCaseMatches.out(0).to(this.NormalizeRawCaseCheck.in(0));
        this.NormalizeRawCaseCheck.out(0).to(this.MergeRawCaseCheckData.in(0));
        this.MergeRawCaseCheckData.out(0).to(this.RawCaseAlreadyExists.in(0));
        this.ReadNewRawCaseFile.out(0).to(this.LoadRawCase.in(0));
    }
}
