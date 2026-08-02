import {test} from 'kizu';
import express from 'express';
import http from 'http';
import {predicates as p} from 'runtyp';
import {defineSpec} from './defineSpec';
import {defineRoute} from './defineRoute';
import {mountSpec} from './mountSpec';
import {defineErrors} from './defineErrors';
import {callspecDocumentToUiSpec} from './callspec-ui/toUiSpec';
import {parseCallspecDocument} from './callspecDocument';

const routes = {

    healthcheck: defineRoute({
        input: p.object({}),
        output: p.string(),
        meta: {
            summary: 'Health check',
            description: 'Returns OK when the service is up.',
            tags: ['health'],
        },
        access: 'public',
        handler: (_input, _ctx) => 'OK',
    }),

    echo: defineRoute({
        input: p.object({message: p.string()}),
        output: p.object({echo: p.string()}),
        meta: {
            summary: 'Echo message',
            description: 'Returns the input message.',
            tags: ['demo'],
        },
        access: 'private',
        handler: (input: {message: string}, _ctx) => ({echo: input.message}),
    }),

    greet: defineRoute({
        input: p.object({name: p.string()}),
        output: p.object({hello: p.string()}),
        meta: {
            summary: 'Greet by name',
            description: 'Returns a hello payload.',
            tags: ['demo'],
        },
        access: 'public',
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

const fixtureSpec = defineSpec({
    meta,
    routes,
    authenticate,
});

function createTestApp(): http.Server {

    const app = express();
    const router = express.Router();

    router.use(express.json());

    mountSpec(router, fixtureSpec);

    app.use('/v1', router);

    return http.createServer(app);

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
        assert.equal(doc.callspec, '1.0');
        assert.equal((doc.info as {title: string}).title, 'Fixture API');

        const spec = callspecDocumentToUiSpec(parseCallspecDocument(doc));

        assert.equal(spec.routes.length, 3);

        const greet = spec.routes.find((route) => route.name === 'greet');

        assert.equal(greet?.access, 'public');
        assert.equal(greet?.mcp, true);

        const echo = spec.routes.find((route) => route.name === 'echo');

        assert.equal(echo?.access, 'private');

    });

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
        assert.equal((await specFromDocs.json() as {callspec?: string}).callspec, '1.0');
        assert.equal(html.includes('src="./assets/app.js"'), true);
        assert.equal(html.includes('type="module"'), false);
        assert.equal(html.includes('Powered by'), true);
        assert.equal(html.includes('class="footer-link"'), true);
        assert.equal(html.includes('callspec'), true);

        const asset = await fetch(`${base}/docs/assets/app.js`);

        assert.equal(asset.status, 200);
        assert.equal(asset.headers.get('content-type')?.includes('javascript'), true);

        const bare = await fetch(`${base}/docs`, {redirect: 'manual'});

        assert.equal(bare.status, 301);

    });

});

test('integration: docs UI loads callspec.json when mountSpec uses basePath', async (assert) => {

    const app = express();
    const router = express.Router();

    router.use(express.json());
    mountSpec(router, fixtureSpec, {basePath: '/v1'});
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

    const spec = defineSpec({
        meta: {title: 'Boom API', version: '1.0.0'},
        routes: {
            boom: defineRoute({
                input: p.object({}),
                output: p.string(),
                meta: {summary: 'Boom', description: 'Boom', tags: ['x']},
                access: 'public',
                handler: async (_input, _ctx) => {

                    throw new Error('boom');

                },
            }),
        },
    });

    const app = express();
    const router = express.Router();

    router.use(express.json());
    mountSpec(router, spec);
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

test('integration: declared route errors map to HTTP status and body', async (assert) => {

    const err = defineErrors({
        USER_EXISTS: {data: p.object({email: p.string()})},
    });

    const spec = defineSpec({
        meta: {title: 'Errors API', version: '1.0.0'},
        routes: {
            getUser: defineRoute({
                input: p.object({email: p.string()}),
                output: p.object({email: p.string()}),
                errors: err,
                meta: {
                    summary: 'Get user',
                    description: 'Looks up a user by email',
                    tags: ['users'],
                },
                access: 'public',
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

    router.use(express.json());
    mountSpec(router, spec);
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

test('integration: undeclared domain errors become INTERNAL_ERROR', async (assert) => {

    const thrower = defineErrors({
        MYSTERY: {status: 418},
    });

    const spec = defineSpec({
        meta: {title: 'Strict API', version: '1.0.0'},
        routes: {
            boom: defineRoute({
                input: p.object({}),
                output: p.string(),
                meta: {
                    summary: 'Boom',
                    description: 'Throws undeclared domain error',
                    tags: ['test'],
                },
                access: 'public',
                handler: (_input, _ctx) => {

                    return thrower.MYSTERY();

                },
            }),
        },
    });

    const app = express();
    const router = express.Router();

    router.use(express.json());
    mountSpec(router, spec);
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

        assert.equal(res.status, 500);
        assert.equal(await res.json(), {error: 'INTERNAL_ERROR'});

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

test('integration: no MCP when routes do not opt in', async (assert) => {

    const noMcpSpec = defineSpec({
        meta: {
            title: 'No MCP',
            version: '0.0.1',
        },
        routes: {
            ping: defineRoute({
                input: p.object({}),
                output: p.string(),
                meta: {summary: 'Ping', description: 'Ping', tags: ['health']},
                access: 'public',
                handler: (_input, _ctx) => 'pong',
            }),
        },
    });

    const app = express();
    const router = express.Router();

    router.use(express.json());

    mountSpec(router, noMcpSpec);

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

    router.use(express.json());

    mountSpec(router, fixtureSpec, {docs: false});

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

    const sparseSpec = defineSpec({
        routes: {
            ping: defineRoute({
                input: p.object({}),
                output: p.string(),
                meta: {summary: 'Ping', description: 'Ping', tags: ['health']},
                access: 'public',
                handler: (_input, _ctx) => 'pong',
            }),
        },
    });

    const app = express();
    const router = express.Router();

    router.use(express.json());

    mountSpec(router, sparseSpec);

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
