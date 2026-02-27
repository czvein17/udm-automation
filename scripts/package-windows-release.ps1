[CmdletBinding()]
param(
  [string]$NodeVersion = "24.14.0",
  [string]$BunVersion = "1.3.9",
  [switch]$SkipRuntimeDownload
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host "[release] $Message"
}

function Ensure-Directory([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Invoke-CheckedCommand([string]$FilePath, [string[]]$Arguments, [string]$WorkingDirectory) {
  $argLine = $Arguments -join " "
  Write-Step "Running: $FilePath $argLine"
  $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -NoNewWindow -PassThru -Wait
  if ($process.ExitCode -ne 0) {
    throw "Command failed ($($process.ExitCode)): $FilePath $argLine"
  }
}

function Copy-ExtractedPayload([string]$ExtractPath, [string]$DestinationPath, [string]$ExpectedFile) {
  $candidateRoot = $ExtractPath
  if (-not (Test-Path -LiteralPath (Join-Path $candidateRoot $ExpectedFile))) {
    $dirs = Get-ChildItem -Path $ExtractPath -Directory
    if ($dirs.Count -eq 1) {
      $candidateRoot = $dirs[0].FullName
    }
  }

  if (-not (Test-Path -LiteralPath (Join-Path $candidateRoot $ExpectedFile))) {
    throw "Expected file '$ExpectedFile' was not found after extraction from $ExtractPath"
  }

  Ensure-Directory -Path $DestinationPath
  Copy-Item -Path (Join-Path $candidateRoot "*") -Destination $DestinationPath -Recurse -Force
}

function Download-And-ExtractRuntime([string]$Uri, [string]$DestinationPath, [string]$ExpectedFile, [string]$TempRoot, [string]$Label) {
  Write-Step "Downloading $Label runtime"
  Ensure-Directory -Path $TempRoot

  $zipPath = Join-Path $TempRoot "$Label.zip"
  $extractPath = Join-Path $TempRoot "$Label-extract"

  if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
  if (Test-Path -LiteralPath $extractPath) { Remove-Item -LiteralPath $extractPath -Recurse -Force }

  Invoke-WebRequest -Uri $Uri -OutFile $zipPath
  Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

  if (Test-Path -LiteralPath $DestinationPath) {
    Remove-Item -LiteralPath $DestinationPath -Recurse -Force
  }

  Copy-ExtractedPayload -ExtractPath $extractPath -DestinationPath $DestinationPath -ExpectedFile $ExpectedFile
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$releaseRoot = Join-Path $repoRoot "release\windows"
$releaseAppRoot = Join-Path $releaseRoot "app"
$releaseRuntimeRoot = Join-Path $releaseRoot "runtime"

Ensure-Directory -Path $releaseRoot
Ensure-Directory -Path $releaseAppRoot
Ensure-Directory -Path $releaseRuntimeRoot

$releaseClientRoot = Join-Path $releaseAppRoot "client"
$releaseServerRoot = Join-Path $releaseAppRoot "server"
$releaseAutomationRoot = Join-Path $releaseAppRoot "automation"
$releaseTemplatesRoot = Join-Path $releaseAppRoot "templates"

foreach ($path in @($releaseClientRoot, $releaseServerRoot, $releaseAutomationRoot, $releaseTemplatesRoot)) {
  if (Test-Path -LiteralPath $path) {
    Remove-Item -LiteralPath $path -Recurse -Force
  }
  Ensure-Directory -Path $path
}

Write-Step "Building client"
Invoke-CheckedCommand -FilePath "bun" -Arguments @("run", "--cwd", "client", "build") -WorkingDirectory $repoRoot

Write-Step "Building automation dist"
Invoke-CheckedCommand -FilePath "bun" -Arguments @("run", "--cwd", "automation", "build:dist") -WorkingDirectory $repoRoot

Write-Step "Bundling server for Bun runtime"
Invoke-CheckedCommand -FilePath "bun" -Arguments @("build", "server/src/index.ts", "--target", "bun", "--outdir", "release/windows/app/server") -WorkingDirectory $repoRoot

Write-Step "Copying client dist"
Ensure-Directory -Path (Join-Path $releaseClientRoot "dist")
Copy-Item -Path (Join-Path $repoRoot "client\dist\*") -Destination (Join-Path $releaseClientRoot "dist") -Recurse -Force

Write-Step "Copying automation dist"
Copy-Item -LiteralPath (Join-Path $repoRoot "automation\dist\cli.js") -Destination (Join-Path $releaseAutomationRoot "cli.js") -Force

Write-Step "Preparing release SQLite template"
Invoke-CheckedCommand -FilePath "bun" -Arguments @("run", "scripts/prepare-release-db.ts") -WorkingDirectory $repoRoot

$tempRoot = $null
if (-not $SkipRuntimeDownload) {
  $tempRoot = Join-Path $repoRoot "release\tmp"
  Ensure-Directory -Path $tempRoot

  $nodeUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-win-x64.zip"
  $bunUrl = "https://github.com/oven-sh/bun/releases/download/bun-v$BunVersion/bun-windows-x64.zip"

  Download-And-ExtractRuntime -Uri $nodeUrl -DestinationPath (Join-Path $releaseRuntimeRoot "node") -ExpectedFile "node.exe" -TempRoot $tempRoot -Label "node"
  Download-And-ExtractRuntime -Uri $bunUrl -DestinationPath (Join-Path $releaseRuntimeRoot "bun") -ExpectedFile "bun.exe" -TempRoot $tempRoot -Label "bun"
}

if ($tempRoot -and (Test-Path -LiteralPath $tempRoot)) {
  Remove-Item -LiteralPath $tempRoot -Recurse -Force
}

$zipPath = Join-Path $repoRoot "release\udm-automation-windows.zip"
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Write-Step "Creating zip package"
Compress-Archive -Path (Join-Path $releaseRoot "*") -DestinationPath $zipPath -Force

Write-Step "Done"
Write-Host "Package: $zipPath"
