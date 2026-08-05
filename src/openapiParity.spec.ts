import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {defineRoute, defineSpec} from '.';
import {emitCallspec} from './emitCallspec';
import {emitOpenApi} from './openapi';
import {parseCallspecDocument} from './callspecDocument';

const routes = {
    zLast: defineRoute({
        input: p.object({value: p.string()}),
        output: p.object({value: p.string()}),
        meta: {summary: 'Z route', description: 'Sorted last', tags: ['alpha']},
        auth: 'none',
        handler: async (_input, _ctx) => ({value: 'z'}),
    }),
    aFirst: defineRoute({
        input: p.object({
            count: p.optional(p.number({range: {min: 1, max: 10}})),
            mode: p.optional(p.union([p.literal('fast'), p.literal('slow')], 'mode must be fast or slow')),
        }),
        output: p.object({
            items: p.array(p.object({id: p.string()})),
        }),
        meta: {summary: 'A route', description: 'Sorted first', tags: ['beta', 'alpha']},
        auth: 'bearer',
        mcp: true,
        handler: async (_input, _ctx) => ({items: []}),
    }),
};

const api = defineSpec({
    meta: {
        title: 'Parity API',
        version: '1.2.3',
        intro: 'Parity test API',
    },
    routes,
    authenticate: () => ({userId: 'test'}),
});

type OpenApiOperation = Record<string, unknown>;

test('emitOpenApi: valid OpenAPI 3.1 structure', (assert) => {

    const doc = emitOpenApi(api.routes, {
        title: 'Parity API',
        version: '1.2.3',
        basePath: '/v1',
    });

    assert.equal(doc.openapi, '3.1.0');
    assert.equal((doc.info as {title: string}).title, 'Parity API');
    assert.equal((doc.info as {version: string}).version, '1.2.3');
    assert.equal(typeof doc.paths, 'object');

});

test('emitOpenApi: routes, methods, operationIds, and extensions', (assert) => {

    const doc = emitOpenApi(api.routes, {
        title: 'Parity API',
        version: '1.2.3',
        basePath: '/v1',
    });

    const paths = doc.paths as Record<string, {post?: OpenApiOperation}>;
    const aFirst = paths['/v1/aFirst']?.post;
    const zLast = paths['/v1/zLast']?.post;

    assert.equal(aFirst?.operationId, 'aFirst');
    assert.equal(zLast?.operationId, 'zLast');
    assert.equal(aFirst?.summary, 'A route');
    assert.equal(aFirst?.description, 'Sorted first');
    assert.equal(JSON.stringify(aFirst?.tags), JSON.stringify(['beta', 'alpha']));
    assert.equal(aFirst?.['x-callspec-auth'], 'bearer');
    assert.equal(aFirst?.['x-callspec-scope'], 'public');
    assert.equal(aFirst?.['x-callspec-mcp'], true);
    assert.equal(zLast?.['x-callspec-auth'], 'none');
    assert.equal(zLast?.['x-callspec-scope'], 'public');
    assert.equal(zLast?.['x-callspec-mcp'], undefined);

});

test('emitOpenApi: input and output schemas include optional, enum, array, and nullable fields', (assert) => {

    const doc = emitOpenApi(api.routes, {
        title: 'Parity API',
        version: '1.2.3',
        basePath: '/v1',
    });

    const paths = doc.paths as Record<string, {
        post?: {
            requestBody?: {content?: {'application/json'?: {schema?: Record<string, unknown>}}}
            responses?: {'200'?: {content?: {'application/json'?: {schema?: Record<string, unknown>}}}}
        }
    }>;

    const inputSchema = paths['/v1/aFirst']?.post?.requestBody?.content?.['application/json']?.schema;
    const outputSchema = paths['/v1/aFirst']?.post?.responses?.['200']?.content?.['application/json']?.schema;

    assert.equal(inputSchema?.properties !== undefined, true);
    assert.equal(
        JSON.stringify((inputSchema?.properties as {mode?: {oneOf?: Array<{const?: string}>}})?.mode?.oneOf),
        JSON.stringify([{const: 'fast'}, {const: 'slow'}]),
    );
    assert.equal((inputSchema?.properties as {count?: {minimum?: number}})?.count?.minimum, 1);
    assert.equal((outputSchema?.properties as {items?: {type?: string}})?.items?.type, 'array');

});

