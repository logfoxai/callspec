import {test} from 'kizu';
import express from 'express';
import http from 'http';
import {predicates as p} from 'runtyp';
import {spec} from './defineSpec';
import {route} from './route';
import {mountSpec} from './mountSpec';
import {defineErrors} from './defineErrors';
import {callspecDocumentToUiSpec} from './callspec-ui/toUiSpec';
import {parseCallspecDocument} from './callspecDocument';

const routes = {

    healthcheck: route({
        input: p.object({}),
        output: p.string(),
        meta: {
            summary: 'Health check',
            description: 'Returns OK when the service is up.',
            tags: ['health'],
        },
        auth: 'none',
        handler: (_input, _ctx) => 'OK',
    }),

    echo: route({
        input: p.object({message: p.string()}),
        output: p.object({echo: p.string()}),
        meta: {
            summary: 'Echo message',
            description: 'Returns the input message.',
            tags: ['demo'],
        },
        auth: 'bearer',
        handler: (input: {message: string}, _ctx) => ({echo: input.message}),
    }),

    greet: route({
        input: p.object({name: p.string()}),
        output: p.object({hello: p.string()}),
        meta: {
            summary: 'Greet by name',
            description: 'Returns a hello payload.',
            tags: ['demo'],
        },
        auth: 'none',
        mcp: true,
        handler: (input: {name: string}, _ctx) => ({hello: input.name}),
    }),

};

const meta = {
    title: 'Fixture API',
    version: '1.0.0',
};

const authenticate = (token: string): {userId: string} | undefined => {

    if (token === 'test-token') {

        return {userId: 'test-user'};

    }

    return undefined;

};

const fixtureSpec = spec({
    meta,
    routes,
    authenticate,
});

function createTestApp(): http.Server {

    const app = express();
    const router = express.Router();

    mountSpec(router, fixtureSpec, {logging: false});

    app.use('/v1', router);

    return http.createServer(app);

}

async function withCustomMount(
    setup: (router: express.Router) => void,
    fn: (base: string) => Promise<void>,
): Promise<void> {

    const app = express();
    const router = express.Router();

    setup(router);
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') {

        throw new Error('expected server address');

    }

    const base = `http://127.0.0.1:${addr.port}/v1`;

    try {

        await fn(base);

    } finally {

        await closeServer(server);

    }

}

async function closeServer(server: http.Server): Promise<void> {

    server.closeAllConnections?.();
    await new Promise<void>((resolve, reject) => {

        server.close((err) => {

            if (err) reject(err);
            else resolve();

        });

    });

}

async function withServer(
    fn: (base: string) => Promise<void>,
): Promise<void> {

    const server = createTestApp();

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') {

        throw new Error('expected server address');

    }

    const base = `http://127.0.0.1:${addr.port}/v1`;

    try {

        await fn(base);

    } finally {

        await closeServer(server);

    }

}

test('integration: callspec.json lists all fixture routes', async (assert) => {

    await withServer(async (base) => {

        const res = await fetch(`${base}/callspec.json`);
        const doc = await res.json() as Record<string, unknown>;

        assert.equal(res.status, 200);
        assert.equal(doc.callspec, '2.0');
        assert.equal((doc.info as {title: string}).title, 'Fixture API');

        const spec = callspecDocumentToUiSpec(parseCallspecDocument(doc));

        assert.equal(spec.routes.length, 3);

        const greet = spec.routes.find((route) => route.name === 'greet');

        assert.equal(greet?.auth, 'none');
        assert.equal(greet?.mcp, true);

        const echo = spec.routes.find((route) => route.name === 'echo');

        assert.equal(echo?.auth, 'bearer');

    });

});

test('integration: docs UI loads callspec.json at custom docsPath', async (assert) => {

    const app = express();
    const router = express.Router();

    mountSpec(router, fixtureSpec, {docsPath: '/explorer', logging: false});
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('bad address');

    const origin = `http://127.0.0.1:${addr.port}`;

    try {

        const html = await fetch(`${origin}/v1/explorer/`).then((res) => res.text());

        assert.equal(html.includes('"specUrl":"../callspec.json"'), true);

        const specFromDocs = await fetch(new URL('../callspec.json', `${origin}/v1/explorer/`));

        assert.equal(specFromDocs.status, 200);
        assert.equal((await specFromDocs.json() as {info?: {title?: string}}).info?.title, 'Fixture API');

    } finally {

        await closeServer(server);

    }

});

