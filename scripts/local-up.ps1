# One-command local stack: build (if needed) + Docker full stack + smoke tests
param(
    [switch]$Dev,
    [switch]$SkipBuild,
    [switch]$SkipSmoke,
    [switch]$NoDockerStart
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Test-DockerRunning {
    try {
        docker info 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Start-DockerDesktopIfNeeded {
    if (Test-DockerRunning) { return $true }
    if ($NoDockerStart) { return $false }

    $candidates = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
    )

    foreach ($exe in $candidates) {
        if (-not (Test-Path $exe)) { continue }
        Write-Host "==> Starting Docker Desktop (waiting up to 3 min)..."
        Start-Process $exe | Out-Null
        for ($i = 0; $i -lt 90; $i++) {
            Start-Sleep -Seconds 2
            if (Test-DockerRunning) {
                Write-Host "==> Docker is ready."
                return $true
            }
        }
    }
    return $false
}

function Ensure-DiscoveryEnv {
    $envFile = Join-Path $root 'discovery\.env'
    $example = Join-Path $root 'discovery\.env.example'
    if (-not (Test-Path $envFile) -and (Test-Path $example)) {
        Copy-Item $example $envFile
        Write-Host "==> Created discovery/.env from .env.example"
    }
}

function Print-DockerUrls {
    Write-Host ""
    Write-Host "=== UlnoVaTech local (Docker) ===" -ForegroundColor Cyan
    Write-Host "  Main site:     http://localhost:8080"
    Write-Host "  CRM dash:      http://localhost:8080/dash/"
    Write-Host "  Discovery:     http://localhost:3000"
    Write-Host "  Discovery/nginx: http://discovery.ulnovatech.store:8080  (add to hosts: 127.0.0.1 discovery.ulnovatech.store)"
    Write-Host ""
    Write-Host "  Stop: npm run local:down"
    Write-Host ""
}

function Print-DevUrls {
    Write-Host ""
    Write-Host "=== UlnoVaTech local (dev servers) ===" -ForegroundColor Cyan
    Write-Host "  Marketing:     http://localhost:5176"
    Write-Host "  Blog:          http://localhost:5173"
    Write-Host "  CRM dash:      http://localhost:5174"
    Write-Host "  Portfolio:     http://localhost:5175"
    Write-Host "  Discovery:     http://localhost:3000"
    Write-Host "  Legacy static: http://localhost:3000 (root serve)"
    Write-Host ""
    Write-Host "  PHP/API: use XAMPP Apache at http://localhost/ulnovatech (or run npm run local for Docker PHP)"
    Write-Host ""
}

if ($Dev) {
    Ensure-DiscoveryEnv
    Print-DevUrls
    npm run dev:all
    exit $LASTEXITCODE
}

if (-not (Start-DockerDesktopIfNeeded)) {
    Write-Host ""
    Write-Host "Docker is not running." -ForegroundColor Red
    Write-Host "  1. Start Docker Desktop manually, then: npm run local"
    Write-Host "  2. Or use dev servers (no Docker):     npm run local -- -Dev"
    exit 1
}

$publicIndex = Join-Path $root 'public_html\index.html'
if (-not $SkipBuild -and -not (Test-Path $publicIndex)) {
    Write-Host "==> Building public_html..."
    npm run build
}

Ensure-DiscoveryEnv

Write-Host "==> Starting full Docker stack..."
docker compose -f infra/docker-compose.full.yml up -d --build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "==> Waiting for services..."
$deadline = (Get-Date).AddMinutes(8)
do {
    Start-Sleep -Seconds 5
    try {
        $health = Invoke-WebRequest -Uri 'http://localhost:8080/health' -UseBasicParsing -TimeoutSec 3
        if ($health.StatusCode -eq 200) { break }
    } catch { }
} while ((Get-Date) -lt $deadline)

Print-DockerUrls

if (-not $SkipSmoke) {
    Write-Host "==> Running smoke tests..."
    & (Join-Path $PSScriptRoot 'smoke-full.ps1') -Base 'http://localhost:8080'
}
