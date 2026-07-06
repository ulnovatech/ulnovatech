#!/usr/bin/env bash
# Wait for MySQL to accept connections (used by deploy hooks / init containers)
set -euo pipefail

HOST="${1:-mysql}"
PORT="${2:-3306}"
MAX="${3:-60}"

echo "Waiting for MySQL at ${HOST}:${PORT} (max ${MAX}s)..."
for i in $(seq 1 "$MAX"); do
  if (echo >/dev/tcp/"$HOST"/"$PORT") 2>/dev/null; then
    echo "MySQL is up."
    exit 0
  fi
  sleep 1
done

echo "MySQL did not become ready in time." >&2
exit 1