test('integration: openapi.json lists all fixture routes', async (assert) => {

    await withServer(async (base) => {

        const res = await fetch(`${base}/openapi.json`);
        const doc = await res.json() as Record<string, unknown>;

        const paths = doc.paths as Record<string, unknown>;

        assert.equal(res.status, 200);
        assert.equal((doc.info as {title: string}).title, 'Fixture API');
        assert.equal(Object.keys(paths).length, 3);

    });

});

test('integration: callspec UI at /docs', async (assert) => {

    await withServer(async (base) => {

        const res = await fetch(`${base}/docs/`);
        const html = await res.text();

        assert.equal(res.status, 200);
        assert.equal(res.headers.get('content-type')?.includes('text/html'), true);
        assert.equal(html.includes('window.__CALLSPEC_UI__='), true);
        assert.equal(html.includes('"specUrl":"../callspec.json"'), true);

        const specFromDocs = await fetch(new URL('../callspec.json', `${base}/docs/`));

        assert.equal(specFromDocs.status, 200);
        assert.equal((await specFromDocs.json() as {callspec?: string}).callspec, '2.0');
        assert.equal(/src="\.\/assets\/app\.[a-f0-9]{8}\.js"/.test(html), true);
        assert.equal(html.includes('type="module"'), false);
        assert.equal(html.includes('Powered by'), true);
        assert.equal(html.includes('footer-label'), true);
        assert.equal(html.includes('callspec'), true);
        assert.equal(res.headers.get('cache-control'), 'no-cache');

        const jsMatch = html.match(/src="\.\/assets\/(app\.[a-f0-9]{8}\.js)"/);
        const jsName = jsMatch?.[1];

        assert.equal(typeof jsName, 'string');

        const asset = await fetch(`${base}/docs/assets/${jsName}`);

        assert.equal(asset.status, 200);
        assert.equal(asset.headers.get('content-type')?.includes('javascript'), true);
        assert.equal(asset.headers.get('cache-control'), 'public, max-age=31536000, immutable');

        const bare = await fetch(`${base}/docs`, {redirect: 'manual'});

        assert.equal(bare.status, 301);

    });

});

test('integration: docs UI loads callspec.json when mountSpec uses basePath', async (assert) => {

    const app = express();
    const router = express.Router();

    mountSpec(router, fixtureSpec, {basePath: '/v1', logging: false});
    app.use(router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('bad address');

    const origin = `http://127.0.0.1:${addr.port}`;

    try {

        const html = await fetch(`${origin}/v1/docs/`).then((res) => res.text());

        assert.equal(html.includes('"specUrl":"../callspec.json"'), true);

        const specFromDocs = await fetch(new URL('../callspec.json', `${origin}/v1/docs/`));

        assert.equal(specFromDocs.status, 200);
        assert.equal((await specFromDocs.json() as {info?: {title?: string}}).info?.title, 'Fixture API');

    } finally {

        await closeServer(server);

    }

});

test('integration: public RPC works without auth', async (assert) => {

    await withServer(async (base) => {

        const health = await fetch(`${base}/healthcheck`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: '{}',
        });

        assert.equal(health.status, 200);
        assert.equal(await health.text(), '"OK"');

        const greet = await fetch(`${base}/greet`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: 'world'}),
        });

        assert.equal(greet.status, 200);
        assert.equal(await greet.json(), {hello: 'world'});

    });

});

test('integration: private RPC returns 401 without auth', async (assert) => {

    await withServer(async (base) => {

        const res = await fetch(`${base}/echo`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message: 'hi'}),
        });

        assert.equal(res.status, 401);
        assert.equal(await res.json(), {error: 'UNAUTHORIZED'});

    });

});

test('integration: private RPC returns 401 without Bearer before authenticate', async (assert) => {

    await withServer(async (base) => {

        const res = await fetch(`${base}/echo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Basic not-bearer',
            },
            body: JSON.stringify({message: 'hi'}),
        });

        assert.equal(res.status, 401);
        assert.equal(await res.json(), {error: 'UNAUTHORIZED'});

    });

});

test('integration: private RPC works with auth', async (assert) => {

    await withServer(async (base) => {

        const res = await fetch(`${base}/echo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer test-token',
            },
            body: JSON.stringify({message: 'hi'}),
        });

        assert.equal(res.status, 200);
        assert.equal(await res.json(), {echo: 'hi'});

    });

});

