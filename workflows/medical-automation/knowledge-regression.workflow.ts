import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : knowledge-regression
// Nodes   : 16  |  Connections: 18
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// BuildKnowledgeRecord               code
// KnowledgeRecordToFile              code
// RegressionSummary                  code
// SummaryToFile                      code
// WriteRegressionReport              readWriteFile
// ReadExistingKnowledgeFile          readWriteFile              [onError→out(1)]
// CompareKnowledgeRecord             code
// WriteKnowledgeFile                 readWriteFile
// Merge                              merge
// BuildRegressionEvidenceBundle      code
// RegressionEvidenceBundleToFile     code
// WriteRegressionEvidenceBundle      readWriteFile
// WhenExecutedByAnotherWorkflow      executeWorkflowTrigger
// MergeRegressionOutputs             merge
// MergeKnowledgeOutputs              merge
// ReturnCandidate                    code
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WhenExecutedByAnotherWorkflow
//    → BuildKnowledgeRecord
//      → ReadExistingKnowledgeFile
//        → Merge.in(1)
//          → CompareKnowledgeRecord
//            → KnowledgeRecordToFile
//              → WriteKnowledgeFile
//                → MergeKnowledgeOutputs
//                  → ReturnCandidate
//            → RegressionSummary
//              → BuildRegressionEvidenceBundle
//                → RegressionEvidenceBundleToFile
//                  → WriteRegressionEvidenceBundle
//                    → MergeRegressionOutputs.in(1)
//                      → MergeKnowledgeOutputs.in(1) (↩ loop)
//              → SummaryToFile
//                → WriteRegressionReport
//                  → MergeRegressionOutputs (↩ loop)
//      → Merge (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'BT3xUOVZuyKE5bbz',
    name: 'knowledge-regression',
    active: false,
    isArchived: false,
    settings: { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: false },
})
export class KnowledgeRegressionWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'ca9346fb-d8ab-4577-acc8-d28350972b13',
        name: 'Build Knowledge Record',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3600, -1072],
    })
    BuildKnowledgeRecord = {
        mode: 'runOnceForEachItem',
        jsCode: `const d = $json;


// --------------------------------------------------
// Required routing identity
// --------------------------------------------------

if (!d.runContext?.rawCaseId) {
  throw new Error(
    "Build Knowledge Record: missing rawCaseId"
  );
}

if (!d.caseNum) {
  throw new Error(
    "Build Knowledge Record: missing caseNum"
  );
}


// --------------------------------------------------
// Stable knowledge ID
//
// Keep the existing caseNum-based hash for now so
// existing regression files remain comparable.
// The caseNum itself is NOT written to the
// knowledge record.
// --------------------------------------------------

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


const knowledgeId =
  \`CASE-\${stableHash(d.caseNum)}\`;

const timestamp =
  new Date().toISOString();


// --------------------------------------------------
// POGS mapping information
// --------------------------------------------------

const gyneDiagnoses =
  Array.isArray(
    d.gynecologicalDiagnosis
  )
    ? d.gynecologicalDiagnosis
    : [];

const unresolvedMappings =
  Array.isArray(
    d.unresolvedMappings
  )
    ? d.unresolvedMappings
    : [];

const ignoredMappings =
  Array.isArray(
    d.ignoredMappings
  )
    ? d.ignoredMappings
    : [];


// --------------------------------------------------
// Count mapped POGS values
// --------------------------------------------------

function collectionCount(value) {
  if (Array.isArray(value)) {
    return value.length;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return Object.keys(value).length;
  }

  return 0;
}


const mappedTerms =
  collectionCount(
    d.gynecologicalDiagnosis
  )
  +
  collectionCount(
    d.morbidities
  )
  +
  collectionCount(
    d.gynemorbidities
  )
  +
  collectionCount(
    d.medicalHistory
  )
  +
  collectionCount(
    d.obstetricHistory
  )
  +
  collectionCount(
    d.concomitantProcedure
  )
  +
  collectionCount(
    d.obProcedure
  );


const unresolvedTerms =
  unresolvedMappings.length;

const ignoredTerms =
  ignoredMappings.length;

const recognizedTerms =
  mappedTerms +
  unresolvedTerms +
  ignoredTerms;


// --------------------------------------------------
// Form evaluation supplied by pogs-rule-engine
// --------------------------------------------------

const form =
  d.formEvaluation ?? {};

const sourceFieldStates =
  form.fieldStates ?? {};


// Remove actual candidate values from fieldStates.
// Knowledge only needs the state/rule result.
// --------------------------------------------------

const fieldStates = {};

for (
  const [
    field,
    state
  ] of Object.entries(
    sourceFieldStates
  )
) {
  fieldStates[field] = {
    applicable:
      state?.applicable ?? null,

    required:
      state?.required ?? null,

    satisfied:
      state?.satisfied ?? null,

    controlType:
      state?.controlType ?? null
  };
}


const missingRequiredFields =
  Array.isArray(
    form.missingRequiredFields
  )
    ? form.missingRequiredFields
    : [];


const unknownRules =
  Array.isArray(
    form.unknownRules
  )
    ? form.unknownRules
    : [];


// --------------------------------------------------
// Build SANITIZED knowledge record
//
// Do not include:
// patient name
// caseNum
// address
// raw source text
// HPI
// Google Doc
// AI response ID
// --------------------------------------------------

const knowledgeRecord = {

  schemaVersion:
    3,

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

    currentPregnancyDelivered:
      d.isDelivered ?? null
  },


  runContext: {

    mode:
      d.runContext?.mode ??
      "UNKNOWN",

    rawCaseId:
      d.runContext?.rawCaseId ??
      null
  },


  extracted: {

    birthDatePresent:
      Boolean(d.birthDate),

    admissionDatePresent:
      Boolean(d.admissionDate),

    dischargeDatePresent:
      Boolean(d.dischargeDate),

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
      gyneDiagnoses,

    morbidityCount:
      collectionCount(
        d.morbidities
      ),

    gyneComorbidityCount:
      collectionCount(
        d.gynemorbidities
      ),

    medicalHistoryCount:
      collectionCount(
        d.medicalHistory
      ),

    obstetricHistoryCount:
      collectionCount(
        d.obstetricHistory
      ),

    concomitantProcedureCount:
      collectionCount(
        d.concomitantProcedure
      ),

    obProcedureCount:
      collectionCount(
        d.obProcedure
      )
  },


  unresolved:
    unresolvedMappings,


  ignored:
    ignoredMappings,


  mappingCoverage: {

    recognizedTerms,

    mappedTerms,

    unresolvedTerms,

    ignoredTerms
  },


  mappingStatus: {

    mappingComplete:
      unresolvedTerms === 0,

    needsClinicalMappingReview:
      unresolvedTerms > 0
  },


  formEvaluation: {

    mode:
      form.mode ??
      "REPORT_ONLY",

    fieldStates,

    missingRequiredFields,

    unknownRules
  },


  ruleStatus: {

    evaluatedRules:
      Object.keys(
        fieldStates
      ).length,

    unsatisfiedRequiredRules:
      missingRequiredFields,

    unknownRules,

    needsRuleReview:
      (
        missingRequiredFields.length > 0 ||
        unknownRules.length > 0
      )
  },


  aiAssistance: {

    used:
      d.aiAssistance?.used === true,

    model:
      d.aiAssistance?.model ??
      null,

    uncertainFactCount:
      Array.isArray(
        d.aiAssistance
          ?.uncertainFacts
      )
        ? d.aiAssistance
            .uncertainFacts
            .length
        : 0
  },


  validation: {

    readyForPOGS:
      d.validation
        ?.readyForPOGS === true,

    issues:
      d.validation
        ?.issues ?? [],

    warnings:
      d.validation
        ?.warnings ?? [],

    formRulesMode:
      d.validation
        ?.formRulesMode ??
      form.mode ??
      "REPORT_ONLY"
  }
};


// --------------------------------------------------
// IMPORTANT:
//
// candidateForReturn stays inside the workflow,
// but it is NOT what gets written to the knowledge
// file.
//
// This allows the child workflow to eventually
// return the real validated candidate to the parent.
// --------------------------------------------------

return {
  json: {

    candidateForReturn:
      d,

    knowledgeRecord
  }
};`,
    };

    @node({
        id: '8fb22e25-980c-491c-96d2-4aabc3ba4dcd',
        name: 'Knowledge Record to File',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [5168, -1264],
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
        id: '74bb19ec-732c-4696-91fb-1303e35cb306',
        name: 'Regression Summary',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4496, -976],
    })
    RegressionSummary = {
        jsCode: `const items =
  $input.all();


// --------------------------------------------------
// Initialize regression summary
// --------------------------------------------------

const summary = {

  generatedAt:
    new Date().toISOString(),

  totalCases:
    items.length,


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

  totalUnknownRules: 0,


  aiUsedCases: 0,

  aiNotUsedCases: 0,

  casesNeedingClinicalMappingReview: 0,

  casesNeedingRuleReview: 0,


  needsAttention: 0,


  cases: [],


  duplicateKnowledgeIds: []

};


// --------------------------------------------------
// Process each regression result
// --------------------------------------------------

for (
  const item of items
) {

  const data =
    item.json ?? {};


  const regression =
    data.regressionResult ?? {};


  const current =
    data.currentRecord ?? {};


  const metrics =
    regression.currentMetrics ?? {};


  // ------------------------------------------------
  // Regression status
  // ------------------------------------------------

  const status =
    regression.status ??
    "UNKNOWN";


  if (
    Object.prototype
      .hasOwnProperty.call(
        summary.statusCounts,
        status
      )
  ) {

    summary
      .statusCounts[
        status
      ]++;

  } else {

    summary
      .statusCounts
      .UNKNOWN++;

  }


  // ------------------------------------------------
  // Candidate readiness
  // ------------------------------------------------

  const readyForPOGS =
    metrics.readyForPOGS === true;


  if (readyForPOGS) {

    summary
      .readyForPOGS++;

  } else {

    summary
      .notReadyForPOGS++;

  }


  // ------------------------------------------------
  // Numeric regression metrics
  // ------------------------------------------------

  const mappedTerms =
    Number(
      metrics.mapped ?? 0
    );


  const unresolvedTerms =
    Number(
      metrics.unresolved ?? 0
    );


  const validationIssues =
    Number(
      metrics.issues ?? 0
    );


  const warnings =
    Number(
      metrics.warnings ?? 0
    );


  const unsatisfiedRules =
    Number(
      metrics.unsatisfiedRules ?? 0
    );


  const unknownRules =
    Number(
      metrics.unknownRules ?? 0
    );


  summary.totalMappedTerms +=
    mappedTerms;


  summary.totalUnresolvedTerms +=
    unresolvedTerms;


  summary.totalValidationIssues +=
    validationIssues;


  summary.totalWarnings +=
    warnings;


  summary.totalUnsatisfiedRules +=
    unsatisfiedRules;


  summary.totalUnknownRules +=
    unknownRules;


  // ------------------------------------------------
  // AI usage
  // ------------------------------------------------

  const aiUsed =
    current
      .aiAssistance
      ?.used === true;


  if (aiUsed) {

    summary.aiUsedCases++;

  } else {

    summary.aiNotUsedCases++;

  }


  // ------------------------------------------------
  // Mapping-review state
  // ------------------------------------------------

  const needsClinicalMappingReview =
    current
      .mappingStatus
      ?.needsClinicalMappingReview ===
    true;


  if (
    needsClinicalMappingReview
  ) {

    summary
      .casesNeedingClinicalMappingReview++;

  }


  // ------------------------------------------------
  // Rule-review state
  // ------------------------------------------------

  const needsRuleReview =
    current
      .ruleStatus
      ?.needsRuleReview === true;


  if (
    needsRuleReview
  ) {

    summary
      .casesNeedingRuleReview++;

  }


  // ------------------------------------------------
  // Determine whether this case needs attention
  //
  // CHANGED is included because it means something
  // materially changed but the direction was mixed.
  //
  // IMPROVED is not automatically considered a
  // problem unless unresolved issues/rules remain.
  // ------------------------------------------------

  const requiresAttention =

    status === "REGRESSED"

    ||

    status === "CHANGED"

    ||

    unresolvedTerms > 0

    ||

    validationIssues > 0

    ||

    unsatisfiedRules > 0

    ||

    unknownRules > 0

    ||

    needsClinicalMappingReview

    ||

    needsRuleReview;


  if (
    requiresAttention
  ) {

    summary
      .needsAttention++;

  }


  // ------------------------------------------------
  // Safe per-case summary
  //
  // Do not put caseNum, birth date, patient name,
  // address, or raw source text here.
  // ------------------------------------------------

  summary.cases.push({

    knowledgeId:
      data.knowledgeId ??
      current.knowledgeId ??
      null,


    rawCaseId:
      current
        .runContext
        ?.rawCaseId ??
      null,


    mode:
      current
        .runContext
        ?.mode ??
      "UNKNOWN",


    status,


    hadPreviousRecord:
      regression
        .hadPreviousRecord ===
      true,


    readyForPOGS,


    mappedTerms,


    unresolvedTerms,


    validationIssues,


    warnings,


    unsatisfiedRules,


    unknownRules,


    aiUsed,


    aiModel:
      aiUsed
        ? (
            current
              .aiAssistance
              ?.model ??
            null
          )
        : null,


    uncertainFactCount:
      Number(
        current
          .aiAssistance
          ?.uncertainFactCount ??
        0
      ),


    needsClinicalMappingReview,


    needsRuleReview,


    formRulesMode:
      current
        .validation
        ?.formRulesMode ??
      current
        .formEvaluation
        ?.mode ??
      "UNKNOWN",


    changes:
      regression.changes ??
      [],


    needsAttention:
      requiresAttention

  });

}


// --------------------------------------------------
// Stable ordering
//
// This makes latest-regression.json easier to diff
// across executions.
// --------------------------------------------------

summary.cases.sort(
  (a, b) =>
    String(
      a.knowledgeId ?? ""
    )
      .localeCompare(
        String(
          b.knowledgeId ?? ""
      )
    )
);


const knowledgeIdCounts = {};

for (const item of summary.cases) {
  const key = String(item.knowledgeId ?? "");
  knowledgeIdCounts[key] = (knowledgeIdCounts[key] ?? 0) + 1;
}

summary.duplicateKnowledgeIds = Object.entries(knowledgeIdCounts)
  .filter(([, count]) => count > 1)
  .map(([knowledgeId, count]) => ({ knowledgeId, count }));

if (summary.duplicateKnowledgeIds.length > 0) {
  summary.needsAttention += summary.duplicateKnowledgeIds.length;
}


// --------------------------------------------------
// Overall stability
// --------------------------------------------------

summary.allCasesStable =

  summary
    .statusCounts
    .REGRESSED === 0

  &&

  summary
    .statusCounts
    .CHANGED === 0;


// --------------------------------------------------
// Stronger clean-run indicators
// --------------------------------------------------

summary.noValidationIssues =
  summary
    .totalValidationIssues === 0;


summary.noUnresolvedMappings =
  summary
    .totalUnresolvedTerms === 0;


summary.noUnsatisfiedRules =
  summary
    .totalUnsatisfiedRules === 0;


summary.noUnknownRules =
  summary
    .totalUnknownRules === 0;


summary.allCasesReadyForPOGS =

  summary.totalCases > 0

  &&

  summary.readyForPOGS ===
    summary.totalCases;


// --------------------------------------------------
// Form-rule enforcement state
//
// This is useful while the form engine remains
// REPORT_ONLY.
// --------------------------------------------------

const formModes =
  [
    ...new Set(
      summary.cases
        .map(
          item =>
            item.formRulesMode
        )
        .filter(Boolean)
    )
  ];


summary.formRulesModes =
  formModes;


// --------------------------------------------------
// Overall regression state
//
// This is informational. It does not control LIVE
// POGS writing. Candidate Ready? remains the safety
// gate in case-new-processing.
// --------------------------------------------------

if (
  summary.totalCases === 0
) {

  summary.overallStatus =
    "NO_CASES";

} else if (
  summary.duplicateKnowledgeIds.length > 0
) {

  summary.overallStatus =
    "IDENTITY_COLLISION_REVIEW";

} else if (
  summary.statusCounts.REGRESSED > 0
) {

  summary.overallStatus =
    "REGRESSION_DETECTED";

} else if (
  summary.statusCounts.CHANGED > 0
) {

  summary.overallStatus =
    "CHANGES_REQUIRE_REVIEW";

} else if (
  summary.totalValidationIssues > 0 ||
  summary.totalUnresolvedTerms > 0 ||
  summary.totalUnsatisfiedRules > 0 ||
  summary.totalUnknownRules > 0
) {

  summary.overallStatus =
    "ATTENTION_REQUIRED";

} else {

  summary.overallStatus =
    "STABLE";

}


// --------------------------------------------------
// Return exactly one summary item
// --------------------------------------------------

return [
  {
    json:
      summary
  }
];`,
    };

    @node({
        id: '0a2273ca-75f3-4186-8eb6-5cf72913e9ff',
        name: 'Summary to File',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4944, -1072],
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
        id: 'f432ff0d-b551-4d2f-b859-92d229631607',
        name: 'Write Regression Report',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [5168, -1072],
    })
    WriteRegressionReport = {
        operation: 'write',
        fileName: '={{ "/data/logs/" + $json.filename }}',
        dataPropertyName: 'data',
        options: {},
    };

    @node({
        id: '5a4c6e16-93c9-4178-b1e4-8038568999ad',
        name: 'Read Existing Knowledge File',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [3824, -992],
        onError: 'continueErrorOutput',
        alwaysOutputData: false,
    })
    ReadExistingKnowledgeFile = {
        fileSelector: `={{
  "/data/knowledge/cases/" +
  $json.knowledgeRecord.knowledgeId +
  ".json"
}}`,
        options: {},
    };

    @node({
        id: 'e75174e4-d858-4bfc-bbcd-1f41542a6620',
        name: 'Compare Knowledge Record',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4272, -1072],
    })
    CompareKnowledgeRecord = {
        mode: 'runOnceForEachItem',
        jsCode: `const wrapper = $json;

const current =
  wrapper.knowledgeRecord;

const candidateForReturn =
  wrapper.candidateForReturn;


if (!current?.knowledgeId) {
  throw new Error(
    "Current knowledge record is missing knowledgeId"
  );
}


if (!candidateForReturn) {
  throw new Error(
    "Compare Knowledge Record: candidateForReturn is missing"
  );
}


// --------------------------------------------------
// Load previous knowledge record if one exists
// --------------------------------------------------

let previous = null;

const binaryKeys =
  Object.keys(
    $binary ?? {}
  );


if (
  binaryKeys.length > 0
) {

  try {

    const buffer =
      await this.helpers
        .getBinaryDataBuffer(
          $itemIndex,
          binaryKeys[0]
        );

    previous =
      JSON.parse(
        buffer.toString(
          "utf8"
        )
      );

  } catch (error) {

    previous = null;
  }
}


// --------------------------------------------------
// Semantic comparison
//
// Explicitly ignore:
// runContext
// timestamps
// execution metadata
// operational file metadata
// --------------------------------------------------

function comparable(record) {

  if (!record) {
    return null;
  }

  const copy =
    JSON.parse(
      JSON.stringify(
        record
      )
    );


  delete copy.runContext;

  delete copy.timestamp;
  delete copy.executionId;
  delete copy.capturedAt;
  delete copy.lastUpdatedAt;


  delete copy.error;
  delete copy.mimeType;
  delete copy.fileType;
  delete copy.fileName;
  delete copy.fileExtension;
  delete copy.fileSize;
  delete copy.filePath;


  return copy;
}


// --------------------------------------------------
// Regression metrics
// --------------------------------------------------

function metrics(record) {

  return {

    mapped:
      record
        ?.mappingCoverage
        ?.mappedTerms ??
      0,


    unresolved:
      record
        ?.mappingCoverage
        ?.unresolvedTerms ??
      0,


    issues:
      record
        ?.validation
        ?.issues
        ?.length ??
      0,


    warnings:
      record
        ?.validation
        ?.warnings
        ?.length ??
      0,


    unsatisfiedRules:
      record
        ?.ruleStatus
        ?.unsatisfiedRequiredRules
        ?.length ??
      0,


    unknownRules:
      record
        ?.ruleStatus
        ?.unknownRules
        ?.length ??
      0,


    readyForPOGS:
      record
        ?.validation
        ?.readyForPOGS ===
      true

  };
}


const currentMetrics =
  metrics(current);


const previousMetrics =
  previous
    ? metrics(previous)
    : null;


// --------------------------------------------------
// Determine semantic status
// --------------------------------------------------

let status =
  "NEW";


if (previous) {

  const previousComparable =
    comparable(previous);

  const currentComparable =
    comparable(current);


  const same =
    JSON.stringify(
      previousComparable
    )
    ===
    JSON.stringify(
      currentComparable
    );


  if (same) {

    status =
      "UNCHANGED";

  } else {

    let improvementScore = 0;
    let regressionScore = 0;


    if (
      currentMetrics.unresolved <
      previousMetrics.unresolved
    ) {
      improvementScore++;
    }

    if (
      currentMetrics.unresolved >
      previousMetrics.unresolved
    ) {
      regressionScore++;
    }


    if (
      currentMetrics.mapped >
      previousMetrics.mapped
    ) {
      improvementScore++;
    }

    if (
      currentMetrics.mapped <
      previousMetrics.mapped
    ) {
      regressionScore++;
    }


    if (
      currentMetrics.issues <
      previousMetrics.issues
    ) {
      improvementScore++;
    }

    if (
      currentMetrics.issues >
      previousMetrics.issues
    ) {
      regressionScore++;
    }


    if (
      currentMetrics.unsatisfiedRules <
      previousMetrics.unsatisfiedRules
    ) {
      improvementScore++;
    }

    if (
      currentMetrics.unsatisfiedRules >
      previousMetrics.unsatisfiedRules
    ) {
      regressionScore++;
    }


    if (
      currentMetrics.unknownRules <
      previousMetrics.unknownRules
    ) {
      improvementScore++;
    }

    if (
      currentMetrics.unknownRules >
      previousMetrics.unknownRules
    ) {
      regressionScore++;
    }


    if (
      currentMetrics.readyForPOGS ===
        true &&
      previousMetrics.readyForPOGS ===
        false
    ) {
      improvementScore++;
    }


    if (
      currentMetrics.readyForPOGS ===
        false &&
      previousMetrics.readyForPOGS ===
        true
    ) {
      regressionScore++;
    }


    if (
      improvementScore > 0 &&
      regressionScore === 0
    ) {

      status =
        "IMPROVED";

    } else if (
      regressionScore > 0 &&
      improvementScore === 0
    ) {

      status =
        "REGRESSED";

    } else {

      status =
        "CHANGED";
    }
  }
}


// --------------------------------------------------
// Metric changes
// --------------------------------------------------

const changes = [];


if (previousMetrics) {

  for (
    const field of
    Object.keys(
      currentMetrics
    )
  ) {

    const before =
      previousMetrics[field];

    const after =
      currentMetrics[field];


    if (
      JSON.stringify(before) !==
      JSON.stringify(after)
    ) {

      changes.push({
        field,
        before,
        after
      });
    }
  }
}


return {
  json: {

    knowledgeId:
      current.knowledgeId,


    regressionResult: {

      status,

      hadPreviousRecord:
        Boolean(previous),

      previousMetrics,

      currentMetrics,

      changes
    },


    currentRecord:
      current,


    candidateForReturn
  }
};`,
    };

    @node({
        id: '5a78e593-8388-457d-86e3-c97b6a958375',
        name: 'Write Knowledge File',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [5392, -1264],
    })
    WriteKnowledgeFile = {
        operation: 'write',
        fileName: '={{ "/data/knowledge/cases/" + $json.fileName }}',
        dataPropertyName: 'data',
        options: {},
    };

    @node({
        id: '69bd3eea-aedc-4fdf-91bc-8306db26173b',
        name: 'Merge',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [4048, -1072],
    })
    Merge = {
        mode: 'combine',
        combineBy: 'combineByPosition',
        options: {},
    };

    @node({
        id: '1b8f6fe7-014f-4a76-8515-35101978fedf',
        name: 'Build Regression Evidence Bundle',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4720, -880],
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

delete cleanRecord.error;
delete cleanRecord.mimeType;
delete cleanRecord.fileType;
delete cleanRecord.fileName;
delete cleanRecord.fileExtension;
delete cleanRecord.fileSize;
delete cleanRecord.filePath;

knowledge.push(cleanRecord);
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
        id: 'd98b2054-6f07-4dce-b609-6d8340b37a8c',
        name: 'Regression Evidence Bundle to File',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [4944, -880],
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
        id: '360b4af1-38cd-415e-b720-fefbdb1f95be',
        name: 'Write Regression Evidence Bundle',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [5168, -880],
    })
    WriteRegressionEvidenceBundle = {
        operation: 'write',
        fileName: '={{ "/data/logs/regression_runs/" + $json.fileName }}',
        dataPropertyName: 'data',
        options: {},
    };

    @node({
        id: '1d1bb88f-ea84-47b9-a7ca-443a8ab13c9c',
        name: 'When Executed by Another Workflow',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.2,
        position: [3376, -1072],
    })
    WhenExecutedByAnotherWorkflow = {
        inputSource: 'passthrough',
    };

    @node({
        id: 'f05969f5-5a65-450e-838f-db537db66230',
        name: 'Merge Regression Outputs',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [5392, -976],
    })
    MergeRegressionOutputs = {
        mode: 'combine',
        combineBy: 'combineByPosition',
        options: {},
    };

    @node({
        id: '9da9fbbc-36b7-4425-a93e-2390d9783b6d',
        name: 'Merge Knowledge Outputs',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [5616, -1072],
    })
    MergeKnowledgeOutputs = {
        mode: 'combine',
        combineBy: 'combineByPosition',
        options: {},
    };

    @node({
        id: '09dcd048-59b3-473d-b6da-d85cb5185aa9',
        name: 'Return Candidate',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [5840, -1072],
    })
    ReturnCandidate = {
        jsCode: `const compareItems =
  $items(
    "Compare Knowledge Record"
  );


if (
  compareItems.length === 0
) {
  throw new Error(
    "Return Candidate: no Compare Knowledge Record output found"
  );
}


const output = [];


for (
  let i = 0;
  i < compareItems.length;
  i++
) {

  const candidate =
    compareItems[i]
      .json
      .candidateForReturn;


  if (!candidate) {
    throw new Error(
      \`Return Candidate: item \${i} has no candidateForReturn\`
    );
  }


  output.push({
    json: candidate,

    pairedItem: {
      item: i
    }
  });
}


return output;`,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.BuildKnowledgeRecord.out(0).to(this.ReadExistingKnowledgeFile.in(0));
        this.BuildKnowledgeRecord.out(0).to(this.Merge.in(0));
        this.KnowledgeRecordToFile.out(0).to(this.WriteKnowledgeFile.in(0));
        this.RegressionSummary.out(0).to(this.BuildRegressionEvidenceBundle.in(0));
        this.RegressionSummary.out(0).to(this.SummaryToFile.in(0));
        this.SummaryToFile.out(0).to(this.WriteRegressionReport.in(0));
        this.ReadExistingKnowledgeFile.out(0).to(this.Merge.in(1));
        this.CompareKnowledgeRecord.out(0).to(this.KnowledgeRecordToFile.in(0));
        this.CompareKnowledgeRecord.out(0).to(this.RegressionSummary.in(0));
        this.Merge.out(0).to(this.CompareKnowledgeRecord.in(0));
        this.BuildRegressionEvidenceBundle.out(0).to(this.RegressionEvidenceBundleToFile.in(0));
        this.RegressionEvidenceBundleToFile.out(0).to(this.WriteRegressionEvidenceBundle.in(0));
        this.WhenExecutedByAnotherWorkflow.out(0).to(this.BuildKnowledgeRecord.in(0));
        this.WriteRegressionReport.out(0).to(this.MergeRegressionOutputs.in(0));
        this.WriteRegressionEvidenceBundle.out(0).to(this.MergeRegressionOutputs.in(1));
        this.WriteKnowledgeFile.out(0).to(this.MergeKnowledgeOutputs.in(0));
        this.MergeRegressionOutputs.out(0).to(this.MergeKnowledgeOutputs.in(1));
        this.MergeKnowledgeOutputs.out(0).to(this.ReturnCandidate.in(0));
    }
}
