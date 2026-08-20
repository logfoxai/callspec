import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {route, spec} from '.';
import {
    CALLSPEC_DOCUMENT_VERSION,
    parseCallspecDocument,
} from './callspecDocument';
import {emitCallspec} from './emitCallspec';

const api = spec({
    meta: {
        title: 'Test API',
        version: '2.0.0',
        intro: 'Test intro',
    },
    routes: {
        searchLogs: route({
            input: p.object({
                teamId: p.string(),
                query: p.optional(p.string()),
            }),
            output: p.object({
                results: p.array(p.object({id: p.string()})),
            }),
            meta: {
                summary: 'Search logs',
                description: 'Find log events',
                tags: ['logs'],
            },
            auth: 'bearer',
            mcp: true,
            handler: async (_input, _ctx) => ({results: []}),
        }),
        healthcheck: route({
            input: p.object({}),
            output: p.object({status: p.string()}),
            meta: {
                summary: 'Health check',
                description: 'Liveness probe',
                tags: ['system'],
            },
            auth: 'none',
            handler: async (_input, _ctx) => ({status: 'ok'}),
        }),
    },
    authenticate: () => ({userId: 'test'}),
});

test('emitCallspec: emits versioned document with metadata', (assert) => {

    const doc = emitCallspec(api.routes, {
        title: 'Test API',
        version: '2.0.0',
        description: 'Test intro',
        basePath: '/v1',
    });

    assert.equal(doc.callspec, CALLSPEC_DOCUMENT_VERSION);
    assert.equal(doc.info.title, 'Test API');
    assert.equal(doc.info.version, '2.0.0');
    assert.equal(doc.info.description, 'Test intro');
    assert.equal(Object.keys(doc.routes).join(','), 'healthcheck,searchLogs');

});

test('emitCallspec: includes route metadata, schemas, access, and MCP state', (assert) => {

    const doc = emitCallspec(api.routes, {
        title: 'Test API',
        version: '2.0.0',
        basePath: '/v1',
    });

    const search = doc.routes.searchLogs;

    assert.equal(search.name, 'searchLogs');
    assert.equal(search.path, '/v1/searchLogs');
    assert.equal(search.method, 'POST');
    assert.equal(search.summary, 'Search logs');
    assert.equal(search.description, 'Find log events');
    assert.equal(search.tags[0], 'logs');
    assert.equal(search.auth, 'bearer');
    assert.equal(search.scope, 'public');
    assert.equal(search.mcp.enabled, true);
    assert.equal((search.input as {required?: string[]}).required?.includes('teamId'), true);

    const health = doc.routes.healthcheck;

    assert.equal(health.auth, 'none');
    assert.equal(health.scope, 'public');
    assert.equal(health.mcp.enabled, false);

});

test('emitCallspec: deterministic output', (assert) => {

    const options = {title: 'Test API', version: '2.0.0', basePath: '/v1'};

    assert.equal(
        JSON.stringify(emitCallspec(api.routes, options)),
        JSON.stringify(emitCallspec(api.routes, options)),
    );

});

test('emitCallspec: does not expose handlers or server internals', (assert) => {

    const doc = emitCallspec(api.routes, {
        title: 'Test API',
        version: '2.0.0',
    });

    const serialized = JSON.stringify(doc);

    assert.equal(serialized.includes('handler'), false);
    assert.equal(serialized.includes('authenticate'), false);

});

test('parseCallspecDocument: accepts valid documents', (assert) => {

    const doc = emitCallspec(api.routes, {
        title: 'Test API',
        version: '2.0.0',
        basePath: '/v1',
    });

    const roundTrip = parseCallspecDocument(JSON.parse(JSON.stringify(doc)));

    assert.equal(roundTrip.info.title, 'Test API');
    assert.equal(roundTrip.routes.searchLogs.path, '/v1/searchLogs');

});

test('parseCallspecDocument: rejects malformed documents', (assert) => {

    assert.throws(
        () => parseCallspecDocument(null),
        /Callspec document must be an object/,
    );

    assert.throws(
        () => parseCallspecDocument({callspec: '2.0'}),
        /must include info/,
    );

});

test('emitCallspec: omits scope private routes from the document', (assert) => {

    const routes = {
        publicRoute: route({
            input: p.object({}),
            output: p.object({ok: p.boolean()}),
            meta: {summary: 'Public', description: 'Exported', tags: []},
            scope: 'public',
            auth: 'none',
            handler: async (_input, _ctx) => ({ok: true}),
        }),
        internalRoute: route({
            input: p.object({}),
            output: p.object({ok: p.boolean()}),
            meta: {summary: 'Internal', description: 'Not exported', tags: []},
            scope: 'private',
            auth: 'none',
            handler: async (_input, _ctx) => ({ok: true}),
        }),
    };

    const doc = emitCallspec(routes, {title: 'Scope API', version: '1.0.0'});

    assert.equal(Object.keys(doc.routes).join(','), 'publicRoute');
    assert.equal(doc.routes.publicRoute.scope, 'public');
    assert.equal(doc.routes.internalRoute, undefined);

    const all = emitCallspec(routes, {title: 'Scope API', version: '1.0.0', visibility: 'all'});

    assert.equal(Object.keys(all.routes).sort().join(','), 'internalRoute,publicRoute');
    assert.equal(all.routes.internalRoute.scope, 'private');
    assert.equal(all.routes.publicRoute.scope, 'public');

});

test('parseCallspecDocument: rejects callspec 1.x documents', (assert) => {

    assert.throws(
        () => parseCallspecDocument({
            callspec: '1.0',
            info: {title: 'Legacy', version: '1.0.0'},
            routes: {},
        }),
        /Unsupported Callspec document version/,
    );

});

test('parseCallspecDocument: rejects unsupported major versions', (assert) => {

    assert.throws(
        () => parseCallspecDocument({
            callspec: '3.0',
            info: {title: 'X', version: '1.0.0'},
            routes: {},
        }),
        /Unsupported Callspec document version/,
    );

});
