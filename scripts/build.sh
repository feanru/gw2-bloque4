#!/usr/bin/env bash
set -e

BUILD_DIR="dist-tmp"
RELEASE_DIR="releases"
# Version string shared between build artifacts and runtime cache busting
APP_VERSION="v$(git rev-parse --short HEAD)"
TARGET_DIR="$RELEASE_DIR/$APP_VERSION"

# Ensure version.txt matches APP_VERSION exactly
echo -n "$APP_VERSION" > version.txt

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

# Rename bundles with their content hash and drop stale minified files
node <<'NODE'
const fs = require('fs');
const path = require('path');
const manifestPath = path.join('dist', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const jsDir = path.join('dist', 'js');
const updated = {};

for (const [original, hash] of Object.entries(manifest)) {
  const base = path.basename(original);
  const hashedName = base.endsWith('.min.js')
    ? base.replace(/\.min\.js$/, `.${hash}.min.js`)
    : base.replace(/\.js$/, `.${hash}.js`);
  const src = path.join(jsDir, base);
  const dest = path.join(jsDir, hashedName);
  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
  }
  updated[original] = `/static/js/${hashedName}`;
}

fs.writeFileSync(manifestPath, JSON.stringify(updated, null, 2));

const allowed = new Set(Object.values(updated).map(p => path.basename(p)));
for (const file of fs.readdirSync(jsDir)) {
  if (file.endsWith('.min.js') && !allowed.has(file)) {
    fs.unlinkSync(path.join(jsDir, file));
  }
}

const leftover = fs.readdirSync(jsDir).filter(f => f.endsWith('.min.js') && !allowed.has(f));
if (leftover.length) {
  console.error('Unexpected unhashed bundles:', leftover.join(', '));
  process.exit(1);
}
NODE

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
