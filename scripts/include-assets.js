const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
const partialPath = path.join(rootDir, 'templates', 'partials', 'assets.html');
const partial = fs.readFileSync(partialPath, 'utf8').trim() + '\n';
const placeholder = '<!-- partial:assets -->';

const mode = process.argv[2] || 'inject';

for (const file of htmlFiles) {
  const filePath = path.join(rootDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content;

  if (mode === 'restore') {
    if (updated.includes(partial)) {
      updated = updated.replace(partial, placeholder + '\n');
    }
  } else {
    if (updated.includes(placeholder)) {
      updated = updated.replace(placeholder, partial.trim());
    }
  }

  if (updated !== content) {
    fs.writeFileSync(filePath, updated);
  }
}
