import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {rewriteExplorerCss, rewritePublicFontsForLibBuild} from './explorerFontsLib.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const tokensPath = path.join(root, 'src/callspec-ui/ui/docs-tokens.css');
const stylesPath = path.join(root, 'src/callspec-ui/ui/styles.css');

test('explorer CSS uses public /fonts/ urls — not publicDir-relative or node_modules', (assert) => {

    const tokens = readFileSync(tokensPath, 'utf8');
    const urls = [...tokens.matchAll(/url\(['"]([^'"]+\.woff2)['"]\)/g)].map((match) => match[1]);

    assert.equal(urls.length >= 3, true);
    assert.equal(urls.every((url) => url.startsWith('/fonts/')), true);
    assert.equal(urls.some((url) => url.includes('assets/fonts')), false);
    assert.equal(urls.some((url) => url.includes('node_modules')), false);

    for (const url of urls) {
        assert.equal(existsSync(path.join(root, 'assets', url.slice(1))), true);
    }

});

test('lib build rewrites /fonts/ relative to the CSS file so Vite emits woff2', (assert) => {

    const css = "url('/fonts/ibm-plex-sans-latin-wght-normal.woff2')";
    const rewritten = rewritePublicFontsForLibBuild(css, tokensPath);

    assert.equal(rewritten.includes('../../../assets/fonts/ibm-plex-sans-latin-wght-normal.woff2?no-inline'), true);
    assert.equal(rewritten.includes("url('/fonts/"), false);

    const fromNested = rewritePublicFontsForLibBuild(css, path.join(root, 'src/styles/fonts.css'));

    assert.equal(fromNested.includes('../../assets/fonts/ibm-plex-sans-latin-wght-normal.woff2?no-inline'), true);
    assert.equal(fromNested.includes('../../../assets/fonts/'), false);

});

test('rewriteExplorerCss inlines tokens, hoists @import, and drops /fonts/ urls', (assert) => {

    const styles = readFileSync(stylesPath, 'utf8');
    const result = rewriteExplorerCss(styles, stylesPath);

    assert.equal(result !== null, true);
    const code = result?.code ?? '';
    const trimmed = code.trimStart();

    assert.equal(trimmed.startsWith('@import'), true);
    assert.equal(code.includes('../../styles/docs-shared.css'), true);
    assert.equal(code.includes('./docs-chrome.css'), true);
    assert.equal(code.includes("url('/fonts/"), false);
    assert.equal(code.includes('?no-inline'), true);

    const firstFace = code.indexOf('@font-face');
    const lastImport = code.lastIndexOf('@import');

    assert.equal(firstFace > 0, true);
    assert.equal(lastImport < firstFace, true);

});

test('lib vite plugin only transforms styles.css', (assert) => {

    const vite = readFileSync(path.join(root, 'vite.config.mts'), 'utf8');

    assert.equal(vite.includes('rewriteExplorerCss'), true);
    assert.equal(vite.includes('transform: rewriteExplorerCss'), true);
    assert.equal(vite.includes('resolveId'), false);
    assert.equal(vite.includes('load('), false);
    assert.equal(vite.includes('rewritePublicFontsForLibBuild'), false);

});
