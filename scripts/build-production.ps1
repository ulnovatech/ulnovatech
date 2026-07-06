$ErrorActionPreference = 'Stop'

function Invoke-BuildStep([string]$label, [scriptblock]$step) {
  Write-Host "==> $label"
  & $step
  if ($LASTEXITCODE -ne 0) {
    throw "$label failed with exit code $LASTEXITCODE"
  }
}

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Invoke-BuildStep 'Build marketing app' { npm --prefix marketing run build }
Invoke-BuildStep 'Build blog app' { npm --prefix uln-blog run build }
Invoke-BuildStep 'Build CRM dashboard' { npm --prefix ulndash/frontend run build }
Invoke-BuildStep 'Build portfolio app' { npm --prefix portfolio/frontend run build }

Invoke-BuildStep 'Install PHP dependencies (ulndash backend)' {
  if (Get-Command composer -ErrorAction SilentlyContinue) {
    composer install --no-dev --optimize-autoloader --working-dir=(Join-Path $root 'ulndash\backend')
  } else {
    Write-Warning 'composer not found — skipping ulndash/backend vendor install'
  }
}

$publicHtml = Join-Path $root 'public_html'
if (Test-Path $publicHtml) {
  Remove-Item -Recurse -Force $publicHtml
}
New-Item -ItemType Directory -Force -Path $publicHtml | Out-Null

Write-Host '==> Assemble public_html'
Copy-Item -Recurse -Force (Join-Path $root 'marketing\dist\*') $publicHtml
Copy-Item -Recurse -Force (Join-Path $root 'uln-blog\dist') (Join-Path $publicHtml 'blog')
Copy-Item -Recurse -Force (Join-Path $root 'ulndash\frontend\dist') (Join-Path $publicHtml 'dash')
Copy-Item -Recurse -Force (Join-Path $root 'portfolio\frontend\dist') (Join-Path $publicHtml 'portfolio-app')

Copy-Item -Force (Join-Path $root '.htaccess') (Join-Path $publicHtml '.htaccess')
Copy-Item -Force (Join-Path $root 'scripts\htaccess\blog.htaccess') (Join-Path $publicHtml 'blog\.htaccess')
Copy-Item -Force (Join-Path $root 'scripts\htaccess\dash.htaccess') (Join-Path $publicHtml 'dash\.htaccess')
Copy-Item -Force (Join-Path $root 'scripts\htaccess\portfolio-app.htaccess') (Join-Path $publicHtml 'portfolio-app\.htaccess')

Copy-Item -Recurse -Force (Join-Path $root 'assets') (Join-Path $publicHtml 'assets')
Copy-Item -Recurse -Force (Join-Path $root 'forms') (Join-Path $publicHtml 'forms')
Copy-Item -Recurse -Force (Join-Path $root 'php') (Join-Path $publicHtml 'php')
New-Item -ItemType Directory -Force -Path (Join-Path $publicHtml 'portfolio\api') | Out-Null
Copy-Item -Recurse -Force (Join-Path $root 'portfolio\api\*') (Join-Path $publicHtml 'portfolio\api')
if (Test-Path (Join-Path $root 'portfolio\portfolio')) {
  Copy-Item -Recurse -Force (Join-Path $root 'portfolio\portfolio') (Join-Path $publicHtml 'portfolio\portfolio')
}
New-Item -ItemType Directory -Force -Path (Join-Path $publicHtml 'ulndash\backend') | Out-Null
Copy-Item -Recurse -Force (Join-Path $root 'ulndash\backend\*') (Join-Path $publicHtml 'ulndash\backend')

$htmlExclude = @('marketing.html', 'about.html', 'prices.html')
Get-ChildItem -Path $root -Filter '*.html' -File | Where-Object { $htmlExclude -notcontains $_.Name } | ForEach-Object {
  Copy-Item -Force $_.FullName (Join-Path $publicHtml $_.Name)
}

Write-Host '==> Build complete: public_html is ready for deploy'
