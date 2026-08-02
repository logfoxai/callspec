import fs from 'fs';
import path from 'path';
import {test} from 'kizu';
import {CallspecClient, isCallspecOk, joinCallspecUrl} from './client';

test('client bundle is fetch-only (no node server imports)', (assert) => {

    const file = path.join(process.cwd(), 'dist/client.js');
    const js = fs.readFileSync(file, 'utf8');

    assert.equal(/\brequire\(['"](?:fs|http|https|path|node:|express)/.test(js), false);

});

test('CallspecClient POSTs JSON to endpoint/method', async (assert) => {

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

        const runtime = new CallspecClient({baseUrl: 'https://api.test/v1'});
        const result = await runtime.callResult<{ok: boolean}>('healthcheck', {});

        assert.equal(calls[0]?.url, 'https://api.test/v1/healthcheck');
        assert.equal(calls[0]?.init?.method, 'POST');
        assert.equal(isCallspecOk(result), true);

        if (result.ok) {

            assert.equal(result.value, {ok: true});

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('CallspecClient deserializes Date wire format', async (assert) => {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => new Response(JSON.stringify({
        at: {__type: 'Date', value: '2026-07-28T12:00:00.000Z'},
    }), {status: 200})) as typeof fetch;

    try {

        const runtime = new CallspecClient({baseUrl: 'https://api.test/v1'});
        const result = await runtime.callResult<{at: Date}>('getTime', {});

        assert.equal(isCallspecOk(result), true);

        if (result.ok) {

            assert.equal(result.value.at instanceof Date, true);
            assert.equal(result.value.at.toISOString(), '2026-07-28T12:00:00.000Z');

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('joinCallspecUrl avoids double slashes', (assert) => {

    assert.equal(joinCallspecUrl('https://api.test/v1/', 'healthcheck'), 'https://api.test/v1/healthcheck');

});

test('CallspecClient.callResult returns typed error bodies', async (assert) => {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => new Response('Unauthorized', {
        status: 401,
    })) as typeof fetch;

    try {

        const runtime = new CallspecClient({baseUrl: 'https://api.test/v1'});
        const result = await runtime.callResult('secret', {});

        assert.equal(result.ok, false);

        if (!result.ok) {

            assert.equal(result.status, 401);
            assert.equal(result.error.error, 'UNAUTHORIZED');

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('CallspecClient merges fetchOptions headers without dropping Content-Type', async (assert) => {

    const calls: {init?: RequestInit}[] = [];
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (_input, init) => {

        calls.push({init});

        return new Response(JSON.stringify({ok: true}), {status: 200});

    }) as typeof fetch;

    try {

        const runtime = new CallspecClient({
            baseUrl: 'https://api.test/v1',
            headers: {Authorization: 'Bearer token'},
        });

        await runtime.callResult('healthcheck', {});

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

test('CallspecClient.callResult preserves unknown domain error bodies', async (assert) => {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => new Response(JSON.stringify({
        error: 'USER_EXISTS',
        data: {email: 'taken@example.com'},
    }), {
        status: 409,
    })) as typeof fetch;

    try {

        const runtime = new CallspecClient({baseUrl: 'https://api.test/v1'});
        const result = await runtime.callResult('register', {});

        assert.equal(result.ok, false);

        if (!result.ok) {

            assert.equal(result.status, 409);
            assert.equal(result.error.error, 'USER_EXISTS');
            assert.equal((result.error as {data?: {email: string}}).data?.email, 'taken@example.com');

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('CallspecClient.callResult normalizes legacy 429 bodies', async (assert) => {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => new Response(JSON.stringify({
        title: 'Slow down',
        message: 'Try again later',
    }), {
        status: 429,
    })) as typeof fetch;

    try {

        const runtime = new CallspecClient({baseUrl: 'https://api.test/v1'});
        const result = await runtime.callResult('createUserSession', {});

        assert.equal(result.ok, false);

        if (!result.ok) {

            assert.equal(result.error.error, 'TOO_MANY_REQUESTS');

            if (result.error.error === 'TOO_MANY_REQUESTS') {

                assert.equal(result.error.data.title, 'Slow down');
                assert.equal(result.error.data.message, 'Try again later');

            }

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});
