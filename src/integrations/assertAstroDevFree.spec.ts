import {createServer} from 'node:net';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {ASTRO_DEV_PORT, ASTRO_DEV_PORT_MAX, assertAstroDevFree, astroDevPortsInUse, portInUse} from './assertAstroDevFree.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

function listen(port = 0): Promise<{port: number; close: () => Promise<void>}> {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => {
            const addr = server.address();
            if (!addr || typeof addr === 'string') {
                server.close();
                reject(new Error('expected TCP address'));
                return;
            }
            resolve({
                port: addr.port,
                close: () => new Promise((done, fail) => {
                    server.close((err) => (err ? fail(err) : done()));
                }),
            });
        });
    });
}

test('portInUse is true while a socket is listening', async (assert) => {
    const server = await listen();
    try {
        assert.equal(await portInUse(server.port), true);
    } finally {
        await server.close();
    }
});

test('portInUse is false after the socket closes', async (assert) => {
    const server = await listen();
    await server.close();
    assert.equal(await portInUse(server.port), false);
});

test('assertAstroDevFree throws when the port is taken', async (assert) => {
    const server = await listen();
    try {
        let message = '';
        try {
            await assertAstroDevFree(server.port);
        } catch (err) {
            message = err instanceof Error ? err.message : String(err);
        }
        assert.equal(message.includes(String(server.port)), true);
        assert.equal(message.includes('Astro dev appears to be running'), true);
    } finally {
        await server.close();
    }
});

test('assertAstroDevFree resolves when the port is free', async (assert) => {
    const server = await listen();
    const {port} = server;
    await server.close();
    await assertAstroDevFree(port);
    assert.equal(true, true);
});

test('astroDevPortsInUse finds listeners in the dev port range', async (assert) => {
    const server = await listen();
    try {
        assert.equal(await astroDevPortsInUse(server.port, server.port), [server.port]);
    } finally {
        await server.close();
    }
});

test('assertAstroDevFree scans the Astro fallback port range by default', async (assert) => {
    let server: {port: number; close: () => Promise<void>} | undefined;

    for (let port = ASTRO_DEV_PORT_MAX; port >= ASTRO_DEV_PORT; port--) {
        try {
            server = await listen(port);
            break;
        } catch {
            // try the next port in Astro's fallback range
        }
    }

    assert.equal(typeof server, 'object');

    try {
        let message = '';
        try {
            await assertAstroDevFree();
        } catch (err) {
            message = err instanceof Error ? err.message : String(err);
        }
        assert.equal(message.includes(String(server?.port)), true);
        assert.equal(message.includes('sidebar slugs'), true);
    } finally {
        await server?.close();
    }
});

test('astro:dev wipes compiler caches after the port check; astro:build does not', (assert) => {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    const devPrefix = 'node scripts/assert-astro-dev-free.mjs && node scripts/clean-astro-cache.mjs &&';
    const buildPrefix = 'node scripts/assert-astro-dev-free.mjs &&';

    assert.equal(pkg.scripts['astro:dev'].startsWith(devPrefix), true);
    assert.equal(pkg.scripts['astro:build'].startsWith(buildPrefix), true);
    assert.equal(pkg.scripts['astro:build'].includes('clean-astro-cache.mjs'), false);
    assert.equal(ASTRO_DEV_PORT, 4321);
    assert.equal(ASTRO_DEV_PORT_MAX, 4330);
});
