/**
 * Ship a Callspec mark + lockups from a named iteration.
 * Usage: node scripts/logo-ship.mjs <id>
 * ids: spec | equals | brackets | forge | tile | apex
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'assets');
const id = process.argv[2] || 'spec';

/** Keep in sync with --cs-primary-* / nav lockup in starlight-custom.css */
const BRAND = {
    markDark: '#22D3EE',
    markLight: '#0096D6',
    favicon: '#0096D6',
};

const HEX =
    'M30.9 4.635A2.2 2.2 0 0 1 33.1 4.635L55.149 17.365A2.2 2.2 0 0 1 56.249 19.27V44.73A2.2 2.2 0 0 1 55.149 46.635L33.1 59.365A2.2 2.2 0 0 1 30.9 59.365L8.851 46.635A2.2 2.2 0 0 1 7.751 44.73V19.27A2.2 2.2 0 0 1 8.851 17.365Z';
const HEX_SHARP = 'M32 4L56.25 18V46L32 60L7.75 46V18Z';

function pill(x, y, w, h) {
    const r = h / 2;
    return `M${(x + r).toFixed(2)} ${y.toFixed(2)}H${(x + w - r).toFixed(2)}A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(x + w - r).toFixed(2)} ${(y + h).toFixed(2)}H${(x + r).toFixed(2)}A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(x + r).toFixed(2)} ${y.toFixed(2)}Z`;
}

function grads(L, R) {
    return `<linearGradient id="${L}" x1="10" y1="8" x2="30" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F0ABFC"/><stop offset="0.5" stop-color="#C026D3"/><stop offset="1" stop-color="#5B21B6"/>
    </linearGradient>
    <linearGradient id="${R}" x1="34" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#A5F3FC"/><stop offset="0.5" stop-color="#06B6D4"/><stop offset="1" stop-color="#1D4ED8"/>
    </linearGradient>`;
}

/** Single-color hex + equals cutout — nav-clear, no gradient arms */
function markSpec(onDark, _ids, favicon = false) {
    const accent = favicon ? BRAND.favicon : onDark ? BRAND.markDark : BRAND.markLight;
    const w = favicon ? 'width="512" height="512" ' : 'width="64" height="64" ';
    const holes = pill(16, 24, 32, 6) + pill(16, 34, 32, 6);
    return `<svg xmlns="http://www.w3.org/2000/svg" ${w}viewBox="0 0 64 64" fill="none">
  <path fill="${accent}" fill-rule="evenodd" d="${HEX}${holes}"/>
</svg>
`;
}

/** Giant equals on rounded hex — dual gradient (legacy) */
function markEquals(onDark, ids, favicon = false) {
    const [c, L, R] = ids;
    const plate = onDark ? '#FFFFFF' : '#0B1220';
    const w = favicon ? 'width="512" height="512" ' : 'width="64" height="64" ';
    const holes = pill(14, 22, 36, 7) + pill(14, 35, 36, 7);
    return `<svg xmlns="http://www.w3.org/2000/svg" ${w}viewBox="0 0 64 64" fill="none">
  <defs>
    <clipPath id="${c}"><path d="${HEX}"/></clipPath>
    ${grads(L, R)}
  </defs>
  <g clip-path="url(#${c})">
    <rect width="32" height="64" fill="url(#${L})"/>
    <rect x="32" width="32" height="64" fill="url(#${R})"/>
  </g>
  <path fill="${plate}" fill-rule="evenodd" d="${HEX}${holes}"/>
</svg>
`;
}

/** Pure brackets — bold, nav-clear, dual spectrum */
function markBrackets(_onDark, ids, favicon = false) {
    const [L, R] = ids;
    const w = favicon ? 'width="512" height="512" ' : 'width="64" height="64" ';
    return `<svg xmlns="http://www.w3.org/2000/svg" ${w}viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="${L}" x1="2" y1="2" x2="32" y2="62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F5D0FE"/><stop offset="0.4" stop-color="#E879F9"/><stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="${R}" x1="32" y1="2" x2="62" y2="62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#A5F3FC"/><stop offset="0.4" stop-color="#22D3EE"/><stop offset="1" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
  <path fill="url(#${L})" d="M30 2 0 32l30 30 13-13L18 32 43 11 30 2Z"/>
  <path fill="url(#${R})" d="M34 2l30 30-30 30-13-13L46 32 21 11 34 2Z"/>
</svg>
`;
}

/** Forge */
function markForge(onDark, ids, favicon = false) {
    const [L, R] = ids;
    const w = favicon ? 'width="512" height="512" ' : 'width="64" height="64" ';
    const tip = onDark ? '#F8FAFC' : '#0B1220';
    return `<svg xmlns="http://www.w3.org/2000/svg" ${w}viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="${L}" x1="2" y1="4" x2="28" y2="60" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F0ABFC"/><stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="${R}" x1="30" y1="14" x2="62" y2="50" gradientUnits="userSpaceOnUse">
      <stop stop-color="#67E8F9"/><stop offset="1" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
  <path fill="url(#${L})" d="M26 5 3 32l23 27 11-11L22 32 37 16 26 5Z"/>
  <rect x="30" y="17" width="28" height="10" rx="5" fill="url(#${R})"/>
  <rect x="34" y="37" width="24" height="10" rx="5" fill="${tip}"/>
</svg>
`;
}

