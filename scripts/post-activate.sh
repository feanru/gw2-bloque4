#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-http://localhost}
TARGET=${TARGET:-/var/www/gw2}

curl -fsS "$BASE_URL/static/current/js/app.min.js" >/dev/null
curl -fsS "$BASE_URL/static/current/css/styles.min.css" >/dev/null

WORKER_DIR="$TARGET/static/current/workers"
shopt -s nullglob
for file in "$WORKER_DIR"/*.js; do
  name=$(basename "$file")
  curl -fsS "$BASE_URL/static/current/workers/$name" >/dev/null
done
shopt -u nullglob
