import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('docs-shared: exposes light/dark page chrome tokens', (assert) => {

    const css = readFileSync(path.join(root, 'src/styles/docs-shared.css'), 'utf8');

    assert.equal(css.includes('--docs-bg:'), true);
    assert.equal(css.includes('--docs-sidebar:'), true);
    assert.equal(css.includes('--docs-header-bg:'), true);
    assert.equal(css.includes('--docs-code-bg:'), true);
    assert.equal(css.includes('--docs-search-height:'), true);
    assert.equal(css.includes('--bg: var(--docs-bg)'), true);
    assert.equal(css.includes('--cs-code-bg: var(--docs-code-bg)'), true);

});

test('astro + vite both import docs-shared', (assert) => {

    const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
    const tokens = readFileSync(path.join(root, 'src/callspec-ui/ui/docs-tokens.css'), 'utf8');
    const starlight = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');

    assert.equal(astro.includes('docs-shared.css'), true);
    assert.equal(tokens.includes('docs-shared.css'), true);
    assert.equal(starlight.includes('--sl-color-bg: var(--docs-bg)'), true);
    assert.equal(starlight.includes('--sl-color-bg-sidebar: var(--docs-sidebar)'), true);

});