test('integration: validation error on bad input', async (assert) => {

    await withServer(async (base) => {

        const res = await fetch(`${base}/greet`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: 123}),
        });

        assert.equal(res.status, 400);

    });

});

test('integration: mountSpec parses JSON without a host express.json()', async (assert) => {

    await withCustomMount((router) => {

        mountSpec(router, fixtureSpec, {logging: false});

    }, async (base) => {

        const res = await fetch(`${base}/greet`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: 'world'}),
        });

        assert.equal(res.status, 200);
        assert.equal(await res.json(), {hello: 'world'});

    });

});

test('integration: malformed JSON is VALIDATION_ERROR and is not logged as unhandled', async (assert) => {

    let logged: unknown;

    await withCustomMount((router) => {

        mountSpec(router, fixtureSpec, {
            logging: false,
            logUnhandledError: (err) => {

                logged = err;

            },
        });

    }, async (base) => {

        const res = await fetch(`${base}/greet`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: '{not json',
        });

        assert.equal(res.status, 400);
        assert.equal(await res.json(), {
            error: 'VALIDATION_ERROR',
            errors: {body: 'Malformed JSON'},
        });
        assert.equal(logged, undefined);

    });

});

test('integration: json false uses a host parser and does not map parse errors', async (assert) => {

    await withCustomMount((router) => {

        router.use(express.json());
        mountSpec(router, fixtureSpec, {logging: false, json: false});

    }, async (base) => {

        const ok = await fetch(`${base}/greet`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: 'world'}),
        });

        assert.equal(ok.status, 200);
        assert.equal(await ok.json(), {hello: 'world'});

        const bad = await fetch(`${base}/greet`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: '{not json',
        });

        const raw = await bad.text();
        let parsed: {error?: string, errors?: {body?: string}} = {};

        try {

            parsed = JSON.parse(raw) as {error?: string, errors?: {body?: string}};

        } catch {

            parsed = {};

        }

        assert.equal(
            parsed.error === 'VALIDATION_ERROR' && parsed.errors?.body === 'Malformed JSON',
            false,
        );

    });

});

test('integration: json limit is passed through to express.json', async (assert) => {

    await withCustomMount((router) => {

        mountSpec(router, fixtureSpec, {logging: false, json: {limit: 20}});

    }, async (base) => {

        const res = await fetch(`${base}/greet`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: 'x'.repeat(100)}),
        });

        assert.equal(res.status, 413);

    });

});

test('integration: unknown RPC route returns ROUTE_NOT_FOUND', async (assert) => {

    await withServer(async (base) => {

        const res = await fetch(`${base}/doesNotExist`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({}),
        });

        assert.equal(res.status, 404);
        assert.equal(await res.json(), {error: 'ROUTE_NOT_FOUND', data: {route: 'doesNotExist'}});

    });

});

test('integration: unhandled handler error returns INTERNAL_ERROR', async (assert) => {

    const api = spec({
        meta: {title: 'Boom API', version: '1.0.0'},
        routes: {
            boom: route({
                input: p.object({}),
                output: p.string(),
                meta: {summary: 'Boom', description: 'Boom', tags: ['x']},
                auth: 'none',
                handler: async (_input, _ctx) => {

                    throw new Error('boom');

                },
            }),
        },
    });

    const app = express();
    const router = express.Router();

    mountSpec(router, api, {logging: false});
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('expected server address');

    try {

        const res = await fetch(`http://127.0.0.1:${addr.port}/v1/boom`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({}),
        });

        assert.equal(res.status, 500);
        assert.equal(await res.json(), {error: 'INTERNAL_ERROR'});

    } finally {

        await closeServer(server);

    }

});

test('integration: unhandled rejected promise returns INTERNAL_ERROR', async (assert) => {

    const api = spec({
        meta: {title: 'Reject API', version: '1.0.0'},
        routes: {
            reject: route({
                input: p.object({}),
                output: p.string(),
                meta: {summary: 'Reject', description: 'Reject', tags: ['x']},
                auth: 'none',
                handler: async (_input, _ctx) => Promise.reject(new Error('reject')),
            }),
        },
    });

    const app = express();
    const router = express.Router();

    mountSpec(router, api, {logging: false});
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('expected server address');

    try {

        const res = await fetch(`http://127.0.0.1:${addr.port}/v1/reject`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({}),
        });

        assert.equal(res.status, 500);
        assert.equal(await res.json(), {error: 'INTERNAL_ERROR'});

    } finally {

        await closeServer(server);

    }

});

