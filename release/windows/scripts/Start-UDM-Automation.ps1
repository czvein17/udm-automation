[CmdletBinding()]
param()

$launchScript = Join-Path $PSScriptRoot "Launch-UDM-Automation.ps1"
& $launchScript
