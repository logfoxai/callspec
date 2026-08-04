import fs from 'fs';
import path from 'path';
import {test} from 'kizu';
import {BUILTIN_ERROR, CLIENT_ERROR, CallspecClient, isCallspecOk, joinCallspecUrl} from './client';

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
            assert.equal(result.code, 'UNAUTHORIZED');

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('CallspecClient.callResult maps 401 plain message via status', async (assert) => {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => new Response('Bearer token required', {
        status: 401,
    })) as typeof fetch;

    try {

        const runtime = new CallspecClient({baseUrl: 'https://api.test/v1'});
        const result = await runtime.callResult('secret', {});

        assert.equal(result.ok, false);

        if (!result.ok) {

            assert.equal(result.status, 401);
            assert.equal(result.code, BUILTIN_ERROR.UNAUTHORIZED);

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

test('CallspecClient.callResult maps undeclared domain errors to UNKNOWN_ERROR', async (assert) => {

    const originalFetch = globalThis.fetch;
    const body = {error: 'USER_EXISTS', data: {email: 'taken@example.com'}};

    globalThis.fetch = (async () => new Response(JSON.stringify(body), {
        status: 409,
    })) as typeof fetch;

    try {

        const runtime = new CallspecClient({baseUrl: 'https://api.test/v1'});
        const result = await runtime.callResult('register', {});

        assert.equal(result.ok, false);

        if (!result.ok) {

            assert.equal(result.status, 409);
            assert.equal(result.code, CLIENT_ERROR.UNKNOWN_ERROR);

            if (result.code === CLIENT_ERROR.UNKNOWN_ERROR) {

                assert.equal(result.data.body, body);

            }

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('CallspecClient.callResult preserves declared domain error bodies', async (assert) => {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => new Response(JSON.stringify({
        error: 'USER_EXISTS',
        data: {email: 'taken@example.com'},
    }), {
        status: 409,
    })) as typeof fetch;

    try {

        const runtime = new CallspecClient({baseUrl: 'https://api.test/v1'});
        const result = await runtime.callResult('register', {}, {
            allowedErrorCodes: ['USER_EXISTS'],
            domainErrors: {
                USER_EXISTS: {
                    dataRequired: true,
                    data: {
                        type: 'object',
                        properties: {email: {type: 'string'}},
                        required: ['email'],
                    },
                },
            },
        });

        assert.equal(result.ok, false);

        if (!result.ok) {

            assert.equal(result.status, 409);
            assert.equal(result.code, 'USER_EXISTS');
            assert.equal((result as {data?: {email: string}}).data?.email, 'taken@example.com');

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('CallspecClient.callResult maps 502 HTML to SERVICE_UNAVAILABLE', async (assert) => {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => new Response('<html>502 Bad Gateway</html>', {
        status: 502,
    })) as typeof fetch;

    try {

        const runtime = new CallspecClient({baseUrl: 'https://api.test/v1'});
        const result = await runtime.callResult('register', {});

        assert.equal(result.ok, false);

        if (!result.ok) {

            assert.equal(result.status, 502);
            assert.equal(result.code, BUILTIN_ERROR.SERVICE_UNAVAILABLE);

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('CallspecClient.callResult maps unmapped 500 to UNKNOWN_ERROR with headers', async (assert) => {

    const originalFetch = globalThis.fetch;
    const body = '<html>something weird</html>';

    globalThis.fetch = (async () => new Response(body, {
        status: 500,
        headers: {'Server': 'nginx', 'Content-Type': 'text/html'},
    })) as typeof fetch;

    try {

        const runtime = new CallspecClient({baseUrl: 'https://api.test/v1'});
        const result = await runtime.callResult('register', {});

        assert.equal(result.ok, false);

        if (!result.ok) {

            assert.equal(result.status, 500);
            assert.equal(result.code, CLIENT_ERROR.UNKNOWN_ERROR);

            if (result.code === CLIENT_ERROR.UNKNOWN_ERROR) {

                assert.equal(result.data.body, body);
                assert.equal(result.data.headers?.server, 'nginx');

            }

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

            assert.equal(result.code, 'TOO_MANY_REQUESTS');

            if (result.code === 'TOO_MANY_REQUESTS') {

                assert.equal(result.data?.title, 'Slow down');
                assert.equal(result.data?.message, 'Try again later');

            }

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});

test('CallspecClient.callResult maps VALIDATION_ERROR wire errors to data', async (assert) => {

    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async () => new Response(JSON.stringify({
        error: 'VALIDATION_ERROR',
        errors: {email: 'required'},
    }), {
        status: 400,
    })) as typeof fetch;

    try {

        const runtime = new CallspecClient({baseUrl: 'https://api.test/v1'});
        const result = await runtime.callResult('register', {});

        assert.equal(result.ok, false);

        if (!result.ok) {

            assert.equal(result.code, 'VALIDATION_ERROR');
            assert.equal(result.data, {email: 'required'});

        }

    } finally {

        globalThis.fetch = originalFetch;

    }

});
