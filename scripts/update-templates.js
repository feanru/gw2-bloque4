const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

const jsRegex = /\/dist\/js\/((?:[\w-]+\/)*)([\w-]+?)(?:[.-][^\/"']+)?\.min\.js(\?[^"']*)?/g;
const jsPlainRegex = /\/dist\/js\/((?:[\w-]+\/)*)([\w-]+?)(?:[.-][^\/"']+)?\.js(\?[^"']*)?/g;

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  let updated = content.replace(jsRegex, '/static/current/js/$1$2.min.js$3');
  updated = updated.replace(jsPlainRegex, '/static/current/js/$1$2.js$3');
  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
  }
}
