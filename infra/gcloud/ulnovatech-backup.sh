#!/usr/bin/env bash
# Daily MySQL + Postgres dumps on the GCE VM. Installed to /usr/local/bin/ulnovatech-backup.sh
set -euo pipefail

ROOT=/opt/ulnovatech
OUT="${ROOT}/backups"
STAMP=$(date +%F)
mkdir -p "$OUT"
cd "${ROOT}/repo"

export PUBLIC_HTML_PATH="${ROOT}/public_html"
export ULNOVATECH_ENV_FILE="${ROOT}/env/docker.ulnovatech.env"
export DISCOVERY_ENV_FILE="${ROOT}/env/docker.discovery.env"

set -a
# shellcheck disable=SC1091
[[ -f "${ROOT}/repo/infra/.env" ]] && source "${ROOT}/repo/infra/.env"
[[ -f "${ROOT}/repo/.env" ]] && source "${ROOT}/repo/.env"
set +a

docker compose -f infra/docker-compose.full.yml exec -T mysql \
  mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" --single-transaction ulnovatech \
  | gzip > "${OUT}/ulnovatech-${STAMP}.sql.gz"

docker compose -f infra/docker-compose.full.yml exec -T postgres \
  pg_dump -U postgres agency_platform \
  | gzip > "${OUT}/discovery-${STAMP}.sql.gz"

find "$OUT" -type f -name '*.sql.gz' -mtime +14 -delete
