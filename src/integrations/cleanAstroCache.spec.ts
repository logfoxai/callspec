import {test} from 'kizu';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ASTRO_DEV_CACHE_DIRS, cleanAstroCache} from './cleanAstroCache.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('cleanAstroCache removes .astro and Vite prebundle dirs', (assert) => {

    const tmp = path.join(os.tmpdir(), `callspec-astro-cache-${Date.now()}`);

    for (const rel of ASTRO_DEV_CACHE_DIRS) {

        const dir = path.join(tmp, rel);

        mkdirSync(dir, {recursive: true});
        writeFileSync(path.join(dir, 'stale.json'), '{"stale":true}');

    }

    cleanAstroCache(tmp);

    for (const rel of ASTRO_DEV_CACHE_DIRS) {

        assert.equal(existsSync(path.join(tmp, rel)), false);

    }

});

test('cleanAstroCache is a no-op when cache dirs are missing', (assert) => {

    const tmp = path.join(os.tmpdir(), `callspec-astro-cache-empty-${Date.now()}`);

    mkdirSync(tmp, {recursive: true});
    cleanAstroCache(tmp);
    assert.equal(existsSync(tmp), true);

});

test('astro:dev and astro:build wipe compiler caches after the port check', (assert) => {

    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    const prefix = 'node scripts/assert-astro-dev-free.mjs && node scripts/clean-astro-cache.mjs &&';

    assert.equal(pkg.scripts['astro:dev'].startsWith(prefix), true);
    assert.equal(pkg.scripts['astro:build'].startsWith(prefix), true);

});

test('astro dev server sends Cache-Control: no-store', (assert) => {

    const astro = readFileSync(path.join(root, 'astro.config.mjs'), 'utf8');

    assert.equal(astro.includes("'Cache-Control': 'no-store'"), true);
    assert.equal(astro.includes('server:'), true);

});
