[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host "[udm-launch] $Message"
}

function Ensure-Directory([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Read-EnvFile([string]$Path) {
  $result = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $result
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line) { return }
    if ($line.StartsWith("#")) { return }

    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { return }

    $name = $line.Substring(0, $idx).Trim()
    $value = $line.Substring($idx + 1)
    $result[$name] = $value
  }

  return $result
}

function Write-EnvFile([string]$Path, [hashtable]$Data) {
  $keys = $Data.Keys | Sort-Object
  $lines = @()
  foreach ($key in $keys) {
    $value = [string]$Data[$key]
    $lines += "$key=$value"
  }

  Set-Content -LiteralPath $Path -Value $lines -Encoding ASCII
}

function Test-PortFree([int]$Port) {
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
  try {
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    try { $listener.Stop() } catch {}
  }
}

function Select-Port([int]$PreferredPort, [int]$MaxPort) {
  if (Test-PortFree -Port $PreferredPort) {
    return $PreferredPort
  }

  for ($port = $PreferredPort + 1; $port -le $MaxPort; $port++) {
    if (Test-PortFree -Port $port) {
      return $port
    }
  }

  throw "No free local port found in range $PreferredPort-$MaxPort."
}

function Wait-ServerReady([string]$BaseUrl) {
  $healthUrl = "$BaseUrl/api/v1/hello"
  for ($attempt = 1; $attempt -le 45; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $healthUrl -Method Get -TimeoutSec 2 -UseBasicParsing
      if ($response.StatusCode -eq 200) {
        return $true
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  return $false
}

function Ensure-PlaywrightCore([string]$NpmCmd, [string]$DepsDir) {
  $playwrightDir = Join-Path $DepsDir "node_modules\playwright-core"
  if (Test-Path -LiteralPath $playwrightDir) {
    return
  }

  Write-Step "Installing local runtime dependencies (first run)..."
  & $NpmCmd install --prefix $DepsDir --no-save playwright-core@1.58.2 dotenv@17.2.4
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to install local runtime dependencies."
  }
}

$releaseRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$appRoot = Join-Path $releaseRoot "app"

$nodeExe = Join-Path $releaseRoot "runtime\node\node.exe"
$npmCmd = Join-Path $releaseRoot "runtime\node\npm.cmd"
$bunExe = Join-Path $releaseRoot "runtime\bun\bun.exe"

$serverEntry = Join-Path $appRoot "server\index.js"
$clientDist = Join-Path $appRoot "client\dist"
$automationCli = Join-Path $appRoot "automation\cli.js"
$templateDb = Join-Path $appRoot "templates\app-template.sqlite"

if (-not (Test-Path -LiteralPath $nodeExe)) {
  throw "Bundled Node runtime not found at $nodeExe"
}
if (-not (Test-Path -LiteralPath $npmCmd)) {
  throw "Bundled npm not found at $npmCmd"
}
if (-not (Test-Path -LiteralPath $bunExe)) {
  throw "Bundled Bun runtime not found at $bunExe"
}
if (-not (Test-Path -LiteralPath $serverEntry)) {
  throw "Server bundle not found at $serverEntry"
}
if (-not (Test-Path -LiteralPath $clientDist)) {
  throw "Client dist folder not found at $clientDist"
}
if (-not (Test-Path -LiteralPath $automationCli)) {
  throw "Automation CLI bundle not found at $automationCli"
}
if (-not (Test-Path -LiteralPath $templateDb)) {
  throw "SQLite template not found at $templateDb"
}

$localRoot = Join-Path $env:LOCALAPPDATA "BHVR-Automation"
$localConfigDir = Join-Path $localRoot "config"
$localDataDir = Join-Path $localRoot "data"
$localStateDir = Join-Path $localRoot "state"
$localLogsDir = Join-Path $localRoot "logs"
$localPidsDir = Join-Path $localRoot "pids"
$localDepsDir = Join-Path $localRoot "deps"

Ensure-Directory -Path $localRoot
Ensure-Directory -Path $localConfigDir
Ensure-Directory -Path $localDataDir
Ensure-Directory -Path $localStateDir
Ensure-Directory -Path $localLogsDir
Ensure-Directory -Path $localPidsDir
Ensure-Directory -Path $localDepsDir

$dbPath = Join-Path $localDataDir "app.sqlite"
if (-not (Test-Path -LiteralPath $dbPath)) {
  Write-Step "Creating local SQLite database from template..."
  Copy-Item -LiteralPath $templateDb -Destination $dbPath -Force
}

$defaultEnvPath = Join-Path $releaseRoot "config\.env.defaults"
$localEnvPath = Join-Path $localConfigDir ".env.local"
$pidPath = Join-Path $localPidsDir "server.pid"
$stdoutLogPath = Join-Path $localLogsDir "server.out.log"
$stderrLogPath = Join-Path $localLogsDir "server.err.log"

$defaults = Read-EnvFile -Path $defaultEnvPath
$localEnv = Read-EnvFile -Path $localEnvPath

$mergedEnv = @{}
foreach ($key in $defaults.Keys) {
  $mergedEnv[$key] = $defaults[$key]
}
foreach ($key in $localEnv.Keys) {
  $mergedEnv[$key] = $localEnv[$key]
}

$preferredPortRaw = [string]($mergedEnv["PORT"])
$preferredPort = 3900
if ([int]::TryParse($preferredPortRaw, [ref]$preferredPort) -eq $false) {
  $preferredPort = 3900
}

if (Test-Path -LiteralPath $pidPath) {
  $existingPidRaw = (Get-Content -LiteralPath $pidPath -Raw).Trim()
  $existingPid = 0
  if ([int]::TryParse($existingPidRaw, [ref]$existingPid)) {
    $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($existingProcess) {
      $existingBaseUrl = "http://127.0.0.1:$preferredPort"
      if (Wait-ServerReady -BaseUrl $existingBaseUrl) {
        Write-Step "Server already running on $existingBaseUrl"
        Start-Process $existingBaseUrl | Out-Null
        exit 0
      }

      Stop-Process -Id $existingPid -Force -ErrorAction SilentlyContinue
      Start-Sleep -Milliseconds 400
    }
  }

  Remove-Item -LiteralPath $pidPath -Force -ErrorAction SilentlyContinue
}

$selectedPort = Select-Port -PreferredPort $preferredPort -MaxPort 3999
$baseUrl = "http://127.0.0.1:$selectedPort"

$mergedEnv["PORT"] = [string]$selectedPort
$mergedEnv["BHVR_API_BASE_URL"] = $baseUrl
$mergedEnv["LIBSQL_URL"] = "file:$dbPath"
$mergedEnv["CLIENT_DIST_DIR"] = $clientDist
$mergedEnv["AUTOMATION_CLI_PATH"] = $automationCli
$mergedEnv["NODE_RUNTIME_PATH"] = $nodeExe
$mergedEnv["AUTOMATION_STATE_DIR"] = $localStateDir
$mergedEnv["BROWSER_STORAGE_STATE"] = (Join-Path $localStateDir "auth.json")
$mergedEnv["NODE_PATH"] = (Join-Path $localDepsDir "node_modules")
$mergedEnv["REPORTER_DISABLED"] = "0"

Write-EnvFile -Path $localEnvPath -Data $mergedEnv

Ensure-PlaywrightCore -NpmCmd $npmCmd -DepsDir $localDepsDir

$runtimePath = "{0};{1};{2}" -f (Split-Path -Parent $nodeExe), (Split-Path -Parent $bunExe), $env:PATH

foreach ($key in $mergedEnv.Keys) {
  [System.Environment]::SetEnvironmentVariable($key, [string]$mergedEnv[$key], "Process")
}
[System.Environment]::SetEnvironmentVariable("PATH", $runtimePath, "Process")

Write-Step "Starting local server on $baseUrl"
$serverProcess = Start-Process -FilePath $bunExe -ArgumentList @($serverEntry) -WorkingDirectory (Split-Path -Parent $serverEntry) -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutLogPath -RedirectStandardError $stderrLogPath

Set-Content -LiteralPath $pidPath -Value $serverProcess.Id -Encoding ASCII

if (-not (Wait-ServerReady -BaseUrl $baseUrl)) {
  Write-Host ""
  Write-Host "Server failed to become ready."
  Write-Host "Check logs:"
  Write-Host "  $stdoutLogPath"
  Write-Host "  $stderrLogPath"
  throw "Launch failed"
}

Write-Step "Opening $baseUrl"
Start-Process $baseUrl | Out-Null
Write-Step "Done"
