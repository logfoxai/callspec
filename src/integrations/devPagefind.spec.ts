import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'kizu';
import {pagefindIndexReady, resolvePagefindDevAsset} from './devPagefind.mjs';

test('resolvePagefindDevAsset maps built index URLs', (assert) => {
    const engine = resolvePagefindDevAsset('/pagefind/pagefind.js');
    assert.equal(engine?.bucket, 'pagefind');
    assert.equal(engine?.rel, 'pagefind.js');

    const shim = resolvePagefindDevAsset('/cs-pagefind/pagefind.js');
    assert.equal(shim?.bucket, 'cs-pagefind');
    assert.equal(shim?.rel, 'pagefind.js');

    assert.equal(resolvePagefindDevAsset('/pagefind/wasm.unknown/pagefind_bg.wasm')?.rel, 'wasm.unknown/pagefind_bg.wasm');
    assert.equal(resolvePagefindDevAsset('/pagefind/../secret'), null);
    assert.equal(resolvePagefindDevAsset('/other'), null);
});

test('pagefindIndexReady requires engine + shim', (assert) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-pagefind-'));
    const pagefindDir = path.join(root, 'docs-site', 'pagefind');
    const shimDir = path.join(root, 'docs-site', 'cs-pagefind');
    fs.mkdirSync(pagefindDir, {recursive: true});
    fs.mkdirSync(shimDir, {recursive: true});

    assert.equal(pagefindIndexReady(root), false);

    fs.writeFileSync(path.join(pagefindDir, 'pagefind.js'), 'engine');
    assert.equal(pagefindIndexReady(root), false);

    fs.writeFileSync(path.join(shimDir, 'pagefind.js'), 'shim');
    assert.equal(pagefindIndexReady(root), true);
});
