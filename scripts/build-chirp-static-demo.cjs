/**
 * Bake a browseable Chirp Docs UI into assets/demo/ (Astro publicDir → /demo/).
 * Spec JSON is static; try-it / MCP need `npm run serve:chirp-demo` (banner explains).
 *
 * Runs `npm run build` when dist is missing (e.g. fresh clone before `astro:dev`).
 */
const {spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const DIST_MARKERS = [
    path.join(root, 'dist', 'demo', 'chirpDemoApi.js'),
    path.join(root, 'dist', 'callspec-ui', 'ui', 'assets', 'style.css'),
];

function ensureDistBuilt() {
    if (DIST_MARKERS.every((file) => fs.existsSync(file))) {
        return;
    }

    console.log('dist missing or incomplete — running npm run build…');
    const result = spawnSync('npm', ['run', 'build'], {
        cwd: root,
        stdio: 'inherit',
        env: process.env,
    });

    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

ensureDistBuilt();

const {api} = require('../dist/demo/chirpDemoApi');
const {emitCallspec} = require('../dist/emitCallspec');
const {emitOpenApi} = require('../dist/openapi');
const {exportCallspecUi} = require('../dist/callspec-ui/exportCallspecUi');
const {
    defaultAuthHint,
    metaBrandingFromCallspecMeta,
    resolveCallspecMeta,
} = require('../dist/metaDefaults');

const outDir = path.join(root, 'assets', 'demo');
const brandSrc = path.join(root, 'assets', 'chirp');

if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, {recursive: true, force: true});
}

const resolvedMeta = resolveCallspecMeta(api.meta);
const routes = api.routes;

const emitOptions = {
    title: resolvedMeta.title,
    version: resolvedMeta.version,
    description: resolvedMeta.intro,
};

fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(
    path.join(outDir, 'callspec.json'),
    `${JSON.stringify(emitCallspec(routes, emitOptions), null, 2)}\n`,
    'utf8',
);
fs.writeFileSync(
    path.join(outDir, 'openapi.json'),
    `${JSON.stringify(emitOpenApi(routes, emitOptions), null, 2)}\n`,
    'utf8',
);

const authHint = defaultAuthHint(resolvedMeta, routes);
const brandingWithMcp = metaBrandingFromCallspecMeta(resolvedMeta, {authHint});
const {mcp, ...branding} = brandingWithMcp;

exportCallspecUi({
    outDir,
    specUrl: './callspec.json',
    rpcBase: '.',
    title: resolvedMeta.title,
    mcpPath: './mcp',
    mcp,
    demoMode: true,
    branding: {
        ...branding,
        // Short lockup — full title stays in the page H1 / spec meta.
        name: 'Chirp',
        logoUrl: './brand/birb-icon-square.svg',
        logoUrlDark: './brand/birb-icon-square.svg',
        favicon: './brand/birb-icon-square.svg',
        notice: {
            title: 'Demo only',
            message: 'Browse-only — no Send or live MCP.',
            links: [{label: 'Setup guide', href: '/development/'}],
        },
    },
});

const demoIndexPath = path.join(outDir, 'index.html');
const demoHtml = fs.readFileSync(demoIndexPath, 'utf8');

if (!demoHtml.includes('<base href="/demo/">')) {
    fs.writeFileSync(
        demoIndexPath,
        demoHtml.replace('<head>', '<head>\n    <base href="/demo/">'),
        'utf8',
    );
}

const brandOut = path.join(outDir, 'brand');
fs.mkdirSync(brandOut, {recursive: true});
fs.copyFileSync(
    path.join(brandSrc, 'birb-icon-square.svg'),
    path.join(brandOut, 'birb-icon-square.svg'),
);

console.log(`chirp static demo → ${path.relative(root, outDir)}`);
