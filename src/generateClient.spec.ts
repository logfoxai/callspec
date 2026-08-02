import fs from 'fs';
import os from 'os';
import path from 'path';
import {test} from 'kizu';
import express from 'express';
import http from 'http';
import {predicates as p} from 'runtyp';
import {CallspecClient, isCallspecOk} from './client';
import {defineRoute} from './defineRoute';
import {defineSpec} from './defineSpec';
import {emitCallspec} from './emitCallspec';
import {mountSpec} from './mountSpec';
import {generateClientFile} from './generateClient/generateClient';
import {generateClientSource} from './generateClient/generateClientSource';
import {errors} from './routeErrors';
import {
    sanitizeMethodName,
    schemaToTypes,
    typeNameForRoute,
} from './generateClient/schemaToTypeScript';

test('CallspecClient: dynamic headers and custom fetch', async (assert) => {

    let customFetchUsed = false;

    const customFetch = (async (): Promise<Response> => {

        customFetchUsed = true;

        return new Response(JSON.stringify({ok: true}), {
            status: 200,
            headers: {'Content-Type': 'application/json'},
        });

    }) as typeof fetch;

    const runtime = new CallspecClient({
        baseUrl: 'https://api.test/v1',
        headers: (): Record<string, string> => ({Authorization: 'Bearer dynamic'}),
        fetch: customFetch,
    });

    const result = await runtime.callResult<{ok: boolean}>('healthcheck', {});

    assert.equal(customFetchUsed, true);
    assert.equal(isCallspecOk(result), true);

});

test('schemaToTypes: generates nested object types', (assert) => {

    const result = schemaToTypes({
        type: 'object',
        properties: {
            teamId: {type: 'string'},
            query: {type: 'string'},
        },
        required: ['teamId'],
    }, 'SearchLogsInput');

    assert.equal(result.typeName, 'SearchLogsInput');
    assert.equal(result.types[0]?.definition.includes('"teamId": string'), true);
    assert.equal(result.types[0]?.definition.includes('"query"?: string'), true);

});

test('sanitizeMethodName: handles reserved words and invalid identifiers', (assert) => {

    assert.equal(sanitizeMethodName('searchLogs'), 'searchLogs');
    assert.equal(sanitizeMethodName('class'), 'class_');
    assert.equal(sanitizeMethodName('my-route'), 'my_route');
    assert.equal(sanitizeMethodName('123start'), '_123start');

});

test('typeNameForRoute: produces stable type names', (assert) => {

    assert.equal(typeNameForRoute('searchLogs', 'Input'), 'SearchLogsInput');
    assert.equal(typeNameForRoute('searchLogs', 'Output'), 'SearchLogsOutput');

});

test('generateClientFile: generates deterministic TypeScript from local file', async (assert) => {

    const routes = {
        searchLogs: defineRoute({
            input: p.object({teamId: p.string(), query: p.optional(p.string())}),
            output: p.object({results: p.array(p.object({id: p.string()}))}),
            meta: {summary: 'Search', description: 'Search logs', tags: ['logs']},
            access: 'private',
            handler: async (_input, _ctx) => ({results: []}),
        }),
    };

    const doc = emitCallspec(routes, {title: 'Gen API', version: '1.0.0', basePath: '/v1'});
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-gen-'));
    const sourcePath = path.join(dir, 'callspec.json');
    const outputPath = path.join(dir, 'api.ts');

    fs.writeFileSync(sourcePath, JSON.stringify(doc));

    await generateClientFile(sourcePath, outputPath);

    const generated = fs.readFileSync(outputPath, 'utf8');

    assert.equal(generated.startsWith('/**'), true);
    assert.equal(generated.includes('export class ApiClient'), true);
    assert.equal(generated.includes('async searchLogs(input: SearchLogsInput): Promise<SearchLogsResult>'), true);
    assert.equal(generated.includes('CallspecRouteResult'), true);
    assert.equal(generated.includes("from 'callspec/client'"), true);
    assert.equal(generated.endsWith('\n'), true);

    await generateClientFile(sourcePath, outputPath);

    assert.equal(fs.readFileSync(outputPath, 'utf8'), generated);

    fs.rmSync(dir, {recursive: true, force: true});

});

