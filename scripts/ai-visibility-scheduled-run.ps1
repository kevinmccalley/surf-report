# Groundswell - AI Visibility scheduled run
# Invoked by Windows Task Scheduler task "GroundswellAIVisibility".
# Runs Claude Code headlessly against the checklist in docs/ai-visibility-scheduled-prompt.md.
# Scoped tool permissions allow read/check/edit/local-commit but NOT git push or any deploy
# command - that gate is enforced by --allowedTools, not just by prompt instruction.
# Mirrors GoodStockPress's equivalent script (scripts/ai-visibility-scheduled-run.ps1).

$ErrorActionPreference = "Stop"

$repoRoot   = "E:\projects\surf-report"
$promptFile = Join-Path $repoRoot "docs\ai-visibility-scheduled-prompt.md"
$logDir     = Join-Path $repoRoot "scripts\run-logs"
$claudeExe  = "C:\nvm4w\nodejs\claude.cmd"

if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$timestamp  = Get-Date -Format "yyyy-MM-dd_HHmmss"
$runLogFile = Join-Path $logDir "$timestamp.log"

# Extract just the prompt body (everything after the "---" divider) so edits to the
# explanatory header at the top of the file don't get sent to Claude as instructions.
$fullContent = Get-Content -Path $promptFile -Raw -Encoding UTF8
$dividerIndex = $fullContent.IndexOf("`n---`n")
if ($dividerIndex -ge 0) {
    $promptBody = $fullContent.Substring($dividerIndex + 5).Trim()
} else {
    $promptBody = $fullContent.Trim()
}

$allowedTools = @(
    "Read", "Grep", "Glob", "Edit", "Write",
    "Bash(curl *)",
    "Bash(git add *)", "Bash(git commit *)", "Bash(git status*)", "Bash(git diff*)", "Bash(git log*)",
    "WebFetch", "WebSearch"
) -join " "

Set-Location $repoRoot

"=== Groundswell AI Visibility scheduled run - $timestamp ===" | Out-File -FilePath $runLogFile -Encoding utf8
"Working directory: $repoRoot" | Out-File -FilePath $runLogFile -Append -Encoding utf8
"Allowed tools: $allowedTools" | Out-File -FilePath $runLogFile -Append -Encoding utf8
"" | Out-File -FilePath $runLogFile -Append -Encoding utf8

try {
    $promptBody | & $claudeExe -p --allowedTools $allowedTools 2>&1 |
        Tee-Object -FilePath $runLogFile -Append
    "" | Out-File -FilePath $runLogFile -Append -Encoding utf8
    "=== Run completed, exit code $LASTEXITCODE ===" | Out-File -FilePath $runLogFile -Append -Encoding utf8
} catch {
    "=== Run failed: $($_.Exception.Message) ===" | Out-File -FilePath $runLogFile -Append -Encoding utf8
}
