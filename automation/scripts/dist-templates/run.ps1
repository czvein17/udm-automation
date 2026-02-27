param([string[]]$args)
$env:PROFILE_DIR = $env:PROFILE_DIR ? $env:PROFILE_DIR : "$env:USERPROFILE\.udm-automation\profile"
$env:REPORTER_DISABLED = $env:REPORTER_DISABLED ? $env:REPORTER_DISABLED : "1"
node (Join-Path $PSScriptRoot "..\dist\cli.js") $args
