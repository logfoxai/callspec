import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {
    CHIRP_DEMO_DEV_ENTRY,
    classifyExplorerChange,
    distReadyForChirpDemo,
    explorerRebuildCommands,
    explorerRebuildPlan,
    EXPLORER_WATCH_PATHS,
    isChirpDemoIndexRequest,
    renderChirpDemoDevHtml,
} from './watchChirpDemo.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

const BAKED_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Chirp API v2 - Callspec</title>
    <script>(function(){var t=localStorage.getItem('starlight-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;})();</script>
    <link rel="stylesheet" href="./assets/style.abc12345.css">
    <script>window.__CALLSPEC_UI__={"specUrl":"./callspec.json","demoMode":true};</script>
    <link rel="icon" href="./brand/birb-icon-square.svg">
</head>
<body>
    <div id="app" class="loading"><p class="loading-text">Loading…</p></div>
    <footer class="footer"><span class="footer-label">Powered by</span></footer>
    <script src="./assets/app.abc12345.js"></script>
</body>
</html>
`;

test('classifyExplorerChange: spec/brand bake only — UI is Vite HMR', (assert) => {

    assert.equal(classifyExplorerChange('src/callspec-ui/ui/styles.css'), null);
    assert.equal(classifyExplorerChange('src/callspec-ui/ui/iconLabel.ts'), null);
    assert.equal(classifyExplorerChange('src/callspec-ui/exportCallspecUi.ts'), null);
    assert.equal(classifyExplorerChange('vite.config.mts'), null);
    assert.equal(classifyExplorerChange('src/demo/chirpDemoApi.ts'), 'server');
    assert.equal(classifyExplorerChange('src/emitCallspec.ts'), 'server');
    assert.equal(classifyExplorerChange('assets/chirp/birb-icon-square.svg'), 'bake');
    assert.equal(classifyExplorerChange('assets/demo/index.html'), null);
    assert.equal(classifyExplorerChange('src/callspec-ui/ui/iconLabel.spec.ts'), null);
    assert.equal(classifyExplorerChange('src/pages/index.astro'), null);

});

test('explorerRebuildPlan: UI edits do not rebake', (assert) => {

    assert.equal(JSON.stringify(explorerRebuildPlan(['src/callspec-ui/ui/styles.css'])), JSON.stringify({
        server: false,
        bake: false,
    }));
    assert.equal(JSON.stringify(explorerRebuildPlan(['src/demo/chirpDemoApi.ts'])), JSON.stringify({
        server: true,
        bake: true,
    }));
    assert.equal(JSON.stringify(explorerRebuildPlan(['assets/chirp/birb-icon-square.svg'])), JSON.stringify({
        server: false,
        bake: true,
    }));
    assert.equal(JSON.stringify(explorerRebuildPlan([
        'src/callspec-ui/ui/main.ts',
        'src/demo/chirpDemoApi.ts',
    ])), JSON.stringify({
        server: true,
        bake: true,
    }));

});

test('explorerRebuildCommands runs only the needed steps', (assert) => {

    assert.equal(JSON.stringify(explorerRebuildCommands({server: true, bake: true})), JSON.stringify([
        ['npm', ['run', 'build:server']],
        ['node', ['scripts/build-chirp-static-demo.cjs']],
    ]));
    assert.equal(JSON.stringify(explorerRebuildCommands({server: false, bake: true})), JSON.stringify([
        ['node', ['scripts/build-chirp-static-demo.cjs']],
    ]));
    assert.equal(JSON.stringify(explorerRebuildCommands({server: false, bake: false})), JSON.stringify([]));

});

test('distReadyForChirpDemo accepts hashed UI CSS, not a leftover style.css', (assert) => {

    const files = new Set([
        'dist/demo/chirpDemoApi.js',
        'dist/callspec-ui/exportCallspecUi.js',
        'dist/callspec-ui/ui/index.html',
    ]);

    assert.equal(distReadyForChirpDemo('/repo', (file) => files.has(file.replace('/repo/', ''))), true);
    assert.equal(distReadyForChirpDemo('/repo', () => false), false);

});

test('isChirpDemoIndexRequest: only the explorer document', (assert) => {

    assert.equal(isChirpDemoIndexRequest('/demo/'), true);
    assert.equal(isChirpDemoIndexRequest('/demo/index.html'), true);
    assert.equal(isChirpDemoIndexRequest('/demo'), false);
    assert.equal(isChirpDemoIndexRequest('/demo/callspec.json'), false);
    assert.equal(isChirpDemoIndexRequest('/getting-started/'), false);

});

test('renderChirpDemoDevHtml: Vite module entry, not the baked IIFE', (assert) => {

    const html = renderChirpDemoDevHtml(BAKED_HTML);

    assert.equal(html.includes('data-theme="dark"'), true);
    assert.equal(html.includes('<base href="/demo/">'), true);
    assert.equal(html.includes('window.__CALLSPEC_UI__={"specUrl":"./callspec.json","demoMode":true}'), true);
    assert.equal(html.includes(`src="${CHIRP_DEMO_DEV_ENTRY}"`), true);
    assert.equal(html.includes('type="module"'), true);
    assert.equal(html.includes('Chirp API v2 - Callspec'), true);
    assert.equal(html.includes('./brand/birb-icon-square.svg'), true);
    assert.equal(html.includes('starlight-theme'), true);
    assert.equal(html.includes('cs-boot-eq'), true);
    assert.equal(html.includes("t='dark'"), true);
    assert.equal(html.includes('app.abc12345.js'), false);
    assert.equal(html.includes('style.abc12345.css'), false);

});

test('astro:dev serves the explorer through Vite HMR', (assert) => {

    const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
    const bake = readFileSync(path.join(root, 'scripts/build-chirp-static-demo.cjs'), 'utf8');

    assert.equal(astro.includes('watchChirpDemoPlugin'), true);
    assert.equal(astro.includes("'**/assets/demo/**'"), true);
    assert.equal(EXPLORER_WATCH_PATHS.includes('src/demo'), true);
    assert.equal(EXPLORER_WATCH_PATHS.includes('src/callspec-ui'), false);
    assert.equal(bake.includes("ui', 'assets', 'style.css'"), false);
    assert.equal(bake.includes('distReadyForChirpDemo'), true);

});