test('generateClientFile: generates from HTTP URL', async (assert) => {

    const routes = {
        ping: defineRoute({
            input: p.object({}),
            output: p.string(),
            meta: {summary: 'Ping', description: 'Ping', tags: ['health']},
            access: 'public',
            handler: async (_input, _ctx) => 'pong',
        }),
    };

    const spec = defineSpec({
        meta: {title: 'HTTP Gen', version: '1.0.0'},
        routes,
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

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-gen-http-'));
    const outputPath = path.join(dir, 'api.ts');

    try {

        await generateClientFile(
            `http://127.0.0.1:${addr.port}/v1/callspec.json`,
            outputPath,
        );

        const generated = fs.readFileSync(outputPath, 'utf8');

        assert.equal(generated.includes('async ping(input: PingInput)'), true);

    } finally {

        server.close();
        fs.rmSync(dir, {recursive: true, force: true});

    }

});

test('generateClientFile: rejects non-2xx HTTP responses', async (assert) => {

    const server = http.createServer((_req, res) => {

        res.statusCode = 404;
        res.end('missing');

    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));

    const addr = server.address();

    if (!addr || typeof addr === 'string') throw new Error('bad address');

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-gen-404-'));
    const outputPath = path.join(dir, 'api.ts');

    try {

        let thrown: unknown;

        try {

            await generateClientFile(
                `http://127.0.0.1:${addr.port}/callspec.json`,
                outputPath,
            );

        } catch (err) {

            thrown = err;

        }

        assert.equal(thrown instanceof Error, true);

        if (thrown instanceof Error) {

            assert.equal(thrown.message.includes('404'), true);

        }

    } finally {

        server.close();
        fs.rmSync(dir, {recursive: true, force: true});

    }

});

test('generated client makes a real request to an in-process server', async (assert) => {

    const {execSync} = await import('node:child_process');
    const routes = {
        echo: defineRoute({
            input: p.object({message: p.string()}),
            output: p.object({echo: p.string()}),
            meta: {summary: 'Echo', description: 'Echo', tags: ['demo']},
            access: 'public',
            handler: async (input: {message: string}, _ctx: unknown) => ({echo: input.message}),
        }),
    };

    const spec = defineSpec({
        meta: {title: 'Runtime Gen', version: '1.0.0'},
        routes,
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

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-runtime-'));
    const outputPath = path.join(dir, 'api.ts');

    try {

        await generateClientFile(
            `http://127.0.0.1:${addr.port}/v1/callspec.json`,
            outputPath,
        );

        fs.writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify({
            compilerOptions: {
                module: 'Node16',
                target: 'ES2020',
                esModuleInterop: true,
                moduleResolution: 'Node16',
                strict: true,
                skipLibCheck: true,
            },
            include: ['api.ts'],
        }));

        fs.mkdirSync(path.join(dir, 'node_modules'), {recursive: true});
        fs.symlinkSync(process.cwd(), path.join(dir, 'node_modules', 'callspec'), 'dir');

        execSync(`${process.execPath} ${path.join(process.cwd(), 'node_modules/typescript/bin/tsc')} -p tsconfig.json`, {
            cwd: dir,
            stdio: 'pipe',
        });

        const {createRequire} = await import('node:module');
        const requireGenerated = createRequire(path.join(dir, 'package.json'));
        fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({type: 'commonjs'}));

        const generated = requireGenerated(path.join(dir, 'api.js')) as {
            ApiClient: new (config: {baseUrl: string}) => {
                echo(input: {message: string}): Promise<{ok: true; value: {echo: string}} | {ok: false; status: number; error: unknown}>
            }
        };

        const api = new generated.ApiClient({baseUrl: `http://127.0.0.1:${addr.port}/v1`});
        const result = await api.echo({message: 'hello'});

        assert.equal(result.ok, true);

        if (result.ok) {

            assert.equal(result.value.echo, 'hello');

        }

    } finally {

        server.close();
        fs.rmSync(dir, {recursive: true, force: true});

    }

});

test('generateClientSource: error response types omit data when wire schema has no data field', (assert) => {

    const err = errors({
        USER_EXISTS: {status: 409, data: p.object({email: p.string()})},
    });

    const doc = emitCallspec({
        getUser: defineRoute({
            input: p.object({email: p.string()}),
            output: p.object({email: p.string()}),
            errors: err,
            meta: {summary: 'Get user', description: 'Get user', tags: ['users']},
            access: 'public',
            handler: async (input, _ctx) => ({email: input.email}),
        }),
    }, {title: 'Errors API', version: '1.0.0'});

    const generated = generateClientSource(doc);

    assert.equal(generated.includes("{ error: \"NOT_FOUND\" }"), true);
    assert.equal(generated.includes('data: GetUserUserExistsData'), true);
    assert.equal(generated.includes('GetUserError'), true);
    assert.equal(generated.includes('GetUserResult = CallspecRouteResult<GetUserOutput, GetUserError>'), true);

});

test('generateClientSource: escapes malicious route names in runtime.call', (assert) => {

    const doc = emitCallspec({
        "evil'); throw new Error('pwn": defineRoute({
            input: p.object({}),
            output: p.string(),
            meta: {summary: 'Evil', description: 'Evil', tags: ['x']},
            access: 'public',
            handler: async (_input, _ctx) => 'ok',
        }),
    }, {title: 'Evil API', version: '1.0.0'});

    const generated = generateClientSource(doc);

    assert.equal(
        generated.includes("this.runtime.callResult<EvilThrowNewErrorPwnOutput, EvilThrowNewErrorPwnError>(\"evil'); throw new Error('pwn\", input)"),
        true,
    );

});
