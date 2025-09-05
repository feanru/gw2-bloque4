#!/usr/bin/env bash
set -euo pipefail

VERSION=${1:?"Usage: $0 <VERSION>"}
DIR="$(cd "$(dirname "$0")" && pwd)"

node "$DIR/check-assets.js" "$VERSION"
node "$DIR/check-workers.js"
