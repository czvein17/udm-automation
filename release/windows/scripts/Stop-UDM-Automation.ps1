[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$localRoot = Join-Path $env:LOCALAPPDATA "BHVR-Automation"
$pidPath = Join-Path $localRoot "pids\server.pid"

if (-not (Test-Path -LiteralPath $pidPath)) {
  Write-Host "[udm-stop] No running server PID file found."
  exit 0
}

$pidRaw = (Get-Content -LiteralPath $pidPath -Raw).Trim()
$pid = 0
if (-not [int]::TryParse($pidRaw, [ref]$pid)) {
  Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
  Write-Host "[udm-stop] Removed stale PID file."
  exit 0
}

$process = Get-Process -Id $pid -ErrorAction SilentlyContinue
if ($process) {
  Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
  Write-Host "[udm-stop] Stopped server process $pid."
} else {
  Write-Host "[udm-stop] Process $pid was not running."
}

Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
Write-Host "[udm-stop] Done."
