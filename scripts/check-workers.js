const fs = require('fs');
const path = require('path');
const fetch = global.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

const rootDir = path.join(__dirname, '..');
const releasesDir = path.join(rootDir, 'releases');

if (!fs.existsSync(releasesDir)) {
  console.error('Releases directory not found');
  process.exit(1);
}

const versions = fs.readdirSync(releasesDir).filter((name) => fs.statSync(path.join(releasesDir, name)).isDirectory());

if (versions.length === 0) {
  console.error('No release versions found');
  process.exit(1);
}

const version = versions[0];
const workersDir = path.join(releasesDir, version, 'workers');

if (!fs.existsSync(workersDir)) {
  console.error('Workers directory not found in release');
  process.exit(1);
}

const workers = fs.readdirSync(workersDir).filter((f) => f.endsWith('.js'));
const baseUrl = 'https://gw2item.com/static/current/workers';
const report = [];
let allOk = true;

(async () => {
  for (const worker of workers) {
    const url = `${baseUrl}/${worker}`;
    try {
      const res = await fetch(url, { method: 'GET' });
      report.push({ worker, status: res.status });
      if (res.status !== 200) {
        allOk = false;
      }
    } catch (err) {
      report.push({ worker, status: 'error' });
      allOk = false;
    }
  }

  const reportPath = path.join(rootDir, 'workers-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  if (!allOk) {
    console.error('Some workers failed to fetch');
    process.exit(1);
  } else {
    console.log('All workers fetched successfully');
  }
})();
