import { copyFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'netlify', 'functions', 'api.ts');
const outputDir = path.join(root, 'built-lambda');
const destination = path.join(outputDir, 'api.ts');

try {
  await access(source);
} catch {
  console.error(`No se encontró la API de origen: ${source}`);
  process.exit(1);
}

await mkdir(outputDir, { recursive: true });
await copyFile(source, destination);
console.log(`API copiada para Netlify: ${path.relative(root, destination)}`);
