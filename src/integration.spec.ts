import {test} from 'kizu';
import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import {predicates as p} from 'runtyp';
import {defineRegistry} from './defineRegistry';
import {defineRoute} from './defineRoute';
import {mountRegistry} from './mountRegistry';
import {parseCallspecOpenApi} from './callsheet/parseOpenApi';

const fixtureRegistry = defineRegistry({

    healthcheck: defineRoute({
        input: p.object({}),
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
        meta: {
            summary: 'Echo message',
            description: 'Returns the input message.',
            tags: ['demo'],
        },
        access: 'private',
        handler: (input, _ctx) => ({echo: input.message}),
    }),

    greet: defineRoute({
        input: p.object({name: p.string()}),
        meta: {
            summary: 'Greet by name',
            description: 'Returns a hello payload.',
            tags: ['demo'],
        },
        access: 'public',
        mcp: true,
        handler: (input, _ctx) => ({hello: input.name}),
    }),

});

function createTestApp(): http.Server {

    const app = express();
    const router = express.Router();

    router.use(bodyParser.json());

    mountRegistry(router, fixtureRegistry, {
        docs: {
            openApi: {title: 'Fixture API', version: '1.0.0'},
            exposeOpenApi: true,
            exposeUi: true,
        },
        contextResolver: (req) => {

            const auth = req.headers.authorization;

            if (auth === 'Bearer test-token') {

                return {userId: 'test-user'};

            }

            return undefined;

        },
    });

    app.use('/v1', router);

    return http.createServer(app);

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

        server.close();

    }

}

test('integration: openapi.json lists all fixture routes', async (assert) => {

    await withServer(async (base) => {

        const res = await fetch(`${base}/openapi.json`);
        const doc = await res.json() as Record<string, unknown>;

        assert.equal(res.status, 200);
        assert.equal((doc.info as {title: string}).title, 'Fixture API');

        const spec = parseCallspecOpenApi(doc);

        assert.equal(spec.routes.length, 3);

        const greet = spec.routes.find((route) => route.name === 'greet');

        assert.equal(greet?.access, 'public');
        assert.equal(greet?.mcp, true);

        const echo = spec.routes.find((route) => route.name === 'echo');

        assert.equal(echo?.access, 'private');

    });

});

test('integration: callsheet UI at /docs', async (assert) => {

    await withServer(async (base) => {

        const res = await fetch(`${base}/docs/`);
        const html = await res.text();

        assert.equal(res.status, 200);
        assert.equal(res.headers.get('content-type')?.includes('text/html'), true);
        assert.equal(html.includes('window.__CALLSHEET__='), true);
        assert.equal(html.includes('"specUrl":"../openapi.json"'), true);
        assert.equal(html.includes('src="./assets/app.js"'), true);
        assert.equal(html.includes('type="module"'), false);
        assert.equal(html.includes('Powered by'), true);
        assert.equal(html.includes('callspec-mark-light.svg'), true);
        assert.equal(html.includes('class="footer-link"'), true);
        assert.equal(html.includes('callspec'), true);

        const asset = await fetch(`${base}/docs/assets/app.js`);

        assert.equal(asset.status, 200);
        assert.equal(asset.headers.get('content-type')?.includes('javascript'), true);

        const bare = await fetch(`${base}/docs`, {redirect: 'manual'});

        assert.equal(bare.status, 301);

    });

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

test('integration: docs can expose openapi only', async (assert) => {

    const app = express();
    const router = express.Router();

    router.use(bodyParser.json());

    mountRegistry(router, fixtureRegistry, {
        docs: {
            openApi: {title: 'Spec only', version: '0.0.1'},
            exposeOpenApi: true,
            exposeUi: false,
        },
    });

    app.use(router);

    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('bad address');

    const origin = `http://127.0.0.1:${addr.port}`;

    const spec = await fetch(`${origin}/openapi.json`);
    const docs = await fetch(`${origin}/docs`);

    assert.equal(spec.status, 200);
    assert.equal(docs.status, 404);

    server.close();

});
