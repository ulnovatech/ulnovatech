#!/usr/bin/env bash
# Full-stack smoke tests: ulnovatech + Discovery Intelligence
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="${1:-http://localhost:8080}"

echo "=== Full stack smoke @ ${BASE} ==="

bash "${SCRIPT_DIR}/smoke-ulnovatech.sh" "$BASE"
bash "${SCRIPT_DIR}/smoke-discovery.sh" "$BASE"

# Production HTTPS discovery subdomain (optional second pass)
if [[ -n "${DISCOVERY_URL:-}" ]]; then
  echo "=== Discovery production URL: ${DISCOVERY_URL} ==="
  code=$(curl -s -o /dev/null -w '%{http_code}' "${DISCOVERY_URL}/" || echo "000")
  echo "GET ${DISCOVERY_URL}/ → ${code}"
  [[ "$code" =~ ^(200|301|302|307|308)$ ]] || { echo "FAIL: ${DISCOVERY_URL}"; exit 1; }
fi

echo "=== Full stack smoke complete ==="
