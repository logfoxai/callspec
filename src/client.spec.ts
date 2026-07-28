import fs from 'fs';
import path from 'path';
import {test} from 'kizu';
import {client, Non200Response} from './client';

test('client bundle is fetch-only (no node server imports)', (assert) => {

    const file = path.join(process.cwd(), 'dist/client.js');
    const js = fs.readFileSync(file, 'utf8');

    assert.equal(/\brequire\(['"](?:fs|http|https|path|node:|express)/.test(js), false);

});

test('client POSTs JSON to endpoint/method', async (assert) => {

    const calls: {url: string; init?: RequestInit}[] = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (input, init) => {

        calls.push({url: String(input), init});

        return new Response(JSON.stringify({ok: true}), {
            status: 200,
            headers: {'Content-Type': 'application/json'},
        });

    }) as typeof fetch;

    try {

        const result = await client('healthcheck', {}, {endpoint: 'https://api.test/v1'});

        assert.equal(calls[0]?.url, 'https://api.test/v1/healthcheck');
        assert.equal(calls[0]?.init?.method, 'POST');
        assert.equal(result, {ok: true});

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('client deserializes Date wire format', async (assert) => {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => new Response(JSON.stringify({
        at: {__type: 'Date', value: '2026-07-28T12:00:00.000Z'},
    }), {status: 200})) as typeof fetch;

    try {

        const result = await client('getTime', {}, {endpoint: 'https://api.test/v1'}) as {
            at: Date
        };

        assert.equal(result.at instanceof Date, true);
        assert.equal(result.at.toISOString(), '2026-07-28T12:00:00.000Z');

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('client throws Non200Response on plain-text error body', async (assert) => {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => new Response('Unauthorized', {
        status: 401,
    })) as typeof fetch;

    try {

        let thrown: unknown;

        try {

            await client('secret', {}, {endpoint: 'https://api.test/v1'});

        } catch (err) {

            thrown = err;

        }

        assert.equal(thrown instanceof Non200Response, true);

        if (thrown instanceof Non200Response) {

            assert.equal(thrown.status, 401);
            assert.equal(thrown.response, 'Unauthorized');

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('client merges fetchOptions headers without dropping Content-Type', async (assert) => {

    const calls: {init?: RequestInit}[] = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (_input, init) => {

        calls.push({init});

        return new Response(JSON.stringify({ok: true}), {status: 200});

    }) as typeof fetch;

    try {

        await client('healthcheck', {}, {
            endpoint: 'https://api.test/v1',
            fetchOptions: {
                headers: {Authorization: 'Bearer token'},
            },
        });

        const headers = calls[0]?.init?.headers;

        assert.equal(headers instanceof Headers, true);

        if (headers instanceof Headers) {

            assert.equal(headers.get('Content-Type'), 'application/json');
            assert.equal(headers.get('Authorization'), 'Bearer token');

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('client throws Non200Response on error status', async (assert) => {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => new Response(JSON.stringify({error: 'nope'}), {
        status: 401,
    })) as typeof fetch;

    try {

        let thrown: unknown;

        try {

            await client('secret', {}, {endpoint: 'https://api.test/v1'});

        } catch (err) {

            thrown = err;

        }

        assert.equal(thrown instanceof Non200Response, true);

        if (thrown instanceof Non200Response) {

            assert.equal(thrown.status, 401);
            assert.equal(thrown.response, {error: 'nope'});

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});