test('integration: MCP unhandled throw does not leak Error.message', async (assert) => {

    const api = spec({
        meta: {title: 'MCP Boom', version: '1.0.0'},
        routes: {
            mcpBoom: route({
                input: p.object({}),
                output: p.string(),
                meta: {summary: 'Boom', description: 'Boom', tags: ['x']},
                auth: 'none',
                mcp: true,
                handler: async (_input, _ctx) => {

                    throw new Error('secret db connection string leaked');

                },
            }),
        },
    });

    const app = express();
    const router = express.Router();

    mountSpec(router, api, {logging: false});
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('expected server address');

    try {

        const res = await fetch(`http://127.0.0.1:${addr.port}/v1/mcp`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 9,
                method: 'tools/call',
                params: {name: 'mcpBoom', arguments: {}},
            }),
        });

        assert.equal(res.status, 500);

        const body = await res.json() as {error?: {message?: string}};
        const message = body.error?.message ?? '';

        assert.equal(message.includes('secret'), false);
        assert.equal(message.includes('db connection'), false);
        assert.equal(message, 'Internal error');

    } finally {

        await closeServer(server);

    }

});

test('integration: handleUnhandledError maps throw to wire failure', async (assert) => {

    const api = spec({
        meta: {title: 'Hook API', version: '1.0.0'},
        routes: {
            timeout: route({
                input: p.object({}),
                output: p.string(),
                meta: {summary: 'Timeout', description: 'Timeout', tags: ['x']},
                auth: 'none',
                handler: async (_input, _ctx) => {

                    const err = new Error('canceling statement due to statement timeout') as Error & {code: string};
                    err.code = '57014';
                    throw err;

                },
            }),
        },
    });

    const app = express();
    const router = express.Router();

    mountSpec(router, api, {
        logging: false,
        handleUnhandledError: (err) => {

            if (typeof err === 'object' && err !== null && (err as {code?: string}).code === '57014') {

                return {
                    ok: false,
                    code: 'SERVICE_UNAVAILABLE',
                    status: 503,
                    data: {message: 'The request took too long to process. Please try again.'},
                };

            }

        },
    });
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('expected server address');

    try {

        const res = await fetch(`http://127.0.0.1:${addr.port}/v1/timeout`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({}),
        });

        assert.equal(res.status, 503);
        assert.equal(await res.json(), {
            error: 'SERVICE_UNAVAILABLE',
            data: {message: 'The request took too long to process. Please try again.'},
        });

    } finally {

        await closeServer(server);

    }

});

test('integration: logUnhandledError is called for unhandled handler errors', async (assert) => {

    let logged: unknown;

    const api = spec({
        meta: {title: 'Log API', version: '1.0.0'},
        routes: {
            boom: route({
                input: p.object({}),
                output: p.string(),
                meta: {summary: 'Boom', description: 'Boom', tags: ['x']},
                auth: 'none',
                handler: async (_input, _ctx) => {

                    throw new Error('logged boom');

                },
            }),
        },
    });

    const app = express();
    const router = express.Router();

    mountSpec(router, api, {
        logging: false,
        logUnhandledError: (err) => {

            logged = err;

        },
    });
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('expected server address');

    try {

        const res = await fetch(`http://127.0.0.1:${addr.port}/v1/boom`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({}),
        });

        assert.equal(res.status, 500);
        assert.equal(await res.json(), {error: 'INTERNAL_ERROR'});
        assert.equal(logged instanceof Error, true);
        assert.equal((logged as Error).message, 'logged boom');

    } finally {

        await closeServer(server);

    }

});

