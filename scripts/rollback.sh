#!/bin/bash
set -euo pipefail

TARGET=/var/www/gw2
RELEASE=${1:?"Uso: $0 <VERSION>"}

ln -sfn "$TARGET/static/releases/$RELEASE" "$TARGET/static/current"
