#!/usr/bin/env node
/**
 * Copy self-hosted Latin woff2 files into assets/fonts/.
 * - @fontsource packages for Inter + Caveat
 * - JetBrainsMono Nerd Font Mono from nerd-fonts-woff2 (pinned tag; OFL upstream)
 *
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

/** @see https://github.com/Nick2bad4u/nerd-fonts-woff2 */
const NERD_FONTS_WOFF2_TAG = 'v1.0.5';
const NERD_FONTS_WOFF2_BASE = `https://raw.githubusercontent.com/Nick2bad4u/nerd-fonts-woff2/${NERD_FONTS_WOFF2_TAG}`;

const fontsource = [
    [
        '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
        'inter-latin-wght-normal.woff2',
    ],
    ['@fontsource/caveat/files/caveat-latin-600-normal.woff2', 'caveat-latin-600-normal.woff2'],
];

const nerdFonts = [
    [
        `${NERD_FONTS_WOFF2_BASE}/fonts/woff2/JetBrainsMono/Ligatures/Regular/JetBrainsMonoNerdFontMono-Regular.woff2`,
        'jetbrains-mono-nerd-mono-400.woff2',
    ],
    [
        `${NERD_FONTS_WOFF2_BASE}/fonts/woff2/JetBrainsMono/Ligatures/SemiBold/JetBrainsMonoNerdFontMono-SemiBold.woff2`,
        'jetbrains-mono-nerd-mono-600.woff2',
    ],
];

const retired = [
    'geist-latin-wght-normal.woff2',
    'outfit-latin-wght-normal.woff2',
    'jetbrains-mono-latin-400-normal.woff2',
    'jetbrains-mono-latin-600-normal.woff2',
    'plus-jakarta-sans-latin-wght-normal.woff2',
    'space-grotesk-latin-wght-normal.woff2',
    'ibm-plex-sans-latin-wght-normal.woff2',
    'ibm-plex-mono-latin-400-normal.woff2',
    'ibm-plex-mono-latin-600-normal.woff2',
];

fs.mkdirSync(destDir, {recursive: true});

for (const [pkgPath, filename] of fontsource) {
    const src = require.resolve(pkgPath);
    const dest = path.join(destDir, filename);
    fs.copyFileSync(src, dest);
    console.log(`sync-fonts: ${filename}`);
}

for (const [url, filename] of nerdFonts) {
    const dest = path.join(destDir, filename);
    const res = await fetch(url);

    if (!res.ok) {
        console.error(`sync-fonts: failed to download ${url} (${res.status})`);
        process.exit(1);
    }

    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`sync-fonts: ${filename}`);
}

for (const filename of retired) {
    const dest = path.join(destDir, filename);
    if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
        console.log(`sync-fonts: removed ${filename}`);
    }
}