test('integration: declared route errors map to HTTP status and body', async (assert) => {

    const err = defineErrors({
        USER_EXISTS: {data: p.object({email: p.string()})},
    });

    const api = spec({
        meta: {title: 'Errors API', version: '1.0.0'},
        routes: {
            getUser: route({
                input: p.object({email: p.string()}),
                output: p.object({email: p.string()}),
                errors: err,
                meta: {
                    summary: 'Get user',
                    description: 'Looks up a user by email',
                    tags: ['users'],
                },
                auth: 'none',
                handler: (input: {email: string}, _ctx: unknown) => {

                    if (input.email === 'missing@example.com') {

                        return err.NOT_FOUND();

                    }

                    if (input.email === 'taken@example.com') {

                        return err.USER_EXISTS({email: input.email});

                    }

                    return {email: input.email};

                },
            }),
        },
    });

    const app = express();
    const router = express.Router();

    mountSpec(router, api, {logging: false});
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('bad address');

    const base = `http://127.0.0.1:${addr.port}/v1`;

    try {

        const notFound = await fetch(`${base}/getUser`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: 'missing@example.com'}),
        });

        assert.equal(notFound.status, 404);
        assert.equal(await notFound.json(), {error: 'NOT_FOUND'});

        const exists = await fetch(`${base}/getUser`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: 'taken@example.com'}),
        });

        assert.equal(exists.status, 400);
        assert.equal(await exists.json(), {error: 'USER_EXISTS', data: {email: 'taken@example.com'}});

        const ok = await fetch(`${base}/getUser`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: 'ok@example.com'}),
        });

        assert.equal(ok.status, 200);
        assert.equal(await ok.json(), {email: 'ok@example.com'});

        const doc = await fetch(`${base}/callspec.json`);
        const parsed = await doc.json() as {routes: {getUser: {errors?: Record<string, {status: number}>}}};

        assert.equal(parsed.routes.getUser.errors?.NOT_FOUND?.status, 404);
        assert.equal(parsed.routes.getUser.errors?.USER_EXISTS?.status, 400);

    } finally {

        await closeServer(server);

    }

});

test('integration: declared domain failure is returned on the wire', async (assert) => {

    const domainErr = defineErrors({
        MYSTERY: {status: 418},
    });

    const api = spec({
        meta: {title: 'Strict API', version: '1.0.0'},
        routes: {
            boom: route({
                input: p.object({}),
                output: p.string(),
                errors: domainErr,
                meta: {
                    summary: 'Boom',
                    description: 'Returns declared domain error',
                    tags: ['test'],
                },
                auth: 'none',
                handler: (_input, _ctx) => domainErr.MYSTERY(),
            }),
        },
    });

    const app = express();
    const router = express.Router();

    mountSpec(router, api, {logging: false});
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('bad address');

    try {

        const res = await fetch(`http://127.0.0.1:${addr.port}/v1/boom`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({}),
        });

        assert.equal(res.status, 418);
        assert.equal(await res.json(), {error: 'MYSTERY'});

    } finally {

        await closeServer(server);

    }

});

test('integration: MCP auto-mounts from mountSpec when routes opt in', async (assert) => {

    await withServer(async (base) => {

        const list = await fetch(`${base}/mcp`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/list'}),
        });

        assert.equal(list.status, 200);

        const body = await list.json() as {result: {tools: Array<{name: string}>}};

        assert.equal(body.result.tools.some((tool) => tool.name === 'greet'), true);
        assert.equal(body.result.tools.some((tool) => tool.name === 'echo'), false);

    });

});

test('integration: MCP tools/call uses spec.authenticate', async (assert) => {

    await withServer(async (base) => {

        const res = await fetch(`${base}/mcp`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'tools/call',
                params: {name: 'greet', arguments: {name: 'callspec'}},
            }),
        });

        assert.equal(res.status, 200);

        const body = await res.json() as {result: {structuredContent: {hello: string}}};

        assert.equal(body.result.structuredContent.hello, 'callspec');

    });

});

test('integration: MCP tools/call emits structured onCall events', async (assert) => {

    const events: Array<{surface: string, route: string, outcome: string}> = [];

    const api = spec({
        meta: {title: 'Call log API', version: '1.0.0'},
        routes: {
            greet: route({
                input: p.object({name: p.string()}),
                output: p.object({hello: p.string()}),
                meta: {summary: 'Greet', description: 'Greet', tags: ['mcp']},
                auth: 'none',
                mcp: true,
                handler: (input, _ctx) => ({hello: input.name}),
            }),
        },
    });

    const app = express();
    const router = express.Router();

    mountSpec(router, api, {
        logging: false,
        onCall: (event) => {
            events.push({surface: event.surface, route: event.route, outcome: event.outcome});
        },
    });
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('bad address');

    try {

        const res = await fetch(`http://127.0.0.1:${addr.port}/v1/mcp`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: {name: 'greet', arguments: {name: 'callspec'}},
            }),
        });

        assert.equal(res.status, 200);
        assert.equal(events, [{surface: 'mcp', route: 'greet', outcome: 'ok'}]);

    } finally {

        await closeServer(server);

    }

});

