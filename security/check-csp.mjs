import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const proformaSource = readFileSync(
  resolve(root, 'src/pages/wallet/utils/proforma.ts'),
  'utf8'
);
const styleMatch = proformaSource.match(/  <style>([\s\S]*?)<\/style>/);

if (!styleMatch) {
  throw new Error('Could not find the proforma style block.');
}

const styleHash = `'sha256-${createHash('sha256')
  .update(styleMatch[1], 'utf8')
  .digest('base64')}'`;
const configs = ['nginx.conf', 'security/nginx/security.conf'].map(path => [
  path,
  readFileSync(resolve(root, path), 'utf8'),
]);

for (const [path, config] of configs) {
  const csp = config
    .split('\n')
    .find(line => line.includes('add_header Content-Security-Policy'));

  if (!csp) {
    throw new Error(`${path}: Content-Security-Policy is missing.`);
  }
  if (/unsafe-inline|unsafe-eval/.test(csp)) {
    throw new Error(`${path}: CSP contains an unsafe source expression.`);
  }
  if (!csp.includes('form-action ')) {
    throw new Error(`${path}: CSP form-action is missing.`);
  }
  if (!csp.includes(styleHash)) {
    throw new Error(
      `${path}: proforma style hash is stale; expected ${styleHash}.`
    );
  }
}

console.log(`CSP checks passed (proforma style hash: ${styleHash}).`);
