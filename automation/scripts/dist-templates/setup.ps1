$ProfileDir = $env:PROFILE_DIR ? $env:PROFILE_DIR : Join-Path $env:USERPROFILE ".udm-automation\profile"
$LogDir = Join-Path $env:USERPROFILE ".udm-automation\logs"
New-Item -ItemType Directory -Force -Path $ProfileDir,$LogDir | Out-Null

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "node not found. Install Node LTS first." ; exit 2
}

if (Get-Command npx -ErrorAction SilentlyContinue) {
  Write-Host "Installing Playwright browsers..."
  npx playwright install --with-deps -y
} else {
  Write-Host "npx not available; install npm or run Playwright install manually."
}

Write-Host "Setup done. Run: .\run.ps1 --job udm:copy_elements_to_another_cycle --runId <id>"
