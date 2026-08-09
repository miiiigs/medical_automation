param(
    [string]$ProjectRoot = "C:\dev\AI_Automation\medical_automation",
    [switch]$Compress
)

$ErrorActionPreference = "Stop"

$knowledgePath = Join-Path $ProjectRoot "knowledge"
$regressionPath = Join-Path $ProjectRoot "logs\latest-regression.json"

if (-not (Test-Path $knowledgePath)) {
    throw "Knowledge folder not found: $knowledgePath"
}

$knowledgeFiles = @(
    Get-ChildItem -Path $knowledgePath -Filter "CASE-*.json" -File |
    Sort-Object Name
)

$knowledge = @(
    foreach ($file in $knowledgeFiles) {
        $d = Get-Content -Path $file.FullName -Raw | ConvertFrom-Json

        [PSCustomObject]@{
            knowledgeId     = $d.knowledgeId
            classification  = $d.classification
            extracted       = $d.extracted
            mapped          = $d.mapped
            unresolved      = $d.unresolved
            ignored         = $d.ignored
            mappingCoverage = $d.mappingCoverage
            mappingStatus   = $d.mappingStatus
            ruleEvaluation  = $d.ruleEvaluation
            ruleStatus      = $d.ruleStatus
            validation      = $d.validation
            discovery       = $d.discovery
            runContext      = $d.runContext
        }
    }
)

$regression = $null

if (Test-Path $regressionPath) {
    $regression = Get-Content -Path $regressionPath -Raw | ConvertFrom-Json
}
else {
    Write-Warning "Regression report not found: $regressionPath"
}

$result = [PSCustomObject]@{
    knowledgeFileCount = $knowledgeFiles.Count
    knowledge          = $knowledge
    regression         = $regression
}

if ($Compress) {
    $result | ConvertTo-Json -Depth 20 -Compress
}
else {
    $result | ConvertTo-Json -Depth 20
}