/** Soft tile equals */
function markTile(onDark, ids, favicon = false) {
    const [c, L, R] = ids;
    const plate = onDark ? '#FFFFFF' : '#0B1220';
    const w = favicon ? 'width="512" height="512" ' : 'width="64" height="64" ';
    const tile = 'M10 8h44a10 10 0 0 1 10 10v28a10 10 0 0 1-10 10H10A10 10 0 0 1 0 46V18A10 10 0 0 1 10 8Z';
    const holes = pill(16, 24, 32, 6) + pill(16, 34, 32, 6);
    return `<svg xmlns="http://www.w3.org/2000/svg" ${w}viewBox="0 0 64 64" fill="none">
  <defs>
    <clipPath id="${c}"><path d="${tile}"/></clipPath>
    ${grads(L, R)}
  </defs>
  <g clip-path="url(#${c})">
    <rect width="32" height="64" fill="url(#${L})"/>
    <rect x="32" width="32" height="64" fill="url(#${R})"/>
  </g>
  <path fill="${plate}" fill-rule="evenodd" d="${tile}${holes}"/>
</svg>
`;
}

/** Apex chevrons + pill */
function markApex(onDark, ids, favicon = false) {
    const [L, R] = ids;
    const core = onDark ? '#FFFFFF' : '#0B1220';
    const w = favicon ? 'width="512" height="512" ' : 'width="64" height="64" ';
    return `<svg xmlns="http://www.w3.org/2000/svg" ${w}viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="${L}" x1="2" y1="4" x2="30" y2="60" gradientUnits="userSpaceOnUse">
      <stop stop-color="#F0ABFC"/><stop offset="1" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="${R}" x1="34" y1="4" x2="62" y2="60" gradientUnits="userSpaceOnUse">
      <stop stop-color="#67E8F9"/><stop offset="1" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
  <path fill="url(#${L})" d="M26 4 2 32l24 28 12-12L20 32 38 14 26 4Z"/>
  <path fill="url(#${R})" d="M38 4l24 28-24 28-12-12L44 32 26 14 38 4Z"/>
  <rect x="27" y="22" width="10" height="20" rx="5" fill="${core}"/>
</svg>
`;
}

const makers = {
    spec: markSpec,
    equals: markEquals,
    brackets: markBrackets,
    forge: markForge,
    tile: markTile,
    apex: markApex,
};

const maker = makers[id];
if (!maker) {
    console.error('unknown id', id, 'expected', Object.keys(makers).join('|'));
    process.exit(1);
}

/** Lockup layout — mark + Inter bold wordmark */
const LOCKUP = {
    height: 32,
    markX: 0,
    markY: 0,
    markScale: 0.5,
    /** Hex path spans ~8–56 in the 64×64 mark viewBox */
    markVisualMaxX: 56,
    wordGap: 6,
    fontSize: 15,
    letterSpacing: '-0.03em',
};

function markGroup(onDark, ids) {
    const svg = maker(onDark, ids, false);
    const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    const {markX, markY, markScale} = LOCKUP;
    return `  <g transform="translate(${markX} ${markY}) scale(${markScale})">\n${inner}\n  </g>\n`;
}

function lockup(_onDark, textFill, ids) {
    const {height, markScale, markVisualMaxX, wordGap, fontSize, letterSpacing} = LOCKUP;
    const wordX = markVisualMaxX * markScale + wordGap;
    const textY = height / 2;
    const width = Math.ceil(wordX + fontSize * 5.15);
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 100 900;
        src: url('./fonts/inter-latin-wght-normal.woff2') format('woff2-variations');
      }
    </style>
  </defs>
${markGroup(_onDark, ids)}  <text x="${wordX}" y="${textY}" fill="${textFill}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="${letterSpacing}" dominant-baseline="central">callspec</text>
</svg>
`;
}

const interFontSrc = path.join(
    root,
    'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
);
const spaceGroteskFontSrc = path.join(
    root,
    'node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
);
const interFontDest = path.join(assets, 'fonts/inter-latin-wght-normal.woff2');
const spaceGroteskFontDest = path.join(assets, 'fonts/space-grotesk-latin-wght-normal.woff2');
fs.mkdirSync(path.dirname(interFontDest), {recursive: true});
fs.copyFileSync(interFontSrc, interFontDest);
fs.copyFileSync(spaceGroteskFontSrc, spaceGroteskFontDest);

fs.writeFileSync(path.join(assets, 'favicon.svg'), maker(true, ['fc', 'fL', 'fR'], true));
fs.writeFileSync(path.join(assets, 'mark-dark.svg'), maker(true, ['mdc', 'mdL', 'mdR']));
fs.writeFileSync(path.join(assets, 'mark-light.svg'), maker(false, ['mlc', 'mlL', 'mlR']));
fs.writeFileSync(path.join(assets, 'callspec-lockup-dark.svg'), lockup(true, 'white', ['lkdc', 'lkdL', 'lkdR']));
fs.writeFileSync(path.join(assets, 'callspec-lockup-light.svg'), lockup(false, 'black', ['lklc', 'lklL', 'lklR']));

for (const [dest, src] of [
    ['demo/brand/mark.svg', 'mark-light.svg'],
    ['demo/brand/mark-dark.svg', 'mark-dark.svg'],
    ['demo/assets/mark-light.svg', 'mark-light.svg'],
    ['demo/assets/mark-dark.svg', 'mark-dark.svg'],
]) {
    fs.copyFileSync(path.join(assets, src), path.join(assets, dest));
}

let readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
readme = readme.replace(/(callspec-lockup-(?:dark|light)\.svg)\?cb=\d+/g, `$1?cb=13`);
fs.writeFileSync(path.join(root, 'README.md'), readme);

console.log('shipped', id);
