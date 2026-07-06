$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '==> Ulnova Admin Mobile — setup' -ForegroundColor Cyan

Write-Host '==> Database migrations'
php ulndash/backend/scripts/apply_admin_mobile_migrations.php
if ($LASTEXITCODE -ne 0) {
    throw 'Migrations failed. Start MySQL (XAMPP) and verify ulndash/backend/.env'
}

$envFile = Join-Path $root 'ulndash\backend\.env'
$required = @('MOBILE_JWT_SECRET', 'DASH_ADMIN_USER')
$recommended = @('FCM_PROJECT_ID')

if (Test-Path $envFile) {
    $envText = Get-Content $envFile -Raw
    foreach ($key in $required) {
        if ($envText -notmatch "(?m)^$key=.+") {
            Write-Warning "Missing or empty $key in ulndash/backend/.env"
        }
    }
    foreach ($key in $recommended) {
        if ($envText -notmatch "(?m)^$key=.+") {
            Write-Warning "Optional for push: set $key in ulndash/backend/.env"
        }
    }
} else {
    Write-Warning 'Copy ulndash/backend/.env.example to .env and configure credentials'
}

$googleServices = Join-Path $root 'admin-mobile\android\app\google-services.json'
if (-not (Test-Path $googleServices)) {
    Write-Warning 'Push: add admin-mobile/android/app/google-services.json from Firebase'
}

Write-Host '==> Install admin-mobile dependencies'
npm --prefix admin-mobile install
if ($LASTEXITCODE -ne 0) { throw 'npm install failed' }

Write-Host '==> Build web bundle'
npm --prefix admin-mobile run build
if ($LASTEXITCODE -ne 0) { throw 'Vite build failed' }

Write-Host '==> Capacitor sync'
npm --prefix admin-mobile exec -- npx cap sync android
if ($LASTEXITCODE -ne 0) { throw 'cap sync failed' }

Write-Host ''
Write-Host 'Setup complete.' -ForegroundColor Green
Write-Host '  Dev browser:  npm run dev:admin-mobile'
Write-Host '  Debug APK:    npm run build:admin-apk'
Write-Host '  Release APK:  npm run build:admin-apk:release  (requires android/keystore.properties)'
Write-Host '  Full guide:   admin-mobile/BUILD.md'
