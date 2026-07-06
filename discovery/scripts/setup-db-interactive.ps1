# One-time DB setup: create database + run migrations (uses your local PostgreSQL 18)
$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$createdb = "C:\Program Files\PostgreSQL\18\bin\createdb.exe"

if (-not (Test-Path $psql)) {
  Write-Host "psql not found at $psql — adjust path in this script if Postgres is elsewhere."
  exit 1
}

$pgUser = "postgres"
$pgHost = "127.0.0.1"
$pgPort = "5432"
$dbName = "agency_platform"

$secure = Read-Host "Enter PostgreSQL password for user '$pgUser' (input hidden)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $pgPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto($ptr)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

$env:PGPASSWORD = $pgPassword
$encoded = [uri]::EscapeDataString($pgPassword)
$databaseUrl = "postgresql://${pgUser}:${encoded}@${pgHost}:${pgPort}/${dbName}"

Write-Host "Checking connection..."
& $psql -w -U $pgUser -h $pgHost -p $pgPort -d postgres -c "SELECT version();" | Out-Null

$exists = & $psql -w -U $pgUser -h $pgHost -p $pgPort -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$dbName';"
if ($exists -notmatch "1") {
  Write-Host "Creating database $dbName ..."
  & $createdb -w -U $pgUser -h $pgHost -p $pgPort $dbName
} else {
  Write-Host "Database $dbName already exists."
}

# Update .env
$envPath = Join-Path $root ".env"
$localPath = Join-Path $root "apps\dashboard\.env.local"
foreach ($path in @($envPath, $localPath)) {
  if (Test-Path $path) {
    $content = Get-Content $path -Raw
    if ($content -match '(?m)^DATABASE_URL=.*$') {
      $content = $content -replace '(?m)^DATABASE_URL=.*$', "DATABASE_URL=$databaseUrl"
    } else {
      $content = "DATABASE_URL=$databaseUrl`n" + $content
    }
    Set-Content -Path $path -Value $content.TrimEnd() -NoNewline
    Add-Content -Path $path -Value ""
  }
}

$env:DATABASE_URL = $databaseUrl
Set-Location $root
Write-Host "Running migrations..."
pnpm db:migrate

Write-Host ""
Write-Host "Done. Database is ready. Start the app with: pnpm dev"
