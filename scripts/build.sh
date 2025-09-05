#!/usr/bin/env bash
set -e

BUILD_DIR="dist-tmp"
RELEASE_DIR="releases"
APP_VERSION="v$(git rev-parse --short HEAD)"
TARGET_DIR="$RELEASE_DIR/$APP_VERSION"

cleanup() {
  rm -rf dist "$BUILD_DIR"
}
trap cleanup ERR

mkdir -p "$RELEASE_DIR"
find "$RELEASE_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

rm -rf dist "$BUILD_DIR"
mkdir -p dist

# Build packages and bundles
npm run build:packages
rollup -c

# Generate precache assets and build service worker
PRECACHE_ASSETS=$(node scripts/generate-precache.js)
sed -e "s/__APP_VERSION__/$APP_VERSION/" -e "s|__PRECACHE_ASSETS__|$PRECACHE_ASSETS|" service-worker.js > service-worker.build.js
npx terser service-worker.build.js -o service-worker.min.js
rm service-worker.build.js

# Insert shared assets
node scripts/include-assets.js

# Post build tasks
node scripts/update-html.js
npm run purge:cdn || true

# Move build to releases
mv dist "$BUILD_DIR"
mv "$BUILD_DIR" "$TARGET_DIR"

# Restore html templates
node scripts/include-assets.js restore
