#!/bin/bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.."; pwd)
TARGET=/var/www/gw2
RELEASE=${1:-$(git rev-parse --short HEAD)}

mkdir -p "$TARGET/static/releases/$RELEASE/js"
cp -r dist/js "$TARGET/static/releases/$RELEASE/"
cp -r css img backend "$TARGET/static/releases/$RELEASE/"
cp .htaccess refresh.php service-worker.min.js version.txt *.html "$TARGET/static/releases/$RELEASE/"

MANIFEST="$ROOT/dist/manifest.json"
jq -r 'to_entries[] | "\(.key) \(.value)"' "$MANIFEST" | while read -r path hash; do
  name=$(basename "$path")
  dest="$TARGET/static/releases/$RELEASE/js/$name"
  if [ ! -f "$dest" ]; then
    echo "Missing JS asset: $name"
    exit 1
  fi
  ln -sfn "$name" "$TARGET/static/releases/$RELEASE/js/${name%.min.js}.$hash.min.js"
done

# Run checks before switching the current alias
bash "$ROOT/scripts/pre-activate.sh" "$RELEASE"

# Activate new release
ln -sfn "$TARGET/static/releases/$RELEASE" "$TARGET/static/current"

# Verify that critical assets are reachable
bash "$ROOT/scripts/post-activate.sh"

cd "$TARGET/static"
ls -1t releases | tail -n +3 | xargs rm -rf

# Purge CDN cache to force revalidation of assets
node "$ROOT/scripts/purge-cdn.js"
