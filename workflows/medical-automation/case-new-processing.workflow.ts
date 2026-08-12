import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : case-new-processing
// Nodes   : 21  |  Connections: 22
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// WhenClickingExecuteWorkflow        manualTrigger
// ParseClinicalSections              code
// NormalizeData                      code
// LoadRawCase                        code
// ReadNewRawCaseFile                 readWriteFile
// CandidateReady                     if
// WhenExecutedByAnotherWorkflow      executeWorkflowTrigger
// ValidateProcessingRequest          code
// ReadRequestedRawCase               readWriteFile
// DeterministicCaseClassification    code
// DeterministicDeliveryEvidence      code
// DetermineAiNeed                    code
// PrepareAiInput                     code
// MarkAiNotUsed                      code
// MergeClinicalFacts                 code
// MergeWithOriginal                  merge
// CallPogsRuleEngine                 executeWorkflow
// CallClinicalAiHelper               executeWorkflow
// AiNeeded                           if
// CallKnowledgeRegression            executeWorkflow
// CallPogsProcessing                 executeWorkflow
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WhenClickingExecuteWorkflow
//    → ReadNewRawCaseFile
//      → LoadRawCase
//        → NormalizeData
//          → ParseClinicalSections
//            → DeterministicCaseClassification
//              → DeterministicDeliveryEvidence
//                → DetermineAiNeed
//                  → AiNeeded
//                    → PrepareAiInput
//                      → CallClinicalAiHelper
//                        → MergeWithOriginal
//                          → MergeClinicalFacts
//                            → CallPogsRuleEngine
//                              → CallKnowledgeRegression
//                                → CandidateReady
//                                  → CallPogsProcessing
//                      → MergeWithOriginal.in(1) (↩ loop)
//                   .out(1) → MarkAiNotUsed
//                      → MergeClinicalFacts (↩ loop)
// WhenExecutedByAnotherWorkflow
//    → ValidateProcessingRequest
//      → ReadRequestedRawCase
//        → LoadRawCase (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'mvtFIT6QbBavL3yf',
    name: 'case-new-processing',
    active: false,
    isArchived: false,
    settings: { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: false },
})
export class CaseNewProcessingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '55b98a2d-97e6-40fd-908a-05a8accca110',
        name: 'When clicking ‘Execute workflow’',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [1424, -1728],
    })
    WhenClickingExecuteWorkflow = {};

    @node({
        id: '452ff365-5d4d-4224-91c1-85f6959170c3',
        name: 'Parse Clinical Sections',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2320, -1824],
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
        rawCaseId: null,
        aiPolicy: 'AUTO'
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

    clinicalFacts: {
      currentPregnancyDelivered:
        null,
    
      deliveryDate:
        null,
    
      deliveryMannerText:
        null,
    
      pregnancyTypeText:
        null,
    
      admissionAOGWeeks:
        null,
    
      admissionAOGDays:
        null,
    
      comorbidityTerms:
        [],
    
      procedureTerms:
        [],
    
      neonatalFacts:
        []
    }


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
        id: '14ec06a3-6135-4d0c-b0c8-3b53e366ae39',
        name: 'Normalize Data',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2096, -1824],
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
        rawCaseId: null,
        aiPolicy: "AUTO"
      }
  }
};`,
    };

    @node({
        id: '530a8e4f-2d60-4090-8963-84c9fb74aa54',
        name: 'Load Raw Case',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1872, -1824],
    })
    LoadRawCase = {
        mode: 'runOnceForEachItem',
        jsCode: `const binaryKeys =
  Object.keys($binary ?? {});

if (binaryKeys.length === 0) {
  throw new Error(
    "Raw case has no binary file"
  );
}

const binaryProperty =
  binaryKeys[0];

const buffer =
  await this.helpers
    .getBinaryDataBuffer(
      $itemIndex,
      binaryProperty
    );

let record;

