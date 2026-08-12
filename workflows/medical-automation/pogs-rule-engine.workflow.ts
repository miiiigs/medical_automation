import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : pogs-rule-engine
// Nodes   : 15  |  Connections: 14
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// WhenExecutedByAnotherWorkflow      executeWorkflowTrigger
// LoadSemanticLayer                  code
// ReadSemanticLayerFile              readWriteFile
// ParseSemanticLayer                 code
// LoadPogsReferenceValues            code
// ReadPogsReferenceValues            readWriteFile
// ParsePogsReferenceValues           code
// LoadPogsFormRules                  code
// ReadPogsFormRulesFile              readWriteFile
// ParsePogsFormRuels                 code
// ApplySemanticMapping               code
// MapPogsReferences                  code
// BuildPogsCandidate                 code
// ApplyPogsFormRules                 code
// ValidatePogsCandidate              code
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WhenExecutedByAnotherWorkflow
//    → LoadSemanticLayer
//      → ReadSemanticLayerFile
//        → ParseSemanticLayer
//          → LoadPogsReferenceValues
//            → ReadPogsReferenceValues
//              → ParsePogsReferenceValues
//                → LoadPogsFormRules
//                  → ReadPogsFormRulesFile
//                    → ParsePogsFormRuels
//                      → ApplySemanticMapping
//                        → MapPogsReferences
//                          → BuildPogsCandidate
//                            → ApplyPogsFormRules
//                              → ValidatePogsCandidate
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'p579PotbV56XZXzp',
    name: 'pogs-rule-engine',
    active: false,
    isArchived: false,
    settings: { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: false },
})
export class PogsRuleEngineWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'a0f0a649-ccc7-44a1-bd82-4d3ea65dbba7',
        name: 'When Executed by Another Workflow',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.2,
        position: [0, -16],
    })
    WhenExecutedByAnotherWorkflow = {
        inputSource: 'jsonExample',
        jsonExample: `{
 "clinicalFacts":{},
 "diagnoses":[],
 "classification":{}
}`,
    };

    @node({
        id: 'da10eeb1-0cea-4c93-93ca-5baf3e8cd879',
        name: 'Load Semantic Layer',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [224, -16],
    })
    LoadSemanticLayer = {
        mode: 'runOnceForEachItem',
        jsCode: `const caseData = $json;

if (!caseData.runContext?.rawCaseId) {
  throw new Error(
    "pogs-rule-engine: incoming case has no rawCaseId"
  );
}

return {
  json: {
    caseData: caseData,

    configPaths: {
      semanticLayer:
        "/data/knowledge/clinical-automation-semantic-layer-v1.3.0.json",

      pogsReferences:
        "/data/knowledge/pogs-reference-values.json",

      pogsFormRules:
        "/data/knowledge/pogs-form-rules.json"
    }
  }
};`,
    };

    @node({
        id: 'd9f7ba3f-d3c3-4597-be73-8615159b2395',
        name: 'Read Semantic Layer File',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [448, -16],
    })
    ReadSemanticLayerFile = {
        fileSelector: '={{ $json.configPaths.semanticLayer }}',
        options: {},
    };

    @node({
        id: '673b1b24-b399-4dc2-bd00-14a2960fb57a',
        name: 'Parse Semantic Layer',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [672, -16],
    })
    ParseSemanticLayer = {
        mode: 'runOnceForEachItem',
        jsCode: `const binaryKeys =
  Object.keys($binary ?? {});

if (binaryKeys.length === 0) {
  throw new Error(
    "Semantic layer file returned no binary data"
  );
}

const binaryProperty =
  binaryKeys[0];

const buffer =
  await this.helpers.getBinaryDataBuffer(
    $itemIndex,
    binaryProperty
  );

let semanticLayer;

try {
  semanticLayer =
    JSON.parse(
      buffer.toString("utf8")
    );
} catch (error) {
  throw new Error(
    \`Invalid semantic layer JSON: \${error.message}\`
  );
}

/*
The Read File node may not preserve every
previous JSON field in every n8n configuration.

Retrieve the original preserved data from
the named earlier node.
*/
const prepared =
  $("Load Semantic Layer")
    .item
    .json;

return {
  json: {
    caseData:
      prepared.caseData,

    configPaths:
      prepared.configPaths,

    semanticLayer
  }
};`,
    };

    @node({
        id: '47c8652b-8757-4aed-85ac-81842fd55259',
        name: 'Load POGS Reference Values',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [896, -16],
    })
    LoadPogsReferenceValues = {
        mode: 'runOnceForEachItem',
        jsCode: `return {
  json: {
    ...$json,

    readPath:
      $json.configPaths
        .pogsReferences
  }
};`,
    };

    @node({
        id: 'ddaee6f4-8db3-4d9c-8e62-e7bfe5794eba',
        name: 'Read POGS Reference Values',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [1120, -16],
    })
    ReadPogsReferenceValues = {
        fileSelector: '={{ $json.readPath }}',
        options: {},
    };

    @node({
        id: '71cfcbab-4c16-4e32-974f-55b0bbd7b00a',
        name: 'Parse POGS Reference Values',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1344, -16],
    })
    ParsePogsReferenceValues = {
        mode: 'runOnceForEachItem',
        jsCode: `const binaryKeys =
  Object.keys($binary ?? {});

if (binaryKeys.length === 0) {
  throw new Error(
    "POGS reference file returned no binary data"
  );
}

const buffer =
  await this.helpers.getBinaryDataBuffer(
    $itemIndex,
    binaryKeys[0]
  );

let pogsReferences;

try {
  pogsReferences =
    JSON.parse(
      buffer.toString("utf8")
    );
} catch (error) {
  throw new Error(
    \`Invalid POGS reference JSON: \${error.message}\`
  );
}

const previous =
  $("Load POGS Reference Values")
    .item
    .json;

return {
  json: {
    caseData:
      previous.caseData,

    configPaths:
      previous.configPaths,

    semanticLayer:
      previous.semanticLayer,

    pogsReferences
  }
};`,
    };

    @node({
        id: 'e4b6d7a9-5408-4404-aeb8-f78574ce17df',
        name: 'Load POGS Form Rules',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1568, -16],
    })
    LoadPogsFormRules = {
        mode: 'runOnceForEachItem',
        jsCode: `return {
  json: {
    ...$json,

    readPath:
      $json.configPaths
        .pogsFormRules
  }
};`,
    };

    @node({
        id: '217478ea-eeb0-4caf-90e0-60977280beb5',
        name: 'Read POGS Form Rules File',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [1792, -16],
    })
    ReadPogsFormRulesFile = {
        fileSelector: '={{ $json.readPath }}',
        options: {},
    };

    @node({
        id: '7ba2f21f-29e1-4ad6-85b9-cee3347da709',
        name: 'Parse POGS Form Ruels',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2016, -16],
    })
    ParsePogsFormRuels = {
        jsCode: `const binaryKeys =
  Object.keys($binary ?? {});

if (binaryKeys.length === 0) {
  throw new Error(
    "POGS form-rules file returned no binary data"
  );
}

const buffer =
  await this.helpers.getBinaryDataBuffer(
    $itemIndex,
    binaryKeys[0]
  );

let pogsFormRules;

try {
  pogsFormRules =
    JSON.parse(
      buffer.toString("utf8")
    );
} catch (error) {
  throw new Error(
    \`Invalid POGS form-rules JSON: \${error.message}\`
  );
}

const previous =
  $("Load POGS Form Rules")
    .item
    .json;

return {
  json: {
    caseData:
      previous.caseData,

    semanticLayer:
      previous.semanticLayer,

    pogsReferences:
      previous.pogsReferences,

    pogsFormRules: pogsFormRules,

    engineMeta: {
      formRulesMode:
        "REPORT_ONLY"
    }
  }
};`,
    };

    @node({
        id: 'ab3aa567-8054-4597-9988-1576260d6e06',
        name: 'Apply Semantic Mapping',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2240, -16],
    })
    ApplySemanticMapping = {
        mode: 'runOnceForEachItem',
        jsCode: `const caseData = $json.caseData;
const semanticLayer = $json.semanticLayer;
const pogsReferences = $json.pogsReferences;
const pogsFormRules = $json.pogsFormRules;
const engineMeta = $json.engineMeta;


function textOf(item) {

  if (
    typeof item === "string"
  ) {
    return item.trim();
  }

  return String(
    item?.term ??
    item?.sourceLabel ??
    ""
  ).trim();
}


function isNegated(item) {

  if (
    typeof item !== "object" ||
    item === null
  ) {
    return false;
  }

  return (
    item.negated === true
  );
}


const deterministicDiagnoses =
  caseData.diagnosisTerms ??
  caseData.extractedDiagnosisTerms ??
  [];


const aiDiagnoses =
  caseData.clinicalConcepts
    ?.aiDiagnosisTerms ??
  [];


const aiComorbidities =
  caseData.clinicalConcepts
    ?.aiComorbidityTerms ??
  [];


const aiProcedures =
  caseData.clinicalConcepts
    ?.aiProcedureTerms ??
  [];


const diagnosisConcepts = [];

for (
  const item of [
    ...deterministicDiagnoses,
    ...aiDiagnoses
  ]
) {

  const text =
    textOf(item);

  if (
    !text ||
    isNegated(item)
  ) {
    continue;
  }

  diagnosisConcepts.push({
    sourceText:
      text,

    normalizedText:
      text
        .toLowerCase()
        .replace(/\\s+/g, " ")
        .trim(),

    source:
      aiDiagnoses.includes(item)
        ? "AI"
        : "DETERMINISTIC"
  });
}


const comorbidityConcepts =
  aiComorbidities
    .filter(
      item =>
        !isNegated(item)
    )
    .map(
      item => ({
        sourceText:
          textOf(item),

        normalizedText:
          textOf(item)
            .toLowerCase()
            .replace(/\\s+/g, " ")
            .trim(),

        source:
          "AI"
      })
    );


const procedureConcepts =
  aiProcedures
    .map(
      item => ({
        sourceText:
          textOf(item),

        normalizedText:
          textOf(item)
            .toLowerCase()
            .replace(/\\s+/g, " ")
            .trim(),

        source:
          "AI"
      })
    );


return {
  json: {
    caseData: caseData,

    semanticLayer: semanticLayer,
    pogsReferences: pogsReferences,
    pogsFormRules: pogsFormRules,

    engineMeta: engineMeta,

    clinicalConceptsNormalized: {
      diagnoses:
        diagnosisConcepts,

      comorbidities:
        comorbidityConcepts,

      procedures:
        procedureConcepts,

      pregnancyTypeText:
        caseData.clinicalConcepts
          ?.pregnancyTypeText ??
        null,

      deliveryMannerText:
        caseData.clinicalConcepts
          ?.deliveryMannerText ??
        null
    }
  }
};`,
    };

    @node({
        id: '31708adc-fdcb-4fc7-96bd-65f5011c81d4',
        name: 'Map POGS References',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2464, -16],
    })
    MapPogsReferences = {
        jsCode: `const d = $json;

const concepts =
  d.clinicalConceptsNormalized;

const mapped = {
  gynecologicalDiagnosis: [],
  morbidities: {},
  gynemorbidities: {},
  medicalHistory: {},
  obstetricHistory: {},
  concomitantProcedure: {},
  obProcedure: {}
};

const unresolved = [];

const ignored = [];


function normalize(
  value
) {
  return String(
    value ?? ""
  )
    .toLowerCase()
    .replace(/\\s+/g, " ")
    .trim();
}


/*
CONFIRMED POGS MAPPING

Prolapsed/submucous myoma:
category 12
condition 114
gyneStage 6
*/

for (
  const concept of
  concepts.diagnoses ?? []
) {

  const term =
    normalize(
      concept.normalizedText
    );


  const isSubmucousMyoma =
    (
      term.includes(
        "submucous myoma"
      ) ||
      term.includes(
        "submucosal myoma"
      )
    );


  if (
    isSubmucousMyoma
  ) {

    mapped
      .gynecologicalDiagnosis
      .push({
        categoryId:
          12,

        conditionId:
          114,

        gyneStage:
          6,

        others:
          null,

        othersField:
          null
      });

    continue;
  }


  /*
  Terms that we recognize clinically
  but do NOT yet have exact POGS
  diagnosis mapping for.
  */

  if (
    term ===
      "abnormal uterine bleeding" ||
    term.includes(
      "endometrial thickening"
    )
  ) {

    unresolved.push({
      type:
        "diagnosis",

      term:
        concept.sourceText,

      reason:
        "Clinical concept recognized but exact POGS mapping is not confirmed"
    });

    continue;
  }


  /*
  These are not gynecologicalDiagnosis
  entries by themselves.
  */

  if (
    term === "anemia" ||
    term.includes(
      "acute blood loss"
    ) ||
    term.includes(
      "obesity"
    )
  ) {

    ignored.push({
      type:
        "diagnosis",

      term:
        concept.sourceText,

      reason:
        "Not mapped as a POGS gynecologicalDiagnosis"
    });

    continue;
  }


  unresolved.push({
    type:
      "diagnosis",

    term:
      concept.sourceText,

    reason:
      "No deterministic POGS mapping exists"
  });
}


return {
  json: {
    ...d,

    pogsMapping: {
      mapped: mapped,
      unresolved: unresolved,
      ignored: ignored
    }
  }
};`,
    };

    @node({
        id: '01719440-47c8-4633-8d1e-b18b4c9add5d',
        name: 'Build POGS Candidate',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2688, -16],
    })
    BuildPogsCandidate = {
        mode: 'runOnceForEachItem',
        jsCode: `const source =
  $json.caseData;

const mapped =
  $json.pogsMapping
    ?.mapped ?? {};


function toISODate(
  value
) {

  if (!value) {
    return null;
  }

  const stringValue =
    String(value);

  // Already YYYY-MM-DD
  if (
    /^\\d{4}-\\d{2}-\\d{2}$/
      .test(stringValue)
  ) {
    return stringValue;
  }

  // MM/DD/YYYY
  const match =
    stringValue.match(
      /^(\\d{2})\\/(\\d{2})\\/(\\d{4})$/
    );

  if (!match) {
    return null;
  }

  return (
    \`\${match[3]}-\` +
    \`\${match[1]}-\` +
    \`\${match[2]}\`
  );
}


const candidate = {

  runContext:
    source.runContext ?? {
      mode:
        "UNKNOWN",

      rawCaseId:
        null
    },


  caseNum:
    source.patient
      ?.hospitalNumber ??
    source.caseNum ??
    null,


  birthDate:
    toISODate(
      source.patient
        ?.birthDate ??
      source.birthDate
    ),


  admissionDate:
    toISODate(
      source.admission
        ?.date ??
      source.admissionDate
    ),


  dischargeDate:
    toISODate(
      source.admission
        ?.dischargeDate ??
      source.dischargeDate
    ),


  room:
    source.room ??
    null,


  age:
    source.patient
      ?.age ??
    source.age ??
    null,


  weight:
    source.measurements
      ?.weightKg ??
    source.weight ??
    null,


  height:
    source.measurements
      ?.heightCm ??
    source.height ??
    null,


  bmi:
    source.bmi ??
    (
      (() => {
        const weightValue =
          source.measurements
            ?.weightKg ??
          source.weight ??
          null;

        const heightValue =
          source.measurements
            ?.heightCm ??
          source.height ??
          null;

        if (
          weightValue == null ||
          heightValue == null
        ) {
          return null;
        }

        const heightMeters =
          Number(heightValue) / 100;

        const weightKg =
          Number(weightValue);

        if (
          !heightMeters ||
          !weightKg ||
          heightMeters <= 0 ||
          weightKg <= 0
        ) {
          return null;
        }

        return Number(
          (
            weightKg /
            (heightMeters * heightMeters)
          ).toFixed(2)
        );
      })()
    ),


  isPregnancy:
    source.classification
      ?.isPregnancy ??
    source.isPregnancy ??
    null,


  isGyne:
    source.classification
      ?.isGyne ??
    source.isGyne ??
    null,


  isPostpartum:
    source.classification
      ?.isPostpartum ??
    source.isPostpartum ??
    null,


  isDelivered:
    source.deliveryState
      ?.currentPregnancyDelivered ??
    null,


  obscoreG:
    source.obstetric
      ?.gravida ??
    source.obscoreG ??
    null,


  obscoreP:
    source.obstetric
      ?.para ??
    source.obscoreP ??
    null,


  obscoreFT:
    source.obstetric
      ?.fullTerm ??
    source.obscoreFT ??
    null,


  obscorePr:
    source.obstetric
      ?.preterm ??
    source.obscorePr ??
    null,


  obscoreAb:
    source.obstetric
      ?.abortion ??
    source.obscoreAb ??
    null,


  obscoreLB:
    source.obstetric
      ?.living ??
    source.obscoreLB ??
    null,


  admissionAOGType:
    source.admissionAOGType ??
    null,


  admissionAOG:
    source.admissionAOG ??
    null,


  admissionWeeks:
    source.admissionWeeks ??
    null,


  admissionDays:
    source.admissionDays ??
    null,


  pregnancyType:
    source.pregnancyType ??
    null,


  isHeterotopic:
    source.isHeterotopic ??
    null,


  abortionType:
    source.abortionType ??
    null,


  ectopicType:
    source.ectopicType ??
    null,


  molarType:
    source.molarType ??
    null,


  institutionalDelivery:
    source.institutionalDelivery ??
    null,


  infantsNumber:
    source.infantsNumber ??
    null,


  deliveryDate:
    toISODate(
      source.deliveryDate
    ),


  deliveryAOGType:
    source.deliveryAOGType ??
    null,


  deliveryAOG:
    source.deliveryAOG ??
    null,


  deliveryWeeks:
    source.deliveryWeeks ??
    null,


  deliveryDays:
    source.deliveryDays ??
    null,


  deliveryManner:
    source.deliveryManner ??
    null,


  primaryRepeat:
    source.primaryRepeat ??
    null,


  incision:
    source.incision ??
    null,


  CSBilateralSalpingectomy:
    source.CSBilateralSalpingectomy ??
    null,


  CSBTL:
    source.CSBTL ??
    null,


  deliveryIndication:
    source.deliveryIndication ??
    {},


  morbidities:
    mapped.morbidities ??
    {},


  neonatal:
    source.neonatal ??
    [],


  complicatedPregnancy:
    source.complicatedPregnancy ??
    null,


  isInduced:
    source.isInduced ??
    null,


  inducedIndication:
    source.inducedIndication ??
    null,


  inducedMethod:
    source.inducedMethod ??
    null,


  inducedComplication:
    source.inducedComplication ??
    null,


  returnToOR:
    source.returnToOR ??
    null,


  pcosHistory:
    source.pcosHistory ??
    null,


  pcosSymptoms:
    source.pcosSymptoms ??
    null,


  gynecologicalDiagnosis:
    mapped
      .gynecologicalDiagnosis ??
    [],


  gynemorbidities:
    mapped.gynemorbidities ??
    {},


  medicalHistory:
    mapped.medicalHistory ??
    {},


  obstetricHistory:
    mapped.obstetricHistory ??
    {},


  concomitantProcedure:
    mapped
      .concomitantProcedure ??
    {},


  obProcedure:
    mapped.obProcedure ??
    {},


  motherCondition:
    source.motherCondition ??
    null,


  antecedentType:
    source.antecedentType ??
    null,


  antecedentCause:
    source.antecedentCause ??
    null,


  deathTiming:
    source.deathTiming ??
    null,


  deathReviewed:
    source.deathReviewed ??
    null
};


return {
  json: {
    ...$json,

    candidate
  }
};`,
    };

    @node({
        id: '35001c6a-6f7b-44f2-a6c3-afad8cd930b2',
        name: 'Apply POGS Form Rules',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2912, -16],
    })
    ApplyPogsFormRules = {
        jsCode: `const candidate =
  $json.candidate;

const artifact =
  $json.pogsFormRules;

const fields =
  artifact?.fields ?? {};


function valuePresent(
  value,
  constraints = {}
) {

  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }

  if (
    typeof value === "string"
  ) {
    return (
      value.trim().length > 0
    );
  }

  if (
    Array.isArray(value)
  ) {

    const minimum =
      constraints.minItems ??
      constraints.minLength ??
      0;

    return (
      value.length >= minimum
    );
  }

  if (
    typeof value === "object"
  ) {

    const minimum =
      constraints.minItems ??
      constraints.minLength ??
      0;

    if (minimum > 0) {
      return (
        Object.keys(value)
          .length >= minimum
      );
    }

    return true;
  }

  // false and 0 are valid entered values.
  return true;
}


function evaluate(
  rule
) {

  if (!rule) {
    return true;
  }


  if (
    Array.isArray(rule.all)
  ) {

    return rule.all.every(
      evaluate
    );
  }


  if (
    Array.isArray(rule.any)
  ) {

    return rule.any.some(
      evaluate
    );
  }


  if (rule.eq) {

    const [
      field,
      expected
    ] =
      Object.entries(
        rule.eq
      )[0];

    return (
      candidate[field] ===
      expected
    );
  }


  if (rule.neq) {

    const [
      field,
      expected
    ] =
      Object.entries(
        rule.neq
      )[0];

    return (
      candidate[field] !==
      expected
    );
  }


  if (rule.in) {

    const [
      field,
      accepted
    ] =
      Object.entries(
        rule.in
      )[0];

    return (
      Array.isArray(accepted) &&
      accepted.includes(
        candidate[field]
      )
    );
  }


  if (rule.notIn) {

    const [
      field,
      rejected
    ] =
      Object.entries(
        rule.notIn
      )[0];

    return (
      Array.isArray(rejected) &&
      !rejected.includes(
        candidate[field]
      )
    );
  }


  if (rule.isNull) {

    return (
      candidate[
        rule.isNull
      ] == null
    );
  }


  if (rule.notNull) {

    return (
      candidate[
        rule.notNull
      ] != null
    );
  }


  if (rule.truthy) {

    return Boolean(
      candidate[
        rule.truthy
      ]
    );
  }


  if (rule.falsy) {

    return !Boolean(
      candidate[
        rule.falsy
      ]
    );
  }


  /*
  Unknown rule format.
  Do NOT silently return true.
  */

  return null;
}


const fieldStates = {};

const unknownRules = [];


for (
  const [
    fieldName,
    definition
  ] of Object.entries(
    fields
  )
) {

  let applicable =
    true;


  if (
    definition.applicableWhen
  ) {

    const result =
      evaluate(
        definition
          .applicableWhen
      );

    if (result === null) {

      applicable =
        null;

      unknownRules.push({
        field:
          fieldName,

        type:
          "applicableWhen",

        rule:
          definition
            .applicableWhen
      });

    } else {

      applicable =
        result;
    }
  }


  let required =
    definition
      .closeCaseRequired ===
    true;


  if (
    definition.requiredWhen
  ) {

    const result =
      evaluate(
        definition
          .requiredWhen
      );

    if (result === null) {

      required =
        null;

      unknownRules.push({
        field:
          fieldName,

        type:
          "requiredWhen",

        rule:
          definition
            .requiredWhen
      });

    } else {

      required =
        result;
    }
  }


  const value =
    candidate[
      fieldName
    ];


  const satisfied =
    required === true
      ? valuePresent(
          value,
          definition
        )
      : true;


  fieldStates[
    fieldName
  ] = {

    applicable,

    required,

    satisfied,

    value:
      value ?? null,

    controlType:
      definition
        .controlType ??
      null
  };
}


const missingRequiredFields =
  Object.entries(
    fieldStates
  )
    .filter(
      ([, state]) =>
        state.applicable === true &&
        state.required === true &&
        state.satisfied !== true
    )
    .map(
      ([field]) =>
        field
    );


return {
  json: {
    ...$json,

    candidate: {
      ...candidate,

      formEvaluation: {
        mode:
          $json.engineMeta
            ?.formRulesMode ??
          "ENFORCED",

        fieldStates: fieldStates,

        missingRequiredFields: missingRequiredFields,

        unknownRules: unknownRules
      }
    }
  }
};`,
    };

    @node({
        id: 'ea61ce8d-987b-4b98-acf1-b62bd3f5d37f',
        name: 'Validate POGS Candidate',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3136, -16],
    })
    ValidatePogsCandidate = {
        mode: 'runOnceForEachItem',
        jsCode: `const c =
  $json.candidate;

const issues = [];
const warnings = [];


/*
Core identity requirements
*/

if (!c.caseNum) {
  issues.push(
    "Missing caseNum"
  );
}

if (!c.birthDate) {
  issues.push(
    "Missing birthDate"
  );
}

if (!c.admissionDate) {
  issues.push(
    "Missing admissionDate"
  );
}


/*
Case classification
*/

if (
  c.isPregnancy === null ||
  c.isPregnancy === undefined
) {
  issues.push(
    "isPregnancy not classified"
  );
}

if (
  c.isGyne === null ||
  c.isGyne === undefined
) {
  issues.push(
    "isGyne not classified"
  );
}


/*
Delivery-state safety
*/

if (
  c.isPregnancy === true &&
  (
    c.isDelivered === null ||
    c.isDelivered === undefined
  )
) {

  issues.push(
    "Current pregnancy delivery status not established"
  );
}


/*
Gyne mapping
*/

if (
  c.isGyne === true &&
  (
    !Array.isArray(
      c.gynecologicalDiagnosis
    ) ||
    c.gynecologicalDiagnosis
      .length === 0
  )
) {

  issues.push(
    "Gyne case has no confirmed POGS gynecologicalDiagnosis mapping"
  );
}


/*
Unresolved mappings
*/

for (
  const unresolved of
  $json.pogsMapping
    ?.unresolved ?? []
) {

  warnings.push(
    \`Unresolved clinical mapping: \${
      unresolved.term ??
      "unknown"
    }\`
  );
}


/*
Form evaluation

When formRulesMode is REPORT_ONLY,
missing required POGS fields and
unknown rules become warnings.
*/

const form =
  c.formEvaluation ?? {};

for (
  const field of
  form.missingRequiredFields ??
  []
) {

  const message =
    "POGS form rule requires: " +
    field;

  if (
    (form.mode ?? "REPORT_ONLY") ===
    "ENFORCED"
  ) {
    issues.push(message);
  } else {
    warnings.push(message);
  }
}


for (
  const rule of
  form.unknownRules ??
  []
) {

  const message =
    "POGS form rule could not be evaluated: " +
    rule.field;

  if (
    (form.mode ?? "REPORT_ONLY") ===
    "ENFORCED"
  ) {
    issues.push(message);
  } else {
    warnings.push(message);
  }
}


/*
Reference sanity for confirmed
gynecologicalDiagnosis structures.
*/

for (
  const diagnosis of
  c.gynecologicalDiagnosis ??
  []
) {

  if (
    !Number.isInteger(
      diagnosis.categoryId
    ) ||
    !Number.isInteger(
      diagnosis.conditionId
    )
  ) {

    issues.push(
      "Invalid gynecologicalDiagnosis reference structure"
    );
  }
}


/*
Final state
*/

const readyForPOGS =
  issues.length === 0;


return {
  json: {
    ...c,

    unresolvedMappings:
      $json.pogsMapping
        ?.unresolved ??
      [],

    ignoredMappings:
      $json.pogsMapping
        ?.ignored ??
      [],

    validation: {

      readyForPOGS: readyForPOGS,

      needsReview:
        !readyForPOGS,

      issues: issues,

      warnings: warnings,

      formRulesMode:
        form.mode ??
        "REPORT_ONLY"
    }
  }
};`,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.WhenExecutedByAnotherWorkflow.out(0).to(this.LoadSemanticLayer.in(0));
        this.LoadSemanticLayer.out(0).to(this.ReadSemanticLayerFile.in(0));
        this.ReadSemanticLayerFile.out(0).to(this.ParseSemanticLayer.in(0));
        this.ParseSemanticLayer.out(0).to(this.LoadPogsReferenceValues.in(0));
        this.LoadPogsReferenceValues.out(0).to(this.ReadPogsReferenceValues.in(0));
        this.ReadPogsReferenceValues.out(0).to(this.ParsePogsReferenceValues.in(0));
        this.ParsePogsReferenceValues.out(0).to(this.LoadPogsFormRules.in(0));
        this.LoadPogsFormRules.out(0).to(this.ReadPogsFormRulesFile.in(0));
        this.ReadPogsFormRulesFile.out(0).to(this.ParsePogsFormRuels.in(0));
        this.ParsePogsFormRuels.out(0).to(this.ApplySemanticMapping.in(0));
        this.ApplySemanticMapping.out(0).to(this.MapPogsReferences.in(0));
        this.MapPogsReferences.out(0).to(this.BuildPogsCandidate.in(0));
        this.BuildPogsCandidate.out(0).to(this.ApplyPogsFormRules.in(0));
        this.ApplyPogsFormRules.out(0).to(this.ValidatePogsCandidate.in(0));
    }
}
