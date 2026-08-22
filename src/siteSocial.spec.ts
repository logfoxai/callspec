import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ogPngPath = path.join(root, 'assets/og.png');
const shareTitle = 'Callspec — typed SDK, docs, OpenAPI, and MCP from one route';
const shareDescription =
    'Spec-first TypeScript RPC. Define a route once and get a typed SDK, docs, OpenAPI, and MCP from the same contract.';

function pngSize(buf: Buffer): {width: number; height: number} {
    return {
        width: buf.readUInt32BE(16),
        height: buf.readUInt32BE(20),
    };
}

test('homepage share title is Callspec plus what it does', (assert) => {

    const index = readFileSync(path.join(root, 'src/pages/index.astro'), 'utf8');

    assert.equal(index.includes("\t\ttitle: 'Home'"), false);
    assert.equal(index.includes(`\t\ttitle: '${shareTitle}'`), true);
    assert.equal(index.includes(`{tag: 'title', content: '${shareTitle}'}`), true);
    assert.equal(index.includes(`description:\n\t\t\t'${shareDescription}'`), true);

});

test('docs site publishes a branded Open Graph image', (assert) => {

    const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');

    assert.equal(existsSync(ogPngPath), true);
    assert.equal(pngSize(readFileSync(ogPngPath)), {width: 1200, height: 630});

    assert.equal(astro.includes("const site = 'https://callspec.logfox.ai'"), true);
    assert.equal(astro.includes(`property: 'og:image'`), true);
    assert.equal(astro.includes(`name: 'twitter:image'`), true);
    assert.equal(astro.includes('${site}/og.png'), true);
    assert.equal(astro.includes('og:image:width'), true);
    assert.equal(astro.includes('og:image:height'), true);
    assert.equal(astro.includes('og:image:alt'), true);
    assert.equal(astro.includes(shareTitle), true);
    assert.equal(astro.includes(shareDescription), true);

    const ogSvg = readFileSync(path.join(root, 'assets/og.svg'), 'utf8');

    assert.equal(ogSvg.includes('Stop duct-taping'), false);
    assert.equal(ogSvg.includes('Typed SDK, docs, OpenAPI, and MCP from one route.'), true);
    assert.equal(ogSvg.includes('Spec-first TypeScript RPC'), true);

});
