param([string[]]$args)
$env:PROFILE_DIR = $env:PROFILE_DIR ? $env:PROFILE_DIR : "$env:USERPROFILE\.udm-automation\profile"
$env:REPORTER_DISABLED = $env:REPORTER_DISABLED ? $env:REPORTER_DISABLED : "0"
node (Join-Path $PSScriptRoot "cli.js") $args
