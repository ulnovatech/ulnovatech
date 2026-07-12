param([string]$Base = 'http://localhost:8080')

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $scriptDir 'smoke-ulnovatech.ps1') -Base $Base
& (Join-Path $scriptDir 'smoke-discovery.ps1') -NginxBase $Base

Write-Host "=== Full stack smoke tests passed ===" -ForegroundColor Green
