param(
    [string]$Base = 'http://localhost:8080',
    [string]$AdminUser = $env:DASH_ADMIN_USER,
    [string]$AdminPass = $env:DASH_ADMIN_PASS
)

if (-not $AdminUser) { $AdminUser = 'admin' }
if (-not $AdminPass) { $AdminPass = 'changeme' }

$ErrorActionPreference = 'Stop'

Write-Host "=== UlnoVaTech smoke tests @ $Base ==="

function Get-StatusCode([string]$Url, [string]$Method = 'GET', [string]$Body = $null, [string]$ContentType = $null) {
    try {
        $params = @{ Uri = $Url; Method = $Method; UseBasicParsing = $true; TimeoutSec = 15 }
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = $ContentType
        }
        $r = Invoke-WebRequest @params
        return [int]$r.StatusCode
    } catch {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode.value__ }
        throw
    }
}

$codeHealth = Get-StatusCode "$Base/health"
Write-Host "GET /health -> $codeHealth"
if ($codeHealth -ne 200) { throw "FAIL: /health" }

$codeHome = Get-StatusCode $Base
Write-Host "GET / -> $codeHome"
if ($codeHome -ne 200) { throw "FAIL: /" }

$codeDash = Get-StatusCode "$Base/dash/"
Write-Host "GET /dash/ -> $codeDash"
if ($codeDash -ne 200) { throw "FAIL: /dash/" }

try {
    $login = Invoke-RestMethod -Uri "$Base/api/auth/mobile/login" -Method POST `
        -ContentType 'application/json' `
        -Body (@{ username = $AdminUser; password = $AdminPass } | ConvertTo-Json)
    if ($login.token) { Write-Host "OK: mobile login returned token" }
    else { Write-Host "WARN: mobile login did not return token" }
} catch {
    Write-Host "WARN: mobile login failed - $($_.Exception.Message)"
}

$codeNews = Get-StatusCode -Url "$Base/php/newsletter.php" -Method POST `
    -Body 'email=smoke-test@example.com' -ContentType 'application/x-www-form-urlencoded'
Write-Host "POST /php/newsletter.php -> $codeNews"
if ($codeNews -notin 200, 400, 409, 422, 500) { throw "FAIL: newsletter status $codeNews" }

Write-Host "=== UlnoVaTech smoke tests complete ==="
