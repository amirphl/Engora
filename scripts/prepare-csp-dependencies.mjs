import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const enabledGuard = `if(e&&"undefined"!=typeof document)`;
const disabledGuard = `if(!1&&e&&"undefined"!=typeof document)`;
const supportedVersion = '4.5.2';

const packageMetadata = JSON.parse(
  readFileSync(
    resolve(root, 'node_modules/react-multi-date-picker/package.json'),
    'utf8'
  )
);

if (packageMetadata.version !== supportedVersion) {
  throw new Error(
    `react-multi-date-picker ${packageMetadata.version} is not covered by ` +
      `the CSP compatibility patch for ${supportedVersion}. Review its ` +
      'runtime styles before updating the supported version.'
  );
}

const targets = [
  {
    path: 'node_modules/react-multi-date-picker/build/index.js',
    requiredCss: ['.rmdp-wrapper', '.rmdp-visible'],
  },
  {
    path: 'node_modules/react-multi-date-picker/plugins/time_picker.js',
    requiredCss: ['.rmdp-time-picker'],
  },
];

const externalCss = readFileSync(
  resolve(root, 'src/styles/reactMultiDatePicker.css'),
  'utf8'
);

for (const { path, requiredCss } of targets) {
  const absolutePath = resolve(root, path);
  const source = readFileSync(absolutePath, 'utf8');
  const enabledCount = source.split(enabledGuard).length - 1;
  const disabledCount = source.split(disabledGuard).length - 1;

  for (const selector of requiredCss) {
    if (!externalCss.includes(selector)) {
      throw new Error(
        `${path}: refusing to disable runtime styles because ${selector} ` +
          'is missing from src/styles/reactMultiDatePicker.css.'
      );
    }
  }

  if (enabledCount === 1 && disabledCount === 0) {
    writeFileSync(
      absolutePath,
      source.replace(enabledGuard, disabledGuard),
      'utf8'
    );
    continue;
  }

  if (enabledCount === 0 && disabledCount === 1) {
    continue;
  }

  throw new Error(
    `${path}: expected one date-picker style injector, found ` +
      `${enabledCount} enabled and ${disabledCount} disabled. ` +
      'Review this CSP compatibility patch after changing the dependency.'
  );
}

console.log(
  'CSP dependency preparation passed: date-picker CSS is external-only.'
);
