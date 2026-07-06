#!/usr/bin/env bash
# Smoke tests for Discovery Intelligence (Docker full stack)
set -euo pipefail

NGINX_BASE="${1:-http://localhost:8080}"
DIRECT_BASE="${DISCOVERY_DIRECT_URL:-http://localhost:3000}"
DISCOVERY_HOST="${DISCOVERY_HOST:-discovery.ulnovatech.store}"

echo "=== Discovery smoke tests ==="
echo "    nginx proxy: ${NGINX_BASE} (Host: ${DISCOVERY_HOST})"
echo "    direct web:  ${DIRECT_BASE}"

code_direct=$(curl -s -o /dev/null -w '%{http_code}' "${DIRECT_BASE}/" || echo "000")
echo "GET ${DIRECT_BASE}/ → ${code_direct}"
if [[ ! "$code_direct" =~ ^(200|301|302|307|308)$ ]]; then
  echo "FAIL: discovery-web not reachable on ${DIRECT_BASE}"
  exit 1
fi

code_nginx=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Host: ${DISCOVERY_HOST}" \
  "${NGINX_BASE}/" || echo "000")
echo "GET ${NGINX_BASE}/ (Host: ${DISCOVERY_HOST}) → ${code_nginx}"
if [[ ! "$code_nginx" =~ ^(200|301|302|307|308)$ ]]; then
  echo "FAIL: nginx discovery vhost not routing"
  exit 1
fi

echo "=== Discovery smoke tests complete ==="
