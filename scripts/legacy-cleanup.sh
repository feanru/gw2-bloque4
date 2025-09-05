#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/var/log/nginx/legacy.log"
CONF_FILE="$(dirname "$0")/../nginx.conf"

# Deadline for removing rewrites
DEADLINE="2025-06-30"

declare -i hits=0
if [[ -f "$LOG_FILE" ]]; then
  hits=$(python3 - <<'PYCODE'
import datetime, re, sys
log_path = sys.argv[1]
cutoff = datetime.datetime.now() - datetime.timedelta(weeks=4)
count = 0
months = {"Jan":1,"Feb":2,"Mar":3,"Apr":4,"May":5,"Jun":6,
          "Jul":7,"Aug":8,"Sep":9,"Oct":10,"Nov":11,"Dec":12}
with open(log_path, 'r', encoding='utf8', errors='ignore') as fh:
    for line in fh:
        m = re.search(r"\[(\d{2})/(\w{3})/(\d{4}):(\d{2}):(\d{2}):(\d{2})", line)
        if not m:
            continue
        day, mon, year, hh, mm, ss = m.groups()
        dt = datetime.datetime(int(year), months[mon], int(day), int(hh), int(mm), int(ss))
        if dt >= cutoff and '/dist/js/' in line:
            count += 1
print(count)
PYCODE
"$LOG_FILE")
fi

deadline_ts=$(date -d "$DEADLINE" +%s)
now_ts=$(date +%s)

if (( now_ts >= deadline_ts || hits < 20 )); then
  tmp_file="$(mktemp)"
  sed '/# BEGIN legacy hashed js/,/# END legacy hashed js/d' "$CONF_FILE" > "$tmp_file"
  mv "$tmp_file" "$CONF_FILE"
fi
