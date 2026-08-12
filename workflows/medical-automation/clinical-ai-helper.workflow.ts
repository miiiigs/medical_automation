import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : clinical-ai-helper
// Nodes   : 6  |  Connections: 5
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// WhenExecutedByAnotherWorkflow      executeWorkflowTrigger
// ValidateAiInput                    code
// BuildOpenaiRequest                 code
// OpenaiClinicalExtraction           httpRequest                [creds]
// ValidateOpenaiResponse             code
// ExtractAiFacts                     code
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WhenExecutedByAnotherWorkflow
//    → ValidateAiInput
//      → BuildOpenaiRequest
//        → OpenaiClinicalExtraction
//          → ValidateOpenaiResponse
//            → ExtractAiFacts
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'RdfJbQll0ukwP31f',
    name: 'clinical-ai-helper',
    active: true,
    isArchived: false,
    settings: { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: false },
})
export class ClinicalAiHelperWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'e1efdf6c-17e5-4065-995a-93cc4aff33cc',
        name: 'When Executed by Another Workflow',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.2,
        position: [0, -64],
    })
    WhenExecutedByAnotherWorkflow = {
        inputSource: 'jsonExample',
        jsonExample: `{
  "clinicalText": "...",
  "knownFacts": {},
  "unresolvedTerms": []
}`,
    };

    @node({
        id: 'c095d40b-9862-4894-b2b0-d49b49b74c0e',
        name: 'Validate AI Input',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [224, -64],
    })
    ValidateAiInput = {
        mode: 'runOnceForEachItem',
        jsCode: `const d = $json;

if (
  typeof d.clinicalText !== "string" ||
  d.clinicalText.trim().length === 0
) {
  throw new Error(
    "clinical-ai-helper: clinicalText is missing"
  );
}

const knownFacts =
  d.knownFacts &&
  typeof d.knownFacts === "object"
    ? d.knownFacts
    : {};

const unresolvedTerms =
  Array.isArray(d.unresolvedTerms)
    ? d.unresolvedTerms
    : [];

return {
  json: {
    clinicalText:
      d.clinicalText.trim(),

    knownFacts,

    unresolvedTerms
  }
};`,
    };

    @node({
        id: '59750033-187e-4eb1-97d2-df6a9162719e',
        name: 'Build OpenAI Request',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [448, -64],
    })
    BuildOpenaiRequest = {
        mode: 'runOnceForEachItem',
        jsCode: `const d = $json;

const systemInstruction = \`
You are a clinical information extraction assistant.

Extract only facts explicitly supported by the clinical text.

Rules:
1. Do not invent clinical facts.
2. Do not infer current delivery from gravidity or parity.
3. PARA > 0 does not mean the current pregnancy has delivered.
4. Distinguish current pregnancy from prior obstetric history.
5. If evidence is insufficient, return null.
6. Do not create, guess, or output POGS IDs.
7. Do not create categoryId, conditionId, procedureId, stageId, or option IDs.
8. Preserve diagnoses and procedures as clinical concepts/text.
9. Negated findings must be marked as negated.
10. Output only values supported by the provided material.
\`.trim();

const userPayload = {
  clinicalText:
    d.clinicalText,

  knownDeterministicFacts:
    d.knownFacts,

  unresolvedTerms:
    d.unresolvedTerms
};

return {
  json: {
    clinicalText:
      d.clinicalText,

    knownFacts:
      d.knownFacts,

    unresolvedTerms:
      d.unresolvedTerms,

    openaiRequest: {
      model:
        "gpt-5-nano",

      store:
        false,

      input: [
        {
          role:
            "system",

          content: [
            {
              type:
                "input_text",

              text:
                systemInstruction
            }
          ]
        },
        {
          role:
            "user",

          content: [
            {
              type:
                "input_text",

              text:
                JSON.stringify(
                  userPayload,
                  null,
                  2
                )
            }
          ]
        }
      ],

      text: {
        format: {
          type:
            "json_schema",

          name:
            "clinical_extraction",

          strict:
            true,

          schema: {
            type:
              "object",

            additionalProperties:
              false,

            properties: {
              isPregnancy: {
                type: [
                  "boolean",
                  "null"
                ]
              },

              isGyne: {
                type: [
                  "boolean",
                  "null"
                ]
              },

              isPostpartum: {
                type: [
                  "boolean",
                  "null"
                ]
              },

              currentPregnancyDelivered: {
                type: [
                  "boolean",
                  "null"
                ]
              },

              pregnancyTypeText: {
                type: [
                  "string",
                  "null"
                ]
              },

              deliveryMannerText: {
                type: [
                  "string",
                  "null"
                ]
              },

              deliveryEvidence: {
                type:
                  "array",

                items: {
                  type:
                    "string"
                }
              },

              diagnosisTerms: {
                type:
                  "array",

                items: {
                  type:
                    "object",

                  additionalProperties:
                    false,

                  properties: {
                    term: {
                      type:
                        "string"
                    },

                    negated: {
                      type:
                        "boolean"
                    },

                    evidence: {
                      type:
                        "string"
                    }
                  },

                  required: [
                    "term",
                    "negated",
                    "evidence"
                  ]
                }
              },

              comorbidityTerms: {
                type:
                  "array",

                items: {
                  type:
                    "object",

                  additionalProperties:
                    false,

                  properties: {
                    term: {
                      type:
                        "string"
                    },

                    negated: {
                      type:
                        "boolean"
                    },

                    evidence: {
                      type:
                        "string"
                    }
                  },

                  required: [
                    "term",
                    "negated",
                    "evidence"
                  ]
                }
              },

              procedureTerms: {
                type:
                  "array",

                items: {
                  type:
                    "object",

                  additionalProperties:
                    false,

                  properties: {
                    term: {
                      type:
                        "string"
                    },

                    evidence: {
                      type:
                        "string"
                    }
                  },

                  required: [
                    "term",
                    "evidence"
                  ]
                }
              },

              uncertainFacts: {
                type:
                  "array",

                items: {
                  type:
                    "string"
                }
              }
            },

            required: [
              "isPregnancy",
              "isGyne",
              "isPostpartum",
              "currentPregnancyDelivered",
              "pregnancyTypeText",
              "deliveryMannerText",
              "deliveryEvidence",
              "diagnosisTerms",
              "comorbidityTerms",
              "procedureTerms",
              "uncertainFacts"
            ]
          }
        }
      }
    }
  }
};`,
    };

    @node({
        id: '44097168-f691-430f-b26e-3486c3637def',
        name: 'OpenAI Clinical Extraction',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [672, -64],
        credentials: { httpHeaderAuth: { id: 'dLkl5lhGsN17ksIO', name: 'Header Auth account' } },
    })
    OpenaiClinicalExtraction = {
        method: 'POST',
        url: 'https://api.openai.com/v1/responses',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
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
        jsonBody: '={{ $json.openaiRequest }}',
        options: {},
    };

    @node({
        id: '36217f66-e9ab-490d-be96-fd807f3cb9d6',
        name: 'Validate OpenAI Response',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [896, -64],
    })
    ValidateOpenaiResponse = {
        mode: 'runOnceForEachItem',
        jsCode: `const response = $json;

if (!response.id) {
  throw new Error(
    "OpenAI response has no response ID"
  );
}

if (
  response.status !== undefined &&
  response.status !== "completed"
) {
  throw new Error(
    \`OpenAI response did not complete. Status: \${
      response.status
    }\`
  );
}

if (
  !Array.isArray(
    response.output
  )
) {
  throw new Error(
    "OpenAI response has no output array"
  );
}

return {
  json:
    response
};`,
    };

    @node({
        id: '24500048-2fb0-44e8-8c89-ef427f1b23eb',
        name: 'Extract AI Facts',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1120, -64],
    })
    ExtractAiFacts = {
        mode: 'runOnceForEachItem',
        jsCode: `const response = $json;

const contentItems =
  (response.output ?? [])
    .flatMap(
      outputItem =>
        outputItem.content ?? []
    );

const outputText =
  contentItems.find(
    item =>
      item.type === "output_text"
  );

if (!outputText?.text) {
  throw new Error(
    "OpenAI response contains no output_text"
  );
}

let aiFacts;

try {
  aiFacts =
    JSON.parse(
      outputText.text
    );
} catch (error) {
  throw new Error(
    \`Failed to parse AI output: \${
      error.message
    }\`
  );
}

return {
  json: {
    aiFacts,

    aiMeta: {
      used:
        true,

      model:
        response.model ??
        null,

      responseId:
        response.id ??
        null
    }
  }
};`,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.WhenExecutedByAnotherWorkflow.out(0).to(this.ValidateAiInput.in(0));
        this.ValidateAiInput.out(0).to(this.BuildOpenaiRequest.in(0));
        this.BuildOpenaiRequest.out(0).to(this.OpenaiClinicalExtraction.in(0));
        this.OpenaiClinicalExtraction.out(0).to(this.ValidateOpenaiResponse.in(0));
        this.ValidateOpenaiResponse.out(0).to(this.ExtractAiFacts.in(0));
    }
}
