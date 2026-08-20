import {createServer} from 'node:net';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {ASTRO_DEV_PORT, assertAstroDevFree, portInUse} from './assertAstroDevFree.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

function listen(): Promise<{port: number; close: () => Promise<void>}> {
    return new Promise((resolve, reject) => {
        const server = createServer();
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
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
        assert.equal(message.includes('already running'), true);
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

test('astro:dev checks the port before wiping compiler caches', (assert) => {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    const prefix = 'node scripts/assert-astro-dev-free.mjs && node scripts/clean-astro-cache.mjs &&';
    assert.equal(pkg.scripts['astro:dev'].startsWith(prefix), true);
    assert.equal(pkg.scripts['astro:build'].startsWith(prefix), true);
    assert.equal(ASTRO_DEV_PORT, 4321);
});
