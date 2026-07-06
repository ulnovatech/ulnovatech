#!/usr/bin/env bash
# Assemble public_html for production deploy (Linux / CI / Oracle VM).
# Parity with scripts/build-production.ps1

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

run_step() {
  local label="$1"
  shift
  echo "==> $label"
  "$@"
}

npm_install_if_needed() {
  local dir="$1"
  if [[ -f "$dir/package-lock.json" ]]; then
    npm ci --prefix "$dir"
  else
    npm install --prefix "$dir"
  fi
}

composer_install_backend() {
  if ! command -v composer >/dev/null 2>&1; then
    echo "WARN: composer not found — skipping ulndash/backend vendor install (use committed vendor or install composer)"
    return 0
  fi
  composer install --no-dev --optimize-autoloader --working-dir="$ROOT/ulndash/backend"
}

# --- Build frontends (production mode uses each app's .env.production) ---
npm_install_if_needed marketing
run_step "Build marketing app" npm --prefix marketing run build

npm_install_if_needed uln-blog
run_step "Build blog app" npm --prefix uln-blog run build

npm_install_if_needed ulndash/frontend
run_step "Build CRM dashboard" npm --prefix ulndash/frontend run build

npm_install_if_needed portfolio/frontend
run_step "Build portfolio app" npm --prefix portfolio/frontend run build

run_step "Install PHP dependencies (ulndash backend)" composer_install_backend

# --- Assemble public_html ---
PUBLIC_HTML="$ROOT/public_html"
rm -rf "$PUBLIC_HTML"
mkdir -p "$PUBLIC_HTML"

echo "==> Assemble public_html"

cp -a marketing/dist/. "$PUBLIC_HTML/"
mkdir -p "$PUBLIC_HTML/blog" "$PUBLIC_HTML/dash" "$PUBLIC_HTML/portfolio-app"
cp -a uln-blog/dist/. "$PUBLIC_HTML/blog/"
cp -a ulndash/frontend/dist/. "$PUBLIC_HTML/dash/"
cp -a portfolio/frontend/dist/. "$PUBLIC_HTML/portfolio-app/"

cp -f .htaccess "$PUBLIC_HTML/.htaccess"
cp -f scripts/htaccess/blog.htaccess "$PUBLIC_HTML/blog/.htaccess"
cp -f scripts/htaccess/dash.htaccess "$PUBLIC_HTML/dash/.htaccess"
cp -f scripts/htaccess/portfolio-app.htaccess "$PUBLIC_HTML/portfolio-app/.htaccess"

cp -a assets "$PUBLIC_HTML/assets"
cp -a forms "$PUBLIC_HTML/forms"
cp -a php "$PUBLIC_HTML/php"

mkdir -p "$PUBLIC_HTML/portfolio/api"
cp -a portfolio/api/. "$PUBLIC_HTML/portfolio/api/"

if [[ -d portfolio/portfolio ]]; then
  mkdir -p "$PUBLIC_HTML/portfolio"
  cp -a portfolio/portfolio "$PUBLIC_HTML/portfolio/portfolio"
fi

mkdir -p "$PUBLIC_HTML/ulndash/backend"
cp -a ulndash/backend/. "$PUBLIC_HTML/ulndash/backend/"

HTML_EXCLUDE=(marketing.html about.html prices.html)
shopt -s nullglob
for html in "$ROOT"/*.html; do
  base="$(basename "$html")"
  skip=0
  for ex in "${HTML_EXCLUDE[@]}"; do
    if [[ "$base" == "$ex" ]]; then
      skip=1
      break
    fi
  done
  if [[ $skip -eq 0 ]]; then
    cp -f "$html" "$PUBLIC_HTML/$base"
  fi
done
shopt -u nullglob

echo "==> Build complete: public_html is ready for deploy"
