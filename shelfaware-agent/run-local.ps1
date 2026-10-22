# Phase 2 local smoke — requires filled .env + `npx vercel dev` running separately,
# OR use this script only to validate .env completeness before starting vercel.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
  Write-Host "Missing .env — copy .env.example and fill credentials."
  exit 1
}

$required = @(
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "CRON_SECRET"
)

$dotenv = Get-Content ".env" -Raw
$missing = @()
foreach ($k in $required) {
  if ($dotenv -notmatch "(?m)^$k=.+") {
    $missing += $k
  } elseif ($dotenv -match "(?m)^$k=\s*$") {
    $missing += $k
  }
}

# Detect empty values after =
foreach ($line in (Get-Content ".env")) {
  if ($line -match "^\s*#" -or $line -notmatch "=") { continue }
  $name, $val = $line.Split("=", 2)
  if ($required -contains $name.Trim() -and [string]::IsNullOrWhiteSpace($val.Trim().Trim('"'))) {
    if ($missing -notcontains $name.Trim()) { $missing += $name.Trim() }
  }
}

if ($missing.Count -gt 0) {
  Write-Host "Fill these in .env before local test:"
  $missing | ForEach-Object { Write-Host "  - $_" }
  Write-Host ""
  Write-Host "Service account download:"
  Write-Host "  https://console.firebase.google.com/project/shelfaware-ee460/settings/serviceaccounts/adminsdk"
  Write-Host "  project_id     -> FIREBASE_PROJECT_ID"
  Write-Host "  client_email   -> FIREBASE_CLIENT_EMAIL"
  Write-Host "  private_key    -> FIREBASE_PRIVATE_KEY  (keep \n as literal \\n in .env)"
  exit 1
}

Write-Host "Core Firebase + CRON_SECRET look set."
Write-Host ""
Write-Host "Next:"
Write-Host "  1) Fill remaining API keys in .env (Gemini/Groq/OpenRouter/HF/Search)"
Write-Host "  2) npm install"
Write-Host "  3) npx vercel dev"
Write-Host "  4) curl -H `"Authorization: Bearer <CRON_SECRET>`" http://localhost:3000/api/process-queue"
