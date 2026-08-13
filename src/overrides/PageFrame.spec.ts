import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pageFrame = readFileSync(path.join(root, 'src/overrides/PageFrame.astro'), 'utf8');

test('PageFrame: persist sidebar scroll before nav (Starlight gap)', (assert) => {

    // Starlight only saves on visibilitychange and skips restore when scroll is 0
    // (`if (!window._starlightScrollRestore)`). We harden both sides.
    assert.equal(pageFrame.includes("const KEY = 'sl-sidebar-state'"), true);
    assert.equal(pageFrame.includes('sessionStorage.getItem(KEY)'), true);
    assert.equal(pageFrame.includes('pagehide'), true);
    assert.equal(pageFrame.includes('#starlight__sidebar a[href]'), true);
    assert.equal(pageFrame.includes("typeof state.scroll !== 'number'"), true);
    assert.equal(pageFrame.includes("(min-width: 50rem)"), true);
    // Per-scroll sessionStorage writes made docs feel sluggish — keep save on click/pagehide only.
    assert.equal(pageFrame.includes("addEventListener('scroll'"), false);

});