try {
  record =
    JSON.parse(
      buffer.toString("utf8")
    );
} catch (error) {
  throw new Error(
    \`Invalid raw case JSON: \${error.message}\`
  );
}

if (!record.googleDoc) {
  throw new Error(
    "Raw case does not contain googleDoc"
  );
}

if (!record.rawCaseId) {
  throw new Error(
    "Raw case does not contain rawCaseId"
  );
}

let requestContext = null;

try {
  requestContext =
    $("Validate Processing Request")
      .item
      .json;
} catch (error) {
  requestContext = null;
}

return {
  json: {
    ...record.googleDoc,

    __runContext: {
      mode:
        requestContext?.mode ??
        "LIVE",
      rawCaseId:
        requestContext?.rawCaseId ??
        record.rawCaseId,

      sourceQueue:
        requestContext?.sourceQueue ??
        "new",

      aiPolicy:
        requestContext?.aiPolicy ??
        "AUTO"
    }
  }
};`,
    };

    @node({
        id: '97d5fb73-bacf-4714-8064-02df17855ecb',
        name: 'Read New Raw Case File',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [1648, -1728],
    })
    ReadNewRawCaseFile = {
        fileSelector: '/data/cases/raw_cases/new/*.json',
        options: {},
    };

    @node({
        id: '7085bcc7-dde8-43f0-b95f-33f7967a916c',
        name: 'Candidate Ready?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [4784, -1824],
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
                    id: '55675f59-3c0e-4390-90a4-daabc1aaf297',
                    leftValue: `={{
  $json.validation?.readyForPOGS === true
  &&
  $json.runContext?.mode === "LIVE"
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
        id: '7ddec283-2e53-4bcf-bfb4-65602e3c4829',
        name: 'When Executed by Another Workflow',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.2,
        position: [1200, -1920],
    })
    WhenExecutedByAnotherWorkflow = {
        inputSource: 'passthrough',
    };

    @node({
        id: '142113e9-9b7b-4062-b40f-8161498bcee0',
        name: 'Validate Processing Request',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1424, -1920],
    })
    ValidateProcessingRequest = {
        mode: 'runOnceForEachItem',
        jsCode: `const d = $json;

if (!d.rawCaseId) {
  throw new Error(
    "Missing rawCaseId"
  );
}

if (
  !/^RAW-DOC-[a-f0-9]+$/i.test(
    d.rawCaseId
  )
) {
  throw new Error(
    "Invalid rawCaseId"
  );
}

const sourceQueue =
  d.sourceQueue ?? "new";

if (
  ![
    "new",
    "for_checking",
    "gaps",
    "completed"
  ].includes(sourceQueue)
) {
  throw new Error(
    \`Invalid sourceQueue: \${sourceQueue}\`
  );
}

const mode =
  d.mode ?? "LIVE";

if (
  !["LIVE", "REGRESSION"].includes(mode)
) {
  throw new Error(
    \`Invalid mode: \${mode}\`
  );
}

const aiPolicy =
  d.aiPolicy ?? "AUTO";

if (
  !["AUTO", "DISABLED", "FORCE"].includes(
    aiPolicy
  )
) {
  throw new Error(
    \`Invalid aiPolicy: \${aiPolicy}\`
  );
}

return {
  json: {
    rawCaseId: d.rawCaseId,
    sourceQueue,
    mode,
    aiPolicy
  }
};`,
    };

    @node({
        id: '8679e6ec-efff-4f26-874c-daabb7383fee',
        name: 'Read Requested Raw Case',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [1648, -1920],
    })
    ReadRequestedRawCase = {
        fileSelector: '={{  "/data/cases/raw_cases/" +  $json.sourceQueue +  "/" +  $json.rawCaseId +  ".json"}}',
        options: {},
    };

    @node({
        id: 'df2ff492-066d-4fa7-a0c0-966ec41e4b7a',
        name: 'Deterministic Case Classification',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2544, -1824],
    })
    DeterministicCaseClassification = {
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
    
      currentPregnancyDelivered:
        isPostpartum === true
          ? true
          : null,
    
      pregnancyTestNegative,
    
      reasons
    }
  }
};`,
    };

    @node({
        id: '8b676650-a615-40de-ac03-414e55495b5d',
        name: 'Deterministic Delivery Evidence',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2768, -1824],
    })
    DeterministicDeliveryEvidence = {
        mode: 'runOnceForEachItem',
        jsCode: `const d = $json;

const text = [
  d.sections?.reasonForAdmission,
  d.sections?.historyOfPresentIllness,
  d.sections?.finalDiagnosis,
  d.sections?.courseInWard
]
  .filter(Boolean)
  .join("\\n")
  .toLowerCase();

const evidence = [];

const patterns = [
  {
    label: "explicit postpartum",
    regex:
      /\\bpostpartum\\b|\\bpuerper/i
  },
  {
    label: "status post delivery",
    regex:
      /\\bstatus post delivery\\b|\\bs\\/p delivery\\b/i
  },
  {
    label: "explicit delivered",
    regex:
      /\\bpatient delivered\\b|\\bwas delivered\\b|\\bdelivered via\\b/i
  },
  {
    label: "cesarean delivery",
    regex:
      /\\b(?:s\\/p|status post)\\s+(?:primary |repeat )?(?:cesarean|caesarean|cs)\\b/i
  },
  {
    label: "vaginal delivery",
    regex:
      /\\b(?:s\\/p|status post)\\s+(?:normal spontaneous delivery|nsd|vaginal delivery)\\b/i
  }
];

for (const p of patterns) {
  if (p.regex.test(text)) {
    evidence.push(p.label);
  }
}

const explicitlyDelivered =
  evidence.length > 0;

return {
  json: {
    ...d,

    deliveryState: {
      currentPregnancyDelivered:
        explicitlyDelivered
          ? true
          : null,

      evidence
    }
  }
};`,
    };

    @node({
        id: '45bff710-9939-4f10-9d79-faad8f6e37ad',
        name: 'Determine AI Need',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2992, -1824],
    })
    DetermineAiNeed = {
        mode: 'runOnceForEachItem',
        jsCode: `const d = $json;

const requestedAiPolicy =
  d.runContext?.aiPolicy ??
  "AUTO";

const needsAIByData =
  d.classification
    ?.isPregnancy == null ||

  d.classification
    ?.isGyne == null ||

  (
    d.classification
      ?.isPregnancy === true &&
    d.deliveryState
      ?.currentPregnancyDelivered == null
  );

const reasons = [];

if (
  d.classification
    ?.isPregnancy == null
) {
  reasons.push(
    "pregnancy classification unresolved"
  );
}

if (
  d.classification
    ?.isGyne == null
) {
  reasons.push(
    "gyne classification unresolved"
  );
}

if (
  d.classification
    ?.isPregnancy === true &&
  d.deliveryState
    ?.currentPregnancyDelivered == null
) {
  reasons.push(
    "current pregnancy delivery state unresolved"
  );
}

let needsAI =
  needsAIByData;

if (
  requestedAiPolicy === "DISABLED"
) {
  needsAI = false;
  reasons.unshift(
    "AI disabled by policy"
  );
}

if (
  requestedAiPolicy === "FORCE"
) {
  needsAI = true;
  reasons.unshift(
    "AI forced by policy"
  );
}


return {
  json: {
    ...d,

    aiRouting: {
      policy: requestedAiPolicy,
      needsAIByData,
      needsAI,
      reasons
    }
  }
};`,
    };

    @node({
        id: '1bc80407-05d0-455c-9c40-37d57b4cdb07',
        name: 'Prepare AI Input',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3440, -1920],
    })
    PrepareAiInput = {
        mode: 'runOnceForEachItem',
        jsCode: `const d = $json;

const clinicalText = [
  d.sections
    ?.reasonForAdmission,
  d.sections
    ?.historyOfPresentIllness,
  d.sections
    ?.finalDiagnosis,
  d.sections
    ?.courseInWard
]
  .filter(Boolean)
  .join("\\n\\n");

return {
  json: {
    originalCase:
      d,

    aiRequest: {
      clinicalText,

      knownFacts: {
        isPregnancy:
          d.classification
            ?.isPregnancy ?? null,

        isGyne:
          d.classification
            ?.isGyne ?? null,

        isPostpartum:
          d.classification
            ?.isPostpartum ?? null,

        currentPregnancyDelivered:
          d.deliveryState
            ?.currentPregnancyDelivered
            ?? null,

        obscoreG:
          d.obstetric
            ?.gravida ?? null,

        obscoreP:
          d.obstetric
            ?.para ?? null,

        obscoreFT:
          d.obstetric
            ?.fullTerm ?? null,

        obscorePr:
          d.obstetric
            ?.preterm ?? null,

        obscoreAb:
          d.obstetric
            ?.abortion ?? null,

        obscoreLB:
          d.obstetric
            ?.living ?? null
      },

      unresolvedTerms:
        []
    }
  }
};`,
    };

    @node({
        id: '1f9a9c60-faca-48c0-b120-cb4377d47960',
        name: 'Mark AI Not Used',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3888, -1712],
    })
    MarkAiNotUsed = {
        mode: 'runOnceForEachItem',
        jsCode: `const original = $json;

return {
  json: {
    originalCase: original,

    aiFacts: {
      isPregnancy: null,
      isGyne: null,
      isPostpartum: null,
      currentPregnancyDelivered: null,
      pregnancyTypeText: null,
      deliveryMannerText: null,
      deliveryEvidence: [],
      diagnosisTerms: [],
      comorbidityTerms: [],
      procedureTerms: [],
      uncertainFacts: []
    },

    aiMeta: {
      used: false,
      model: null,
      responseId: null
    }
  }
};`,
    };

    @node({
        id: 'f68a3b7d-64bc-4071-aab0-d795c097ee05',
        name: 'Merge Clinical Facts',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4112, -1824],
    })
    MergeClinicalFacts = {
        mode: 'runOnceForEachItem',
        jsCode: `const original =
  $json.originalCase;

if (!original) {
  throw new Error(
    "Merge Clinical Facts: originalCase missing"
  );
}

const ai =
  $json.aiFacts ?? {};

function deterministicFirst(
  deterministicValue,
  aiValue
) {
  if (
    deterministicValue !== null &&
    deterministicValue !== undefined
  ) {
    return deterministicValue;
  }

  return aiValue ?? null;
}

const isPregnancy =
  deterministicFirst(
    original.classification
      ?.isPregnancy,
    ai.isPregnancy
  );

const isGyne =
  deterministicFirst(
    original.classification
      ?.isGyne,
    ai.isGyne
  );

const isPostpartum =
  deterministicFirst(
    original.classification
      ?.isPostpartum,
    ai.isPostpartum
  );

const currentPregnancyDelivered =
  deterministicFirst(
    original.deliveryState
      ?.currentPregnancyDelivered,
    ai.currentPregnancyDelivered
  );

return {
  json: {
    ...original,

    classification: {
      ...original.classification,

      isPregnancy,
      isGyne,
      isPostpartum
    },

    deliveryState: {
      ...original.deliveryState,

      currentPregnancyDelivered,

      aiEvidence:
        ai.deliveryEvidence ??
        []
    },

    clinicalConcepts: {
      ...(
        original.clinicalConcepts ??
        {}
      ),

      pregnancyTypeText:
        deterministicFirst(
          original.clinicalConcepts
            ?.pregnancyTypeText,
          ai.pregnancyTypeText
        ),

      deliveryMannerText:
        deterministicFirst(
          original.clinicalConcepts
            ?.deliveryMannerText,
          ai.deliveryMannerText
        ),

      aiDiagnosisTerms:
        ai.diagnosisTerms ??
        [],

      aiComorbidityTerms:
        ai.comorbidityTerms ??
        [],

      aiProcedureTerms:
        ai.procedureTerms ??
        []
    },

    aiAssistance: {
      used:
        true,

      model:
        $json.aiMeta
          ?.model ??
        null,

      responseId:
        $json.aiMeta
          ?.responseId ??
        null,

      uncertainFacts:
        ai.uncertainFacts ??
        []
    }
  }
};`,
    };

    @node({
        id: '405c431a-7121-4ac4-903f-a6d5c75c38c5',
        name: 'Merge with Original',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [3888, -1920],
    })
    MergeWithOriginal = {
        mode: 'combine',
        combineBy: 'combineByPosition',
        options: {
            clashHandling: {
                values: {
                    resolveClash: 'preferLast',
                },
            },
        },
    };

    @node({
        id: '25df0889-143b-4016-a0da-c6d7d1dda966',
        name: 'Call pogs-rule-engine',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [4336, -1824],
    })
    CallPogsRuleEngine = {
        workflowId: {
            __rl: true,
            value: 'p579PotbV56XZXzp',
            mode: 'list',
            cachedResultUrl: '/workflow/p579PotbV56XZXzp',
            cachedResultName: 'pogs-rule-engine',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {},
            matchingColumns: [],
            schema: [],
            attemptToConvertTypes: false,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: true,
        },
    };

    @node({
        id: '9762febe-bdb2-4902-b4db-bd8a0bc08e63',
        name: 'Call clinical-ai-helper',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [3664, -2000],
    })
    CallClinicalAiHelper = {
        workflowId: {
            __rl: true,
            value: 'RdfJbQll0ukwP31f',
            mode: 'list',
            cachedResultUrl: '/workflow/RdfJbQll0ukwP31f',
            cachedResultName: 'clinical-ai-helper',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                clinicalText: '={{ $json.aiRequest.clinicalText }}',
                knownFacts: '={{ $json.aiRequest.knownFacts }}',
                unresolvedTerms: '={{ $json.aiRequest.unresolvedTerms }}',
            },
            matchingColumns: [],
            schema: [
                {
                    id: 'clinicalText',
                    displayName: 'clinicalText',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: false,
                },
                {
                    id: 'knownFacts',
                    displayName: 'knownFacts',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'object',
                    removed: false,
                },
                {
                    id: 'unresolvedTerms',
                    displayName: 'unresolvedTerms',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'array',
                    removed: false,
                },
            ],
            attemptToConvertTypes: false,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: true,
        },
    };

    @node({
        id: 'ea00dace-d94f-474f-9724-9b3678c15c19',
        name: 'AI Needed?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [3216, -1824],
    })
    AiNeeded = {
        conditions: {
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    id: '0e694be2-46a3-43fd-8c6a-495c37289f9e',
                    leftValue: '={{  $json.aiRouting    ?.needsAI === true}}',
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
        id: '25b6a860-c7bc-4fd8-b715-098cd88b4cd0',
        name: 'Call knowledge-regression',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [4560, -1824],
    })
    CallKnowledgeRegression = {
        workflowId: {
            __rl: true,
            value: 'BT3xUOVZuyKE5bbz',
            mode: 'list',
            cachedResultUrl: '/workflow/BT3xUOVZuyKE5bbz',
            cachedResultName: 'knowledge-regression',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {},
            matchingColumns: [],
            schema: [],
            attemptToConvertTypes: false,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: true,
        },
    };

    @node({
        id: '9d4d0943-140e-49db-b84d-6dc10285a287',
        name: 'Call pogs-processing',
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [5008, -1824],
    })
    CallPogsProcessing = {
        workflowId: {
            __rl: true,
            value: 'muoM56eF7sszgYmW',
            mode: 'list',
            cachedResultUrl: '/workflow/muoM56eF7sszgYmW',
            cachedResultName: 'pogs-processing',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {},
            matchingColumns: [],
            schema: [],
            attemptToConvertTypes: false,
            convertFieldsToString: true,
        },
        options: {
            waitForSubWorkflow: true,
        },
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.WhenClickingExecuteWorkflow.out(0).to(this.ReadNewRawCaseFile.in(0));
        this.ParseClinicalSections.out(0).to(this.DeterministicCaseClassification.in(0));
        this.NormalizeData.out(0).to(this.ParseClinicalSections.in(0));
        this.LoadRawCase.out(0).to(this.NormalizeData.in(0));
        this.ReadNewRawCaseFile.out(0).to(this.LoadRawCase.in(0));
        this.CandidateReady.out(0).to(this.CallPogsProcessing.in(0));
        this.WhenExecutedByAnotherWorkflow.out(0).to(this.ValidateProcessingRequest.in(0));
        this.ValidateProcessingRequest.out(0).to(this.ReadRequestedRawCase.in(0));
        this.ReadRequestedRawCase.out(0).to(this.LoadRawCase.in(0));
        this.DeterministicCaseClassification.out(0).to(this.DeterministicDeliveryEvidence.in(0));
        this.DeterministicDeliveryEvidence.out(0).to(this.DetermineAiNeed.in(0));
        this.DetermineAiNeed.out(0).to(this.AiNeeded.in(0));
        this.PrepareAiInput.out(0).to(this.CallClinicalAiHelper.in(0));
        this.PrepareAiInput.out(0).to(this.MergeWithOriginal.in(1));
        this.MarkAiNotUsed.out(0).to(this.MergeClinicalFacts.in(0));
        this.MergeWithOriginal.out(0).to(this.MergeClinicalFacts.in(0));
        this.MergeClinicalFacts.out(0).to(this.CallPogsRuleEngine.in(0));
        this.CallClinicalAiHelper.out(0).to(this.MergeWithOriginal.in(0));
        this.AiNeeded.out(0).to(this.PrepareAiInput.in(0));
        this.AiNeeded.out(1).to(this.MarkAiNotUsed.in(0));
        this.CallPogsRuleEngine.out(0).to(this.CallKnowledgeRegression.in(0));
        this.CallKnowledgeRegression.out(0).to(this.CandidateReady.in(0));
    }
}
