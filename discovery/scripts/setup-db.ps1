# Run Drizzle migrations against your local or hosted PostgreSQL (no Docker)
param(
  [string]$DatabaseUrl = ""
)

$root = Resolve-Path "$PSScriptRoot\.."
Set-Location $root

if ($DatabaseUrl) {
  $env:DATABASE_URL = $DatabaseUrl
} elseif (Test-Path "$root\.env") {
  Get-Content "$root\.env" | ForEach-Object {
    if ($_ -match '^\s*DATABASE_URL=(.+)$') {
      $env:DATABASE_URL = $matches[1].Trim()
    }
  }
}

if (-not $env:DATABASE_URL) {
  Write-Host "DATABASE_URL not set. Copy .env.example to .env and set your Postgres connection string."
  Write-Host "See docs/DATABASE_SETUP.md"
  exit 1
}

Write-Host "Running migrations..."
pnpm db:migrate
if ($LASTEXITCODE -eq 0) {
  Write-Host "Database ready."
  exit 0
}

Write-Host "Migration failed. Check that PostgreSQL is running and the database exists."
Write-Host "Create DB with: scripts/create-database.sql"
Write-Host "Setup guide: docs/DATABASE_SETUP.md"
exit 1
