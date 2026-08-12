import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : case-ingestion
// Nodes   : 15  |  Connections: 15
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// ExtractGoogleDocsLink              code
// ExtractRowData                     httpRequest                [creds]
// ExtractGoogleDocText               googleDocs                 [creds]
// BuildRawCaseSnapshot               code
// RawCaseToFile                      code
// BuildRawCaseIdentity               code
// RawCaseAlreadyExists               if
// WriteRawCase                       readWriteFile
// ReadRawCaseMatches                 readWriteFile              [onError→regular]
// NormalizeRawCaseCheck              code
// MergeRawCaseCheckData              merge
// WhenClickingExecuteWorkflow        manualTrigger
// CallCaseNewProcessing              executeWorkflow
// PrepareProcessingRequest           code
// Webhook                            webhook
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WhenClickingExecuteWorkflow
//    → ExtractRowData
//      → ExtractGoogleDocsLink
//        → BuildRawCaseIdentity
//          → ReadRawCaseMatches
//            → NormalizeRawCaseCheck
//              → MergeRawCaseCheckData
//                → RawCaseAlreadyExists
//                 .out(1) → ExtractGoogleDocText
//                    → BuildRawCaseSnapshot
//                      → RawCaseToFile
//                        → WriteRawCase
//                          → PrepareProcessingRequest
//                            → CallCaseNewProcessing
//          → MergeRawCaseCheckData.in(1) (↩ loop)
// Webhook
//    → ExtractRowData (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'y4OLuHAKYYHh1RJ3',
    name: 'case-ingestion',
    active: true,
    isArchived: false,
    projectId: 'wQUaNsZxjvOIjRQM',
    settings: { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: false },
})
export class CaseIngestionWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'b6145383-4120-4f76-96ee-41a9540d8ed7',
        name: 'Extract Google Docs Link',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [384, -1568],
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
        id: '09846909-3107-4b83-a598-f2e5b0d475ce',
        name: 'Extract Row Data',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [160, -1568],
        credentials: { googleSheetsOAuth2Api: { id: 'w8CHG10kDhGNfouo', name: 'medical_automation Google OAuth2' } },
        retryOnFail: false,
        maxTries: 5,
        waitBetweenTries: 5000,
    })
    ExtractRowData = {
        url: 'https://sheets.googleapis.com/v4/spreadsheets/15r_HPrVzCHuPGxCrJNhDj_kFjepHKwRAdPvHovhnXIk?includeGridData=true&ranges=July%202026!H200:H230',
        authentication: 'predefinedCredentialType',
        nodeCredentialType: 'googleSheetsOAuth2Api',
        options: {},
    };

    @node({
        id: '6da8aee3-e100-4c41-8d99-85a23fed3ce1',
        name: 'Extract Google Doc Text',
        type: 'n8n-nodes-base.googleDocs',
        version: 2,
        position: [1728, -1568],
        credentials: { googleDocsOAuth2Api: { id: 'NRlEgQamrPdmVK3h', name: 'Google Docs account' } },
    })
    ExtractGoogleDocText = {
        operation: 'get',
        documentURL: '={{ $json.documentId }}',
        simple: false,
    };

    @node({
        id: '23bb87be-dd3d-4cb0-93e4-fe47eb97e2cc',
        name: 'Build Raw Case Snapshot',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1952, -1568],
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

return {
  json: {
    rawCaseId: doc.rawCaseId,
    documentId,
    capturedAt:
      new Date().toISOString(),
    googleDoc: doc
  }
};`,
    };

    @node({
        id: '15fe5125-4d86-480c-82ea-2cc9136c149b',
        name: 'Raw Case to File',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2176, -1568],
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
        id: '22d2a261-50cf-4b15-9960-79be502d1b0e',
        name: 'Build Raw Case Identity',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [608, -1568],
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
        id: 'd0ad3bfc-6b00-4b2f-b4d3-8f4773fa5603',
        name: 'Raw Case Already Exists?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1504, -1568],
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
        id: '7eea6cd3-e6f7-488d-aad1-da4daa6d59b5',
        name: 'Write Raw Case',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [2400, -1568],
    })
    WriteRawCase = {
        operation: 'write',
        fileName: '={{ "/data/cases/raw_cases/new/" + $json.fileName }}',
        options: {},
    };

    @node({
        id: '9d583bb4-6cb0-4b99-b408-64818044407b',
        name: 'Read Raw Case Matches',
        type: 'n8n-nodes-base.readWriteFile',
        version: 1.1,
        position: [832, -1632],
        onError: 'continueRegularOutput',
    })
    ReadRawCaseMatches = {
        fileSelector: '=/data/cases/raw_cases/*/{{ $json.rawCaseId }}.json',
        options: {},
    };

    @node({
        id: '635eae3b-3af5-4d6d-9b24-dc8362780ac7',
        name: 'Normalize Raw Case Check',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1056, -1632],
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
        id: '678a9e77-859a-40a9-b3d7-fcd4e3009ab1',
        name: 'Merge Raw Case Check Data',
        type: 'n8n-nodes-base.merge',
        version: 3.2,
        position: [1280, -1568],
    })
    MergeRawCaseCheckData = {
        mode: 'combine',
        combineBy: 'combineByPosition',
        options: {},
    };

    @node({
        id: 'fbd54456-6952-47a6-8dab-396f0bf997f2',
        name: 'When clicking ‘Execute workflow’',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [-64, -1664],
    })
    WhenClickingExecuteWorkflow = {};

    @node({
        id: '7621fd0d-cd72-427e-852a-261be8cf2842',
        name: "Call 'case-new-processing'",
        type: 'n8n-nodes-base.executeWorkflow',
        version: 1.3,
        position: [2848, -1568],
    })
    CallCaseNewProcessing = {
        workflowId: {
            __rl: true,
            value: 'mvtFIT6QbBavL3yf',
            mode: 'list',
            cachedResultUrl: '/workflow/mvtFIT6QbBavL3yf',
            cachedResultName: 'case-new-processing',
        },
        workflowInputs: {
            mappingMode: 'defineBelow',
            value: {
                rawCaseId: '={{ $json.rawCaseId }}',
                sourceQueue: '={{ $json.sourceQueue }}',
                mode: '={{ $json.mode }}',
                aiPolicy: '={{ $json.aiPolicy }}',
            },
            matchingColumns: [],
            schema: [
                {
                    id: 'rawCaseId',
                    displayName: 'rawCaseId',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: false,
                },
                {
                    id: 'sourceQueue',
                    displayName: 'sourceQueue',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: false,
                },
                {
                    id: 'mode',
                    displayName: 'mode',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
                    removed: false,
                },
                {
                    id: 'aiPolicy',
                    displayName: 'aiPolicy',
                    required: false,
                    defaultMatch: false,
                    display: true,
                    canBeUsedToMatch: true,
                    type: 'string',
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
        id: '82b87bfc-69e1-4536-82aa-47171f77ade7',
        name: 'Prepare Processing Request',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2624, -1568],
    })
    PrepareProcessingRequest = {
        mode: 'runOnceForEachItem',
        jsCode: `const data = $json;

if (!data.rawCaseId) {
  throw new Error(
    "Cannot start processing: rawCaseId is missing"
  );
}

if (
  !/^RAW-DOC-[a-f0-9]+$/i.test(
    data.rawCaseId
  )
) {
  throw new Error(
    "Cannot start processing: invalid rawCaseId"
  );
}

return {
  json: {
    rawCaseId: data.rawCaseId,
    sourceQueue: "new",
    mode: "REGRESSION",
    aiPolicy: "DISABLED"
  }
};`,
    };

    @node({
        id: 'aad1043a-ea0d-4c19-a5f0-2662b5cddaf9',
        webhookId: 'bc546216-1613-49bc-a751-b4a6c25728e9',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [-64, -1472],
    })
    Webhook = {
        path: 'case-ingestion',
        options: {},
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.ExtractRowData.out(0).to(this.ExtractGoogleDocsLink.in(0));
        this.ExtractGoogleDocsLink.out(0).to(this.BuildRawCaseIdentity.in(0));
        this.ExtractGoogleDocText.out(0).to(this.BuildRawCaseSnapshot.in(0));
        this.BuildRawCaseSnapshot.out(0).to(this.RawCaseToFile.in(0));
        this.RawCaseToFile.out(0).to(this.WriteRawCase.in(0));
        this.BuildRawCaseIdentity.out(0).to(this.ReadRawCaseMatches.in(0));
        this.BuildRawCaseIdentity.out(0).to(this.MergeRawCaseCheckData.in(1));
        this.RawCaseAlreadyExists.out(1).to(this.ExtractGoogleDocText.in(0));
        this.ReadRawCaseMatches.out(0).to(this.NormalizeRawCaseCheck.in(0));
        this.NormalizeRawCaseCheck.out(0).to(this.MergeRawCaseCheckData.in(0));
        this.MergeRawCaseCheckData.out(0).to(this.RawCaseAlreadyExists.in(0));
        this.WhenClickingExecuteWorkflow.out(0).to(this.ExtractRowData.in(0));
        this.WriteRawCase.out(0).to(this.PrepareProcessingRequest.in(0));
        this.PrepareProcessingRequest.out(0).to(this.CallCaseNewProcessing.in(0));
        this.Webhook.out(0).to(this.ExtractRowData.in(0));
    }
}