test('integration: no MCP when routes do not opt in', async (assert) => {

    const noMcpSpec = spec({
        meta: {
            title: 'No MCP',
            version: '0.0.1',
        },
        routes: {
            ping: route({
                input: p.object({}),
                output: p.string(),
                meta: {summary: 'Ping', description: 'Ping', tags: ['health']},
                auth: 'none',
                handler: (_input, _ctx) => 'pong',
            }),
        },
    });

    const app = express();
    const router = express.Router();

    mountSpec(router, noMcpSpec, {logging: false});

    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('bad address');

    try {

        const res = await fetch(`http://127.0.0.1:${addr.port}/v1/mcp`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/list'}),
        });

        assert.equal(res.status, 404);

    } finally {

        await closeServer(server);

    }

});

test('integration: docs disabled mounts none of the spec surfaces', async (assert) => {

    const app = express();
    const router = express.Router();

    mountSpec(router, fixtureSpec, {docs: false, logging: false});

    app.use(router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('bad address');

    const origin = `http://127.0.0.1:${addr.port}`;

    try {

        const callspec = await fetch(`${origin}/callspec.json`);
        const openApi = await fetch(`${origin}/openapi.json`);
        const docs = await fetch(`${origin}/docs`);

        assert.equal(callspec.status, 404);
        assert.equal(openApi.status, 404);
        assert.equal(docs.status, 404);

    } finally {

        await closeServer(server);

    }

});

test('integration: default meta title and version when omitted', async (assert) => {

    const sparseSpec = spec({
        routes: {
            ping: route({
                input: p.object({}),
                output: p.string(),
                meta: {summary: 'Ping', description: 'Ping', tags: ['health']},
                auth: 'none',
                handler: (_input, _ctx) => 'pong',
            }),
        },
    });

    const app = express();
    const router = express.Router();

    mountSpec(router, sparseSpec, {logging: false});

    app.use(router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('bad address');

    const origin = `http://127.0.0.1:${addr.port}`;

    try {

        const res = await fetch(`${origin}/callspec.json`);
        const doc = parseCallspecDocument(await res.json());

        assert.equal(res.status, 200);
        assert.equal(doc.info.title, 'Callspec API');
        assert.equal(doc.info.version, '0.0.0');

    } finally {

        await closeServer(server);

    }

});

test('integration: visibility public omits private routes from contracts; all includes them', async (assert) => {

    const visibilitySpec = spec({
        meta: {title: 'Visibility API', version: '1.0.0'},
        routes: {
            ping: route({
                input: p.object({}),
                output: p.object({ok: p.boolean()}),
                meta: {summary: 'Ping', tags: ['health']},
                auth: 'none',
                mcp: true,
                handler: async (_input, _ctx) => ({ok: true}),
            }),
            purgeCache: route({
                input: p.object({key: p.string()}),
                output: p.object({ok: p.boolean()}),
                meta: {summary: 'Purge cache', tags: ['ops']},
                auth: 'none',
                scope: 'private',
                mcp: true,
                handler: async (_input, _ctx) => ({ok: true}),
            }),
        },
    });

    async function listenWithVisibility(visibility?: 'public' | 'all'): Promise<{
        origin: string
        server: http.Server
    }> {

        const app = express();
        const router = express.Router();

        mountSpec(router, visibilitySpec, {logging: false, visibility});
        app.use(router);

        const server = http.createServer(app);

        await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

        const addr = server.address();

        if (!addr || typeof addr === 'string') throw new Error('bad address');

        return {origin: `http://127.0.0.1:${addr.port}`, server};

    }

    const publicMount = await listenWithVisibility();

    try {

        const callspec = parseCallspecDocument(await (await fetch(`${publicMount.origin}/callspec.json`)).json());
        const openApi = await (await fetch(`${publicMount.origin}/openapi.json`)).json() as {
            paths: Record<string, unknown>
        };
        const mcp = await (await fetch(`${publicMount.origin}/mcp`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/list'}),
        })).json() as {result?: {tools?: Array<{name: string}>}};

        assert.equal(Object.keys(callspec.routes).join(','), 'ping');
        assert.equal(Object.keys(openApi.paths).sort().join(','), '/ping');
        assert.equal((mcp.result?.tools ?? []).map((tool) => tool.name).join(','), 'ping');

    } finally {

        await closeServer(publicMount.server);

    }

    const allMount = await listenWithVisibility('all');

    try {

        const callspec = parseCallspecDocument(await (await fetch(`${allMount.origin}/callspec.json`)).json());
        const openApi = await (await fetch(`${allMount.origin}/openapi.json`)).json() as {
            paths: Record<string, unknown>
        };
        const mcp = await (await fetch(`${allMount.origin}/mcp`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({jsonrpc: '2.0', id: 1, method: 'tools/list'}),
        })).json() as {result?: {tools?: Array<{name: string}>}};

        assert.equal(Object.keys(callspec.routes).sort().join(','), 'ping,purgeCache');
        assert.equal(callspec.routes.purgeCache.scope, 'private');
        assert.equal(Object.keys(openApi.paths).sort().join(','), '/ping,/purgeCache');
        assert.equal(
            (mcp.result?.tools ?? []).map((tool) => tool.name).sort().join(','),
            'ping,purgeCache',
        );

    } finally {

        await closeServer(allMount.server);

    }

});

