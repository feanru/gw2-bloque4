const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const releasesDir = path.join(rootDir, 'releases');
const inventoryPath = path.join(rootDir, 'asset-manifest.json');

let version = process.argv[2];

function resolveReleaseDir() {
  if (version) {
    return path.join(releasesDir, version);
  }
  if (!fs.existsSync(releasesDir)) {
    console.error(`Releases directory not found: ${releasesDir}`);
    process.exit(1);
  }
  const dirs = fs.readdirSync(releasesDir).filter(f =>
    fs.statSync(path.join(releasesDir, f)).isDirectory()
  );
  if (dirs.length !== 1) {
    console.error('Specify a version or ensure exactly one release in releases/.');
    process.exit(1);
  }
  version = dirs[0];
  return path.join(releasesDir, version);
}

function loadInventory() {
  if (!fs.existsSync(inventoryPath)) {
    console.error(`Inventory not found: ${inventoryPath}`);
    process.exit(1);
  }
  const data = fs.readFileSync(inventoryPath, 'utf8');
  return JSON.parse(data);
}

function main() {
  const releaseDir = resolveReleaseDir();
  const inventory = loadInventory();
  const missing = [];

  for (const relPath of inventory) {
    const filePath = path.join(releaseDir, relPath);
    if (!fs.existsSync(filePath)) {
      missing.push(relPath);
    }
  }

  const report = {
    version,
    status: missing.length ? 'fail' : 'ok',
    missing,
  };
  fs.writeFileSync(path.join(rootDir, 'assets-report.json'), JSON.stringify(report, null, 2));

  if (missing.length) {
    console.error('Missing assets:');
    for (const m of missing) {
      console.error(' -', m);
    }
    process.exit(1);
  } else {
    console.log(`All assets present for release ${version}.`);
  }
}

main();
