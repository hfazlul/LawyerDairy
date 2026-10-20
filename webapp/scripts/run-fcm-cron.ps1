# Task Scheduler / local helper. Reads secrets from webapp/.env via npm run cron:fcm.
# Do not put CRON_SECRET in this file.
$ErrorActionPreference = 'Stop'
$webapp = Split-Path -Parent $PSScriptRoot
$npm = 'D:\VIVI\nodejs\npm.cmd'
if (-not (Test-Path -LiteralPath $npm)) {
  $npm = 'npm.cmd'
}
Set-Location -LiteralPath $webapp
& $npm run cron:fcm
exit $LASTEXITCODE
