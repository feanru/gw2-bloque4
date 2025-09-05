#!/bin/bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.."; pwd)
TARGET=/var/www/gw2
RELEASE=${1:-$(git rev-parse --short HEAD)}

mkdir -p "$TARGET/static/releases/$RELEASE"
cp -r dist css img backend "$TARGET/static/releases/$RELEASE/"
cp .htaccess refresh.php service-worker.min.js version.txt *.html "$TARGET/static/releases/$RELEASE/"
ln -sfn "$TARGET/static/releases/$RELEASE" "$TARGET/static/current"

cd "$TARGET/static"
ls -1t releases | tail -n +3 | xargs rm -rf

# Purge CDN cache to force revalidation of assets
node "$ROOT/scripts/purge-cdn.js"
