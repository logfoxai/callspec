import http from 'http';
import express from 'express';
import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {CallspecClient, isCallspecOk} from './client';
import {emitCallspec} from './emitCallspec';
import {file} from './file';
import {generateClientSource} from './generateClient/generateClientSource';
import {mountSpec} from './mountSpec';
import {emitOpenApi} from './openapi';
import {route} from './route';
import {spec} from './defineSpec';

const upload = route({
    input: p.object({
        file: file({
            maxBytes: 64,
            mime: ['image/jpeg', 'image/png'],
        }),
        caption: p.optional(p.string()),
    }),
    output: p.object({
        filename: p.string(),
        mimeType: p.string(),
        size: p.number(),
        caption: p.optional(p.string()),
    }),
    meta: {summary: 'Upload a photo', tags: ['user']},
    auth: 'bearer',
    handler: async (input, _ctx) => ({
        filename: input.file.filename,
        mimeType: input.file.mimeType,
        size: input.file.size,
        caption: input.caption,
    }),
});

const api = spec({
    meta: {title: 'Upload API', version: '1.0.0'},
    routes: {upload},
    authenticate: (token) => (token === 'user-token' ? {userId: 'u1'} : undefined),
});

async function withUploadServer(fn: (base: string) => Promise<void>): Promise<void> {

    const app = express();
    const router = express.Router();

    router.use(express.json());
    mountSpec(router, api, {logging: false});
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

        server.closeAllConnections?.();
        await new Promise<void>((resolve, reject) => {

            server.close((err) => {

                if (err) reject(err);
                else resolve();

            });

        });

    }

}

function pngBlob(): Blob {

    return new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], {type: 'image/png'});

}

test('emitCallspec: upload routes are multipart with binary file fields', (assert) => {

    const doc = emitCallspec(api.routes, {title: 'Upload API', version: '1.0.0', basePath: '/v1'});
    const routeDoc = doc.routes.upload;

    assert.equal(routeDoc.encoding, 'multipart');
    assert.equal(
        (routeDoc.input.properties as {file?: {type?: string, format?: string}})?.file?.format,
        'binary',
    );
    assert.equal(routeDoc.auth, 'bearer');

});

test('emitOpenApi: upload routes use multipart/form-data', (assert) => {

    const doc = emitOpenApi(api.routes, {title: 'Upload API', version: '1.0.0', basePath: '/v1'});
    const post = (doc.paths as Record<string, {
        post?: {
            requestBody?: {
                content?: {
                    'multipart/form-data'?: {schema?: {properties?: {file?: {format?: string}}}}
                    'application/json'?: unknown
                }
            }
        }
    }>)['/v1/upload']?.post;

    assert.equal(post?.requestBody?.content?.['multipart/form-data']?.schema?.properties?.file?.format, 'binary');
    assert.equal(post?.requestBody?.content?.['application/json'], undefined);

});

test('generateClientSource: upload input is Blob and sends multipart', (assert) => {

    const generated = generateClientSource(
        emitCallspec(api.routes, {title: 'Upload API', version: '1.0.0'}),
    );

    assert.equal(generated.includes('"file": Blob'), true);
    assert.equal(generated.includes("encoding: 'multipart'"), true);
    assert.equal(generated.includes('"file": p.any()'), true);

});

test('integration: multipart upload uses the same auth and error contract', async (assert) => {

    await withUploadServer(async (base) => {

        const body = new FormData();

        body.append('file', pngBlob(), 'avatar.png');
        body.append('caption', 'hi');

        const unauthorized = await fetch(`${base}/upload`, {method: 'POST', body});

        assert.equal(unauthorized.status, 401);
        assert.equal((await unauthorized.json() as {error?: string}).error, 'UNAUTHORIZED');

        const jsonRejected = await fetch(`${base}/upload`, {
            method: 'POST',
            headers: {
                Authorization: 'Bearer user-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({file: 'nope'}),
        });

        assert.equal(jsonRejected.status, 400);
        assert.equal((await jsonRejected.json() as {error?: string}).error, 'VALIDATION_ERROR');

        const okBody = new FormData();

        okBody.append('file', pngBlob(), 'avatar.png');
        okBody.append('caption', 'hi');

        const ok = await fetch(`${base}/upload`, {
            method: 'POST',
            headers: {Authorization: 'Bearer user-token'},
            body: okBody,
        });
        const payload = await ok.json() as {
            filename?: string
            mimeType?: string
            size?: number
            caption?: string
        };

        assert.equal(ok.status, 200);
        assert.equal(payload.filename, 'avatar.png');
        assert.equal(payload.mimeType, 'image/png');
        assert.equal(payload.size, 4);
        assert.equal(payload.caption, 'hi');

        const badType = new FormData();

        badType.append('file', new Blob(['%PDF'], {type: 'application/pdf'}), 'doc.pdf');

        const rejectedType = await fetch(`${base}/upload`, {
            method: 'POST',
            headers: {Authorization: 'Bearer user-token'},
            body: badType,
        });

        assert.equal(rejectedType.status, 400);
        assert.equal((await rejectedType.json() as {error?: string}).error, 'VALIDATION_ERROR');

        const extraPart = new FormData();

        extraPart.append('ignored', pngBlob(), 'other.png');
        extraPart.append('file', pngBlob(), 'avatar.png');

        const extraOk = await fetch(`${base}/upload`, {
            method: 'POST',
            headers: {Authorization: 'Bearer user-token'},
            body: extraPart,
        });

        assert.equal(extraOk.status, 200);
        assert.equal((await extraOk.json() as {filename?: string}).filename, 'avatar.png');

        const tooBig = new FormData();

        tooBig.append('file', new Blob([new Uint8Array(80)], {type: 'image/png'}), 'big.png');

        const rejectedSize = await fetch(`${base}/upload`, {
            method: 'POST',
            headers: {Authorization: 'Bearer user-token'},
            body: tooBig,
        });

        assert.equal(rejectedSize.status, 400);
        assert.equal((await rejectedSize.json() as {error?: string}).error, 'VALIDATION_ERROR');

    });

});

test('CallspecClient: multipart encoding sends FormData and keeps auth', async (assert) => {

    const calls: {url: string, init?: RequestInit}[] = [];
    const customFetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {

        calls.push({url: String(input), init});

        return new Response(JSON.stringify({filename: 'avatar.png'}), {
            status: 200,
            headers: {'Content-Type': 'application/json'},
        });

    }) as typeof fetch;

    const runtime = new CallspecClient({
        baseUrl: 'https://api.test/v1',
        headers: {Authorization: 'Bearer user-token'},
        fetch: customFetch,
    });
    const blob = pngBlob();
    const result = await runtime.callResult<{filename: string}>('upload', {
        file: blob,
        caption: 'hi',
    }, {encoding: 'multipart'});

    assert.equal(isCallspecOk(result), true);
    assert.equal(calls[0]?.url, 'https://api.test/v1/upload');
    assert.equal(calls[0]?.init?.body instanceof FormData, true);

    const headers = calls[0]?.init?.headers;

    assert.equal(headers instanceof Headers, true);

    if (headers instanceof Headers) {

        assert.equal(headers.get('Authorization'), 'Bearer user-token');
        assert.equal(headers.get('Content-Type'), null);

    }

    if (calls[0]?.init?.body instanceof FormData) {

        const file = calls[0].init.body.get('file');
        const caption = calls[0].init.body.get('caption');

        assert.equal(file instanceof Blob, true);
        assert.equal(caption, 'hi');

    }

});
