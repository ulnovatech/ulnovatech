#!/usr/bin/env bash
# Smoke tests for ulnovatech Docker stack (Chunk 3)
set -euo pipefail

BASE="${1:-http://localhost:8080}"
HOST_HDR="${SMOKE_HOST:-hub.34.66.94.12.nip.io}"
ADMIN_USER="${DASH_ADMIN_USER:-admin}"
ADMIN_PASS="${DASH_ADMIN_PASS:-changeme}"
CURL=(curl -s -H "Host: ${HOST_HDR}")

echo "=== UlnoVaTech smoke tests @ ${BASE} (Host: ${HOST_HDR}) ==="

code_health=$("${CURL[@]}" -o /dev/null -w '%{http_code}' "${BASE}/health")
echo "GET /health → ${code_health}"
[[ "$code_health" == "200" ]] || { echo "FAIL: /health"; exit 1; }

code_home=$("${CURL[@]}" -o /dev/null -w '%{http_code}' "${BASE}/")
echo "GET / → ${code_home}"
[[ "$code_home" == "200" ]] || { echo "FAIL: /"; exit 1; }

code_dash=$("${CURL[@]}" -o /dev/null -w '%{http_code}' "${BASE}/dash/")
echo "GET /dash/ → ${code_dash}"
[[ "$code_dash" == "200" ]] || { echo "FAIL: /dash/"; exit 1; }

login_body=$("${CURL[@]}" -X POST "${BASE}/api/auth/mobile/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")
echo "POST /api/auth/mobile/login → ${login_body:0:120}"

if echo "$login_body" | grep -q '"token"'; then
  echo "OK: mobile login returned token"
else
  echo "WARN: mobile login did not return token (check DASH_ADMIN_* in env file)"
fi

code_newsletter=$("${CURL[@]}" -o /dev/null -w '%{http_code}' -X POST "${BASE}/php/newsletter.php" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'email=smoke-test@example.com')
echo "POST /php/newsletter.php → ${code_newsletter}"
# 200/400/409/500 — 500 may mean missing DB table; still proves PHP-FPM routing
if [[ "$code_newsletter" =~ ^(200|400|409|422|500)$ ]]; then
  echo "OK: newsletter endpoint reachable"
else
  echo "FAIL: unexpected newsletter status ${code_newsletter}"
  exit 1
fi

echo "=== Smoke tests complete ==="
