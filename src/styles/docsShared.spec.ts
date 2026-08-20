import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('astro + vite both import docs-shared', (assert) => {

    const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
    const tokens = readFileSync(path.join(root, 'src/callspec-ui/ui/docs-tokens.css'), 'utf8');

    assert.equal(astro.includes('docs-shared.css'), true);
    assert.equal(tokens.includes('docs-shared.css'), true);

});

test('splash.css loads from Hero override, not the content collection', (assert) => {

    const hero = readFileSync(path.join(root, 'src/overrides/Hero.astro'), 'utf8');
    const index = readFileSync(path.join(root, 'src/content/docs/index.mdx'), 'utf8');

    // MDX → splash.css in .astro content cache, which goes stale.
    assert.equal(hero.includes('splash.css'), true);
    assert.equal(index.includes('splash.css'), false);

});

test('astro docs editor config covers content MDX', (assert) => {

    const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
    const env = readFileSync(path.join(root, 'env.d.ts'), 'utf8');
    const astroTsconfig = readFileSync(path.join(root, 'tsconfig.astro.json'), 'utf8');

    assert.equal(env.includes('astro/client'), true);
    assert.equal(env.includes('.astro/types.d.ts'), true);
    assert.equal(astroTsconfig.includes('src/content/**/*'), true);
    assert.equal(astro.includes('contentIntellisense'), true);
    assert.equal(existsSync(path.join(root, 'src/content/tsconfig.json')), true);

});

test('vite UI @font-face urls resolve to files on disk', (assert) => {

    const tokensPath = path.join(root, 'src/callspec-ui/ui/docs-tokens.css');
    const tokens = readFileSync(tokensPath, 'utf8');
    const urls = [...tokens.matchAll(/url\(['"](\.[^'"]+\.woff2[^'"]*)['"]\)/g)].map((match) => match[1]);
    const tokensDir = path.dirname(tokensPath);

    assert.equal(urls.length >= 3, true);

    for (const url of urls) {

        const [filePath] = url.split('?');

        assert.equal(existsSync(path.resolve(tokensDir, filePath)), true);
        // Vite lib mode inlines every CSS url() unless ?no-inline is present.
        assert.equal(url.includes('no-inline'), true);

    }

});

test('powered-by footer is placed in .content', (assert) => {

    const place = readFileSync(path.join(root, 'src/callspec-ui/ui/poweredByFooter.ts'), 'utf8');
    const main = readFileSync(path.join(root, 'src/callspec-ui/ui/main.ts'), 'utf8');

    assert.equal(place.includes('content.appendChild(footer)'), true);
    assert.equal(place.includes('parkPoweredByFooter'), true);
    assert.equal(main.includes('placePoweredByFooter'), true);
    assert.equal(main.includes('parkPoweredByFooter'), true);

});
