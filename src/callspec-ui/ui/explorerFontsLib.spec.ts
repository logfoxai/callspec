import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {rewritePublicFontsForLibBuild} from './explorerFontsLib.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('explorer CSS uses public /fonts/ urls — not publicDir-relative or node_modules', (assert) => {

    const tokens = readFileSync(path.join(root, 'src/callspec-ui/ui/docs-tokens.css'), 'utf8');
    const urls = [...tokens.matchAll(/url\(['"]([^'"]+\.woff2)['"]\)/g)].map((match) => match[1]);

    assert.equal(urls.length >= 3, true);
    assert.equal(urls.every((url) => url.startsWith('/fonts/')), true);
    assert.equal(urls.some((url) => url.includes('assets/fonts')), false);
    assert.equal(urls.some((url) => url.includes('node_modules')), false);

    for (const url of urls) {
        assert.equal(existsSync(path.join(root, 'assets', url.slice(1))), true);
    }

});

test('lib build rewrites /fonts/ to assets/fonts?no-inline so Vite emits files', (assert) => {

    const css = "url('/fonts/ibm-plex-sans-latin-wght-normal.woff2')";
    const rewritten = rewritePublicFontsForLibBuild(css);

    assert.equal(rewritten.includes('../../../assets/fonts/ibm-plex-sans-latin-wght-normal.woff2?no-inline'), true);
    assert.equal(rewritten.includes("url('/fonts/"), false);

    const vite = readFileSync(path.join(root, 'vite.config.mts'), 'utf8');

    assert.equal(vite.includes('rewritePublicFontsForLibBuild'), true);
    assert.equal(vite.includes('rewriteExplorerCss'), true);
    assert.equal(vite.includes("file.endsWith('styles.css')"), true);
    assert.equal(vite.includes("file.endsWith('docs-tokens.css')"), true);
    assert.equal(vite.includes("source.startsWith('/fonts/')"), true);

});
