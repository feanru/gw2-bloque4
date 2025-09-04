#!/usr/bin/env bash
set -e

TMP_DIR=$(mktemp -d)

restore_previous() {
  rm -rf dist/js dist/manifest.json
  if [ -d "$TMP_DIR/js" ]; then mv "$TMP_DIR/js" dist/js; fi
  if [ -f "$TMP_DIR/manifest.json" ]; then mv "$TMP_DIR/manifest.json" dist/manifest.json; fi
  rm -rf "$TMP_DIR"
}

trap restore_previous ERR

# Preserve previous build
if [ -d dist/js ]; then mv dist/js "$TMP_DIR/js"; fi
if [ -f dist/manifest.json ]; then mv dist/manifest.json "$TMP_DIR/manifest.json"; fi

# Build packages and service worker
npm run build:packages
APP_VERSION=v$(git rev-parse --short HEAD)
sed "s/__APP_VERSION__/$APP_VERSION/" service-worker.js > service-worker.build.js
npx terser service-worker.build.js -o service-worker.min.js
rm service-worker.build.js

# Run rollup
rollup -c

# Cleanup backup after successful build
rm -rf "$TMP_DIR"
