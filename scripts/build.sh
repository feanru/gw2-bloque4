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

# Export bundle list for service worker
BUNDLE_ASSETS=$(node -e "process.stdout.write(JSON.stringify(Object.values(require('./dist/manifest.json'))))")
STATIC_ASSETS=$(node scripts/generate-precache.js)
export BUNDLE_ASSETS STATIC_ASSETS
PRECACHE_ASSETS=$(node <<'NODE'
const staticAssets = JSON.parse(process.env.STATIC_ASSETS);
const bundles = JSON.parse(process.env.BUNDLE_ASSETS);
process.stdout.write(JSON.stringify([...staticAssets, ...bundles]));
NODE
)

# Build service worker with precache list
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

# Sync bundles to current alias and prune stale files
mkdir -p static/current/js
MANIFEST_PATH="$TARGET_DIR/manifest.json"
export MANIFEST_PATH
node <<'NODE'
const fs = require('fs');
const path = require('path');
const manifest = JSON.parse(fs.readFileSync(process.env.MANIFEST_PATH, 'utf8'));
const allowed = new Set(Object.values(manifest).map(p => path.basename(p)));
const dir = path.join('static', 'current', 'js');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
for (const file of fs.readdirSync(dir)) {
  if (file.endsWith('.min.js') && !allowed.has(file)) {
    fs.unlinkSync(path.join(dir, file));
  }
}
NODE
cp -r "$TARGET_DIR/js/." static/current/js/

# Restore html templates
node scripts/include-assets.js restore
