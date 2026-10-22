# Phase 3 local smoke run for shelfaware-ee460.
# 1) Put Firebase service account JSON next to this script as: service-account.json
# 2) Copy .env.example to .env and fill API keys
# 3) .\run-local.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
  foreach ($line in Get-Content $envFile) {
    $t = $line.Trim()
    if ($t -eq "" -or $t.StartsWith("#") -or $t -notmatch "=") { continue }
    $name, $val = $t.Split("=", 2)
    $name = $name.Trim()
    $val = $val.Trim().Trim('"').Trim("'")
    if ([string]::IsNullOrWhiteSpace($name)) { continue }
    $existing = [Environment]::GetEnvironmentVariable($name)
    if ([string]::IsNullOrWhiteSpace($existing)) {
      Set-Item -Path "Env:$name" -Value $val
    }
  }
  Write-Host "Loaded .env"
}

$saPath = Join-Path $PSScriptRoot "service-account.json"
if (-not (Test-Path $saPath)) {
  Write-Host "MISSING: service-account.json"
  Write-Host "Download from Firebase Console:"
  Write-Host "  https://console.firebase.google.com/project/shelfaware-ee460/settings/serviceaccounts/adminsdk"
  Write-Host "  -> Generate new private key -> save as:"
  Write-Host "  $saPath"
  exit 1
}

if ([string]::IsNullOrWhiteSpace($env:FIREBASE_SERVICE_ACCOUNT_JSON)) {
  $env:FIREBASE_SERVICE_ACCOUNT_JSON = "./service-account.json"
}

function Need($name) {
  $v = [Environment]::GetEnvironmentVariable($name)
  return [string]::IsNullOrWhiteSpace($v)
}

$missing = @()
foreach ($k in @("GROQ_API_KEY", "OPENROUTER_API_KEY", "GEMINI_FREE_API_KEY", "HF_API_TOKEN")) {
  if (Need $k) { $missing += $k }
}

if ($missing.Count -gt 0) {
  Write-Host "Set these in .env (or the shell) first:"
  foreach ($k in $missing) {
    Write-Host "  $k"
  }
  Write-Host "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are optional until BotFather is set up."
  exit 1
}

if (Need "TELEGRAM_BOT_TOKEN" -or Need "TELEGRAM_CHAT_ID") {
  Write-Host "Telegram not set - alerts will skip (or use CallMeBot if configured)."
} else {
  Write-Host "Telegram alerts configured (token + chat_id present)."
}

Write-Host "Running model health check against project from service-account.json ..."
python tools\model_health_check.py
