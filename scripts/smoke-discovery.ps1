param(
    [string]$NginxBase = 'http://localhost:8080',
    [string]$DirectBase = 'http://localhost:3000',
    [string]$DiscoveryHost = 'discovery.ulnovatech.store'
)

$ErrorActionPreference = 'Stop'

Write-Host "=== Discovery smoke tests ==="
Write-Host "  direct:  $DirectBase"
Write-Host "  nginx:   $NginxBase (Host: $DiscoveryHost)"

function Get-StatusCode([string]$Url, [hashtable]$Headers = @{}) {
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30 -Headers $Headers
        return [int]$r.StatusCode
    } catch {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode.value__ }
        throw
    }
}

$codeDirect = Get-StatusCode "$DirectBase/"
Write-Host "GET $DirectBase/ -> $codeDirect"
if ($codeDirect -notin 200, 301, 302, 307, 308) { throw "FAIL: discovery-web direct" }

$codeNginx = Get-StatusCode -Url "$NginxBase/" -Headers @{ Host = $DiscoveryHost }
Write-Host "GET $NginxBase/ (Host: $DiscoveryHost) -> $codeNginx"
if ($codeNginx -notin 200, 301, 302, 307, 308) { throw "FAIL: nginx discovery vhost" }

Write-Host "=== Discovery smoke tests complete ==="
