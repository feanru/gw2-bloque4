const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const jsDir = path.join(distDir, 'js');
const manifestPath = path.join(distDir, 'manifest.json');
const assetsTemplate = path.join(rootDir, 'templates', 'partials', 'assets.html');

function fail(msg) {
  console.error(msg);
  process.exitCode = 1;
}

function readManifest() {
  if (!fs.existsSync(manifestPath)) {
    fail(`Manifest not found: ${manifestPath}`);
    return {};
  }
  const data = fs.readFileSync(manifestPath, 'utf8');
  return JSON.parse(data);
}

function verifyFiles(manifest) {
  for (const [route, hash] of Object.entries(manifest)) {
    const filename = path.basename(route);
    const filePath = path.join(jsDir, filename);
    if (!fs.existsSync(filePath)) {
      fail(`Missing bundle for manifest entry: ${filename}`);
      continue;
    }
    const content = fs.readFileSync(filePath);
    const computed = crypto.createHash('sha256').update(content).digest('base64url').slice(0, 8);
    if (computed !== hash) {
      fail(`Hash mismatch for ${filename}: expected ${hash}, got ${computed}`);
    }
  }
}

function verifyTemplates(manifest) {
  if (!fs.existsSync(assetsTemplate)) {
    return;
  }
  const html = fs.readFileSync(assetsTemplate, 'utf8');
  const regex = /src="\/static\/current\/js\/([^"']+\.min\.js)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const file = match[1];
    const manifestKey = `/static/js/${file}`;
    if (!Object.prototype.hasOwnProperty.call(manifest, manifestKey)) {
      fail(`Template references missing bundle: ${file}`);
      continue;
    }
    const filePath = path.join(jsDir, file);
    if (!fs.existsSync(filePath)) {
      fail(`Template references bundle not built: ${file}`);
    }
  }
}

function main() {
  const manifest = readManifest();
  verifyFiles(manifest);
  verifyTemplates(manifest);
  if (process.exitCode) {
    console.error('Bundle verification failed');
    process.exit(1);
  } else {
    console.log('All bundles and manifest entries are valid');
  }
}

main();
