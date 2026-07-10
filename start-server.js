import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to find the compiled server file
const possiblePaths = [
  path.join(__dirname, 'server', 'dist', '_core', 'index.js'),
  path.join(__dirname, 'server', '_core', 'index.js'),
];

let serverPath = null;
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    serverPath = possiblePath;
    break;
  }
}

if (!serverPath) {
  console.error('Could not find server entry point. Tried:');
  possiblePaths.forEach(p => console.error('  -', p));
  process.exit(1);
}

console.log('Starting server from:', serverPath);
await import(serverPath);
