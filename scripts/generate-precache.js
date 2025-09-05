const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const assetsPath = path.join(rootDir, 'templates', 'partials', 'assets.html');
const content = fs.readFileSync(assetsPath, 'utf8');

const assets = new Set();
const attrRegex = /(?:src|href)="([^"]+)"/g;
let match;
while ((match = attrRegex.exec(content))) {
  assets.add(match[1]);
}

const workersDir = path.join(rootDir, 'dist', 'js', 'workers');
if (fs.existsSync(workersDir)) {
  for (const file of fs.readdirSync(workersDir)) {
    if (file.endsWith('.js')) {
      assets.add(`/static/current/workers/${file}`);
    }
  }
}

const result = Array.from(assets).sort();
process.stdout.write(JSON.stringify(result));
