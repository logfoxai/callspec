/**
 * Bake a browseable Chirp Docs UI into assets/demo/ (Astro publicDir → /demo/).
 * Spec JSON is static; try-it / MCP need `npm run serve:chirp-demo` (banner explains).
 *
 * Requires `npm run build` first (dist + callspec-ui assets).
 */
const fs = require('fs');
const path = require('path');
const {api} = require('../dist/demo/chirpDemoApi');
const {emitCallspec} = require('../dist/emitCallspec');
const {emitOpenApi} = require('../dist/openapi');
const {exportCallspecUi} = require('../dist/callspec-ui/exportCallspecUi');
const {
    defaultAuthHint,
    metaBrandingFromCallspecMeta,
    resolveCallspecMeta,
} = require('../dist/metaDefaults');

const root = path.resolve(__dirname, '..');
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
    branding: {
        ...branding,
        logoUrl: './brand/mark.svg',
        logoUrlDark: './brand/mark-dark.svg',
        favicon: './brand/mark.svg',
        headerHtml: [
            '<div class="cs-demo-banner" style="margin:0;padding:0.65rem 1rem;font-size:0.875rem;line-height:1.4;',
            'background:color-mix(in srgb, var(--accent, #1d9bf0) 14%, transparent);',
            'border-bottom:1px solid color-mix(in srgb, var(--accent, #1d9bf0) 35%, var(--border, #333));">',
            '<strong>Hosted explorer</strong> — browse routes, schemas, and MCP connect snippets. ',
            'For live try-it and MCP, run <code style="font-size:0.9em">npm run serve:chirp-demo</code> locally.',
            '</div>',
        ].join(''),
    },
});

fs.cpSync(brandSrc, path.join(outDir, 'brand'), {recursive: true});

console.log(`chirp static demo → ${path.relative(root, outDir)}`);