test('emitOpenApi and emitCallspec represent the same registry without cross-derivation', (assert) => {

    const options = {
        title: 'Parity API',
        version: '1.2.3',
        basePath: '/v1',
        description: 'Parity test API',
    };

    const native = emitCallspec(api.routes, options);
    const openApi = emitOpenApi(api.routes, options);
    const parsedNative = parseCallspecDocument(JSON.parse(JSON.stringify(native)));

    const nativeNames = Object.keys(parsedNative.routes).sort();
    const openApiNames = Object.keys(openApi.paths as Record<string, unknown>)
        .map((pathKey) => {
            const post = (openApi.paths as Record<string, {post?: {operationId?: string}}>)[pathKey]?.post;

            return post?.operationId ?? pathKey.replace(/^\//, '');

        })
        .sort();

    assert.equal(JSON.stringify(nativeNames), JSON.stringify(openApiNames));

    for (const name of nativeNames) {

        const route = parsedNative.routes[name];
        const openApiPath = (openApi.paths as Record<string, {post?: OpenApiOperation}>)[route.path]?.post;

        assert.equal(route.summary, openApiPath?.summary);
        assert.equal(route.auth, openApiPath?.['x-callspec-auth']);
        assert.equal(route.scope, openApiPath?.['x-callspec-scope']);
        assert.equal(route.mcp.enabled, openApiPath?.['x-callspec-mcp'] === true);
        assert.equal(
            JSON.stringify(route.input),
            JSON.stringify(
                (openApiPath?.requestBody as {content?: {'application/json'?: {schema?: unknown}}})
                    ?.content?.['application/json']?.schema,
            ),
        );

    }

});

test('emitOpenApi: deterministic output', (assert) => {

    const options = {title: 'Parity API', version: '1.2.3', basePath: '/v1'};

    assert.equal(
        JSON.stringify(emitOpenApi(api.routes, options)),
        JSON.stringify(emitOpenApi(api.routes, options)),
    );

});

test('emitOpenApi: bearer security only on private routes', (assert) => {

    const doc = emitOpenApi({
        healthcheck: defineRoute({
            input: p.object({}),
            output: p.object({status: p.string()}),
            meta: {summary: 'Health check', description: 'Public health check', tags: ['system']},
            auth: 'none',
            handler: (_input, _ctx) => ({status: 'ok'}),
        }),
        getSecret: defineRoute({
            input: p.object({}),
            output: p.object({secret: p.boolean()}),
            meta: {summary: 'Private route', description: 'Requires auth', tags: ['system']},
            auth: 'bearer',
            handler: (_input, _ctx) => ({secret: true}),
        }),
    }, {
        title: 'Test API',
        version: '1.0.0',
    });

    type OpenApiOperation = {
        security?: Array<Record<string, string[]>>
        responses?: Record<string, {description?: string}>
    };

    type OpenApiPaths = Record<string, {post?: OpenApiOperation}>;

    const paths = doc.paths as OpenApiPaths;
    const health = paths['/healthcheck']?.post;
    const secret = paths['/getSecret']?.post;

    assert.equal(JSON.stringify(health?.security), '[]', 'public route opts out of bearer');
    assert.equal(JSON.stringify(secret?.security), JSON.stringify([{bearer: []}]), 'private route requires bearer');
    assert.equal(health?.responses?.['401'], undefined, 'public route has no 401');
    assert.equal(secret?.responses?.['401']?.description, 'UNAUTHORIZED', 'private route documents 401');

    const components = doc.components as {securitySchemes?: {bearer?: unknown}};

    assert.equal(components.securitySchemes?.bearer !== undefined, true, 'bearer scheme present');

});
