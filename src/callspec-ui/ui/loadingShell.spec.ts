import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {CALLSPEC_EQ_BARS, CALLSPEC_HEX_PATH} from './icons';
import {injectChirpDemoBoot, LOADING_BOOT_STYLE, renderLoadingAppHtml, THEME_BOOT_SCRIPT} from './loadingShell.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('loading shell types the equals bars like the docs lockup hover', (assert) => {

    const html = renderLoadingAppHtml();

    assert.equal(html.includes('id="app" class="loading"'), true);
    assert.equal(html.includes('class="cs-boot"'), true);
    assert.equal(html.includes('role="status"'), true);
    assert.equal(html.includes(CALLSPEC_HEX_PATH), true);
    assert.equal(html.includes('cs-lockup__word'), true);
    assert.equal(html.includes('>callspec<'), true);
    assert.equal(html.includes('cs-eq--top'), true);
    assert.equal(html.includes('cs-eq--bottom'), true);
    assert.equal(html.includes('fill-rule="evenodd"'), false);
    assert.equal(html.includes('mask='), false);
    for (const bar of CALLSPEC_EQ_BARS) {
        assert.equal(html.includes(`x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" rx="${bar.rx}"`), true);
    }
    assert.equal(html.includes('Loading Docs...'), true);
    assert.equal(html.includes('Loading…'), false);
    assert.equal(LOADING_BOOT_STYLE.includes('--cs-primary-bg'), false);
    assert.equal(LOADING_BOOT_STYLE.includes('--accent'), false);
    assert.equal(LOADING_BOOT_STYLE.includes('cs-boot-dots'), false);
    assert.equal(LOADING_BOOT_STYLE.includes('cs-boot-breathe'), false);
    assert.equal(LOADING_BOOT_STYLE.includes('cs-boot-enter'), true);
    assert.equal(LOADING_BOOT_STYLE.includes('cs-eq-type'), false);
    assert.equal(LOADING_BOOT_STYLE.includes('cs-boot-eq'), true);
    assert.equal(LOADING_BOOT_STYLE.includes('1.8s cubic-bezier(0.22, 0.7, 0.24, 1)'), true);
    assert.equal(LOADING_BOOT_STYLE.includes('0.45s'), true);
    assert.equal(LOADING_BOOT_STYLE.includes('0.34s'), false);
    assert.equal(LOADING_BOOT_STYLE.includes('prefers-reduced-motion'), true);
    assert.equal(LOADING_BOOT_STYLE.includes("background: hsl(228, 22%, 6%)"), true);
    assert.equal(LOADING_BOOT_STYLE.includes("html[data-theme='light']"), true);

    const explorerCss = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');

    assert.equal(/\.cs-boot__mark\s*\{[^}]*--cs-primary-bg/.test(explorerCss), false);
    assert.equal(/\.cs-boot__mark\s*\{[^}]*--accent/.test(explorerCss), false);

});

test('injectChirpDemoBoot: dark paint is the first thing in <head>', (assert) => {

    const html = injectChirpDemoBoot('<html lang="en"><head><title>x</title></head><body></body></html>');

    assert.equal(html.includes('data-theme="dark"'), true);
    assert.equal(html.indexOf('<style>') < html.indexOf('<title>'), true);
    assert.equal(html.includes("background: hsl(228, 22%, 6%)"), true);
    assert.equal(html.includes("html[data-theme='light']"), true);
    // Inline paint wins over [data-theme=light] and sticks after the theme toggle.
    assert.equal(/<html[^>]*\sstyle=/.test(html), false);
    assert.equal(/<body[^>]*\sstyle=/.test(html), false);
    assert.equal(html.includes("t='dark'"), true);

});

test('baked UI and astro:dev shells share renderLoadingAppHtml', (assert) => {

    const buildUi = readFileSync(path.join(root, 'scripts/build-ui.mjs'), 'utf8');
    const hmr = readFileSync(path.join(root, 'src/integrations/watchChirpDemo.mjs'), 'utf8');

    assert.equal(buildUi.includes('injectChirpDemoBoot'), true);
    assert.equal(hmr.includes('injectChirpDemoBoot'), true);
    assert.equal(THEME_BOOT_SCRIPT.includes("t='dark'"), true);
    assert.equal(THEME_BOOT_SCRIPT.includes('prefers-color-scheme'), false);

});
