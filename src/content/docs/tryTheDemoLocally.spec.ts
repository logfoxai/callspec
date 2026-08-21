import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const pagePath = path.join(root, 'src/content/docs/try-the-demo-locally.md');
const readme = readFileSync(path.join(root, 'README.md'), 'utf8');
const development = readFileSync(path.join(root, 'src/content/docs/development.md'), 'utf8');
const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');
const chirpBake = readFileSync(path.join(root, 'scripts/build-chirp-static-demo.cjs'), 'utf8');

test('Try the demo locally is a guide page agents can open from the README', (assert) => {

    assert.equal(existsSync(pagePath), true);
    const page = readFileSync(pagePath, 'utf8');
    assert.equal(page.startsWith('# Try the demo locally'), true);
    assert.equal(page.includes('serve:chirp-demo'), true);
    assert.equal(page.includes('127.0.0.1:3456/v1/docs'), true);
    assert.equal(page.includes('demo'), true);
    assert.equal(readme.includes('## Try the demo'), false);
    assert.equal(readme.includes('src/content/docs/try-the-demo-locally.md'), true);
    assert.equal(astro.includes("slug: 'try-the-demo-locally'"), true);

});

test('Development is contributor docs — live Chirp clone recipe lives on the demo page', (assert) => {

    assert.equal(development.includes('git clone'), false);
    assert.equal(development.includes('try-the-demo-locally.md'), true);
    assert.equal(chirpBake.includes("href: '/try-the-demo-locally/'"), true);
    assert.equal(chirpBake.includes("href: '/development/'"), false);

});