test('integration: omitted input accepts {} and no body, rejects extra keys', async (assert) => {

    const api = spec({
        meta: {title: 'Empty Input API', version: '1.0.0'},
        routes: {
            whoami: route({
                output: p.object({userId: p.string()}),
                meta: {summary: 'Whoami', tags: ['auth']},
                auth: 'none',
                handler: async (_input, _ctx) => ({userId: 'u1'}),
            }),
        },
    });

    const app = express();
    const router = express.Router();

    router.use(express.json());
    mountSpec(router, api, {logging: false});
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('expected server address');

    const base = `http://127.0.0.1:${addr.port}/v1`;

    try {

        const empty = await fetch(`${base}/whoami`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: '{}',
        });

        assert.equal(empty.status, 200);
        assert.equal(await empty.json(), {userId: 'u1'});

        const noBody = await fetch(`${base}/whoami`, {method: 'POST'});

        assert.equal(noBody.status, 200);
        assert.equal(await noBody.json(), {userId: 'u1'});

        const extra = await fetch(`${base}/whoami`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({extra: 1}),
        });

        assert.equal(extra.status, 400);
        assert.equal((await extra.json() as {error?: string}).error, 'VALIDATION_ERROR');

        const doc = await (await fetch(`${base}/callspec.json`)).json() as {
            routes: {whoami: {input: {type?: string, additionalProperties?: boolean}}}
        };

        assert.equal(doc.routes.whoami.input.type, 'object');
        assert.equal(doc.routes.whoami.input.additionalProperties, false);

    } finally {

        await closeServer(server);

    }

});

test('integration: omitted output is HTTP 200 null and MCP structured null', async (assert) => {

    const api = spec({
        meta: {title: 'Void API', version: '1.0.0'},
        routes: {
            logout: route({
                meta: {summary: 'Logout', tags: ['auth']},
                auth: 'none',
                mcp: true,
                handler: async (_input, _ctx) => undefined,
            }),
        },
    });

    const app = express();
    const router = express.Router();

    router.use(express.json());
    mountSpec(router, api, {logging: false});
    app.use('/v1', router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('expected server address');

    const base = `http://127.0.0.1:${addr.port}/v1`;

    try {

        const res = await fetch(`${base}/logout`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: '{}',
        });

        assert.equal(res.status, 200);
        assert.equal(await res.text(), 'null');

        const openApi = await (await fetch(`${base}/openapi.json`)).json() as {
            paths: Record<string, {
                post?: {responses?: {'200'?: {content?: {'application/json'?: {schema?: unknown}}}}}
            }>
        };
        const successSchema = openApi.paths['/logout']?.post?.responses?.['200']
            ?.content?.['application/json']?.schema;

        assert.equal(JSON.stringify(successSchema), JSON.stringify({type: 'null'}));

        const mcp = await fetch(`${base}/mcp`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: {name: 'logout', arguments: {}},
            }),
        });
        const mcpBody = await mcp.json() as {result: {structuredContent: unknown}};

        assert.equal(mcpBody.result.structuredContent, null);

    } finally {

        await closeServer(server);

    }

});
