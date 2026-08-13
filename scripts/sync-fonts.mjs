#!/usr/bin/env node
/**
 * Copy self-hosted Latin woff2 files from @fontsource into assets/fonts/.
 * Committed copies are served from publicDir (/fonts/…) so docs work without
 * relying on node_modules path resolution at runtime.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir = path.join(root, 'assets/fonts');

const fonts = [
    ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter-latin-wght-normal.woff2'],
    [
        '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
        'space-grotesk-latin-wght-normal.woff2',
    ],
];

fs.mkdirSync(destDir, {recursive: true});

for (const [pkgPath, filename] of fonts) {
    const src = require.resolve(pkgPath);
    const dest = path.join(destDir, filename);
    fs.copyFileSync(src, dest);
    console.log(`sync-fonts: ${filename}`);
}
