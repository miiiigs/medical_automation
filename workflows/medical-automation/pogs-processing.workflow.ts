import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : pogs-processing
// Nodes   : 12  |  Connections: 11
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// WhenExecutedByAnotherWorkflow      executeWorkflowTrigger
// ValidatePogsInput                  code
// Ping                               httpRequest
// Login                              httpRequest
// CreatePatientCaseRecord            httpRequest
// CreateCase                         httpRequest
// CheckExistingCase                  httpRequest                [alwaysOutput]
// CaseAlreadyExists                  if
// NormalizeCaseCheck                 code
// DuplicateCaseStop                  set
// VerifyCreatedCase                  httpRequest
// NormalizeCreatedCase               code
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// WhenExecutedByAnotherWorkflow
//    → ValidatePogsInput
//      → Ping
//        → Login
//          → CheckExistingCase
//            → NormalizeCaseCheck
//              → CaseAlreadyExists
//                → DuplicateCaseStop
//               .out(1) → CreatePatientCaseRecord
//                  → CreateCase
//                    → VerifyCreatedCase
//                      → NormalizeCreatedCase
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'muoM56eF7sszgYmW',
    name: 'pogs-processing',
    active: false,
    isArchived: false,
    settings: { executionOrder: 'v1', binaryMode: 'separate', availableInMCP: false },
})
export class PogsProcessingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'c8038310-0a07-44e7-8344-f9afbe326c96',
        name: 'When Executed by Another Workflow',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        version: 1.2,
        position: [-144, -128],
    })
    WhenExecutedByAnotherWorkflow = {
        inputSource: 'jsonExample',
        jsonExample: `{
  "caseNum": "N8N-TEST-001",
  "birthDate": "1990-01-01",
  "admissionDate": "2026-08-09",
  "room": "301",
  "weight": 65,
  "height": 160,
  "isPregnancy": true,
  "isGyne": false,
  "isPostpartum": false,
  "obscoreG": 2,
  "obscoreP": 1,
  "obscoreFT": 1,
  "obscorePr": 0,
  "obscoreAb": 0,
  "obscoreLB": 1,
  "runContext": {
    "mode": "LIVE",
    "rawCaseId": "RAW-DOC-example"
  },
  "validation": {
    "readyForPOGS": true
  }
}`,
    };

    @node({
        id: 'aa8c714e-8bb6-452e-93a0-d28253d425cb',
        name: 'Validate POGS Input',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [80, -128],
    })
    ValidatePogsInput = {
        mode: 'runOnceForEachItem',
        jsCode: `const d = $json;

if (!d.caseNum) {
  throw new Error("pogs-processing: caseNum is required");
}

if (!d.birthDate) {
  throw new Error("pogs-processing: birthDate is required");
}

if (!d.admissionDate) {
  throw new Error("pogs-processing: admissionDate is required");
}

if (
  d.runContext?.mode !== "LIVE"
) {
  throw new Error(
    "pogs-processing: live write blocked because runContext.mode is not LIVE"
  );
}

if (
  d.validation?.readyForPOGS !== true
) {
  throw new Error(
    "pogs-processing: live write blocked because validation.readyForPOGS is not true"
  );
}

return {
  json: {
    ...d,
    runContext: {
      ...(d.runContext ?? {}),
      mode: d.runContext?.mode ?? "LIVE"
    }
  }
};`,
    };

    @node({
        id: '856374cb-26fa-42e3-a110-5f1e77dcfd66',
        name: 'Ping',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [304, -128],
    })
    Ping = {
        url: '={{ ($env.POGS_BASE_URL || "http://host.docker.internal:3000") + "/ping" }}',
        options: {},
    };

    @node({
        id: '08506814-70f1-472e-9d0c-4da0bd53da76',
        name: 'Login',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [528, -128],
    })
    Login = {
        method: 'POST',
        url: '={{ ($env.POGS_BASE_URL || "http://host.docker.internal:3000") + "/api/accounts/login" }}',
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
        jsonBody: '={{ { username: $env.POGS_USERNAME, password: $env.POGS_PASSWORD } }}',
        options: {},
    };

    @node({
        id: 'f9aea869-861b-42f1-88b3-f0cc3802289a',
        name: 'Create Patient Case Record',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1424, -32],
    })
    CreatePatientCaseRecord = {
        method: 'POST',
        url: '={{ ($env.POGS_BASE_URL || "http://host.docker.internal:3000") + "/api/patientcases" }}',
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
        jsonBody:
            '={{ { caseNum: $node["Validate POGS Input"].json.caseNum, birthDate: $node["Validate POGS Input"].json.birthDate } }}',
        options: {},
    };

    @node({
        id: 'c385f52d-0ad2-438a-8049-5fd686fcd386',
        name: 'Create Case',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1648, -32],
    })
    CreateCase = {
        method: 'POST',
        url: '={{ ($env.POGS_BASE_URL || "http://host.docker.internal:3000") + "/api/patients/" + $node["Create Patient Case Record"].json["_id"] + "/cases" }}',
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
        jsonBody:
            '={{ { caseNum: $node["Validate POGS Input"].json.caseNum, admissionDate: $node["Validate POGS Input"].json.admissionDate, room: $node["Validate POGS Input"].json.room ?? null, weight: $node["Validate POGS Input"].json.weight ?? null, height: $node["Validate POGS Input"].json.height ?? null, age: $node["Validate POGS Input"].json.age ?? null, bmi: $node["Validate POGS Input"].json.bmi ?? null, isPregnancy: $node["Validate POGS Input"].json.isPregnancy ?? null, isGyne: $node["Validate POGS Input"].json.isGyne ?? null, isPostpartum: $node["Validate POGS Input"].json.isPostpartum ?? null, isDelivered: $node["Validate POGS Input"].json.isDelivered ?? null, obscoreG: $node["Validate POGS Input"].json.obscoreG ?? null, obscoreP: $node["Validate POGS Input"].json.obscoreP ?? null, obscoreFT: $node["Validate POGS Input"].json.obscoreFT ?? null, obscorePr: $node["Validate POGS Input"].json.obscorePr ?? null, obscoreAb: $node["Validate POGS Input"].json.obscoreAb ?? null, obscoreLB: $node["Validate POGS Input"].json.obscoreLB ?? null, gynecologicalDiagnosis: $node["Validate POGS Input"].json.gynecologicalDiagnosis ?? [], medicalHistory: $node["Validate POGS Input"].json.medicalHistory ?? {}, obstetricHistory: $node["Validate POGS Input"].json.obstetricHistory ?? {}, morbidities: $node["Validate POGS Input"].json.morbidities ?? {}, gynemorbidities: $node["Validate POGS Input"].json.gynemorbidities ?? {}, concomitantProcedure: $node["Validate POGS Input"].json.concomitantProcedure ?? {}, obProcedure: $node["Validate POGS Input"].json.obProcedure ?? {}, neonatal: $node["Validate POGS Input"].json.neonatal ?? [], motherCondition: $node["Validate POGS Input"].json.motherCondition ?? null, dischargeDate: $node["Validate POGS Input"].json.dischargeDate ?? null } }}',
        options: {},
    };

    @node({
        id: '0b403f01-c5ac-47e2-a385-43909d6e8d26',
        name: 'Check Existing Case',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [752, -128],
        alwaysOutputData: true,
    })
    CheckExistingCase = {
        url: '={{ ($env.POGS_BASE_URL || "http://host.docker.internal:3000") + "/api/patientcases" }}',
        sendQuery: true,
        queryParameters: {
            parameters: [
                {
                    name: 'search',
                    value: '={{ $node["Validate POGS Input"].json["caseNum"] }}',
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
        id: 'b7f4a86f-271d-4487-8e5b-6df775b43f59',
        name: 'Case Already Exists?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [1200, -128],
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
                    leftValue: '={{ $json.exists === true }}',
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
        id: '8edb9174-0d97-4e50-9208-93eb2442ce56',
        name: 'Normalize Case Check',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [976, -128],
    })
    NormalizeCaseCheck = {
        jsCode: `const requestedCaseNum = $node["Validate POGS Input"].json.caseNum;

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
        id: 'bb0d43f8-3be1-4f60-9740-73717ac15312',
        name: 'Duplicate Case - STOP',
        type: 'n8n-nodes-base.set',
        version: 3.4,
        position: [1424, -224],
    })
    DuplicateCaseStop = {
        mode: 'raw',
        jsonOutput:
            '={{ { status: "skipped", reason: "case_number_already_exists", caseNum: $node["Validate POGS Input"].json["caseNum"], rawCaseId: $node["Validate POGS Input"].json.runContext?.rawCaseId ?? null, runMode: $node["Validate POGS Input"].json.runContext?.mode ?? "LIVE" } }}',
        options: {},
    };

    @node({
        id: '1359e5ca-7826-4901-bfae-634e5ac551ad',
        name: 'Verify Created Case',
        type: 'n8n-nodes-base.httpRequest',
        version: 4.4,
        position: [1872, -32],
    })
    VerifyCreatedCase = {
        url: '={{ ($env.POGS_BASE_URL || "http://host.docker.internal:3000") + "/api/patients/" + $node["Create Patient Case Record"].json["_id"] + "/cases/" + $node["Create Case"].json["_id"] }}',
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
        id: '9a0dca4f-4e34-402c-a7b6-8d406ccb14eb',
        name: 'Normalize Created Case',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2096, -32],
    })
    NormalizeCreatedCase = {
        mode: 'runOnceForEachItem',
        jsCode: `return {
  json: {
    status: "created",
    caseNum:
      $node["Validate POGS Input"].json.caseNum,
    rawCaseId:
      $node["Validate POGS Input"].json.runContext?.rawCaseId ??
      null,
    runMode:
      $node["Validate POGS Input"].json.runContext?.mode ??
      "LIVE",
    patientCaseId:
      $node["Create Patient Case Record"].json["_id"] ??
      null,
    caseId:
      $node["Create Case"].json["_id"] ??
      null,
    verification:
      $json
  }
};`,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.WhenExecutedByAnotherWorkflow.out(0).to(this.ValidatePogsInput.in(0));
        this.ValidatePogsInput.out(0).to(this.Ping.in(0));
        this.Ping.out(0).to(this.Login.in(0));
        this.Login.out(0).to(this.CheckExistingCase.in(0));
        this.CreatePatientCaseRecord.out(0).to(this.CreateCase.in(0));
        this.CheckExistingCase.out(0).to(this.NormalizeCaseCheck.in(0));
        this.CaseAlreadyExists.out(0).to(this.DuplicateCaseStop.in(0));
        this.CaseAlreadyExists.out(1).to(this.CreatePatientCaseRecord.in(0));
        this.NormalizeCaseCheck.out(0).to(this.CaseAlreadyExists.in(0));
        this.CreateCase.out(0).to(this.VerifyCreatedCase.in(0));
        this.VerifyCreatedCase.out(0).to(this.NormalizeCreatedCase.in(0));
    }
}
