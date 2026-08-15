import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, '..');
const sourcePath = resolve(projectDirectory, 'src/data/forbidden.txt');
const outputPath = resolve(
  projectDirectory,
  'src/data/generatedForbiddenTerms.ts'
);

const source = await readFile(sourcePath, 'utf8');
const entries = source
  .split(/\r?\n/)
  .map(entry => entry.trim())
  .filter(Boolean);

const toTypeScriptString = value =>
  `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

const generatedModule = `// This file is generated from src/data/forbidden.txt.\n// Run \"npm run generate:forbidden\" after changing the source list.\nexport const ForbiddenEntries = [\n${entries.map(entry => `  ${toTypeScriptString(entry)}`).join(',\n')},\n] as const;\n`;

await writeFile(outputPath, generatedModule, 'utf8');
