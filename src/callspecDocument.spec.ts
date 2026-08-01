import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {defineRoute, defineSpec} from '.';
import {
    CALLSPEC_DOCUMENT_VERSION,
    parseCallspecDocument,
} from './callspecDocument';
import {emitCallspec} from './emitCallspec';

const api = defineSpec({
    meta: {
        title: 'Test API',
        version: '2.0.0',
        intro: 'Test intro',
    },
    routes: {
        searchLogs: defineRoute({
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
            access: 'private',
            mcp: true,
            handler: async (_input, _ctx) => ({results: []}),
        }),
        healthcheck: defineRoute({
            input: p.object({}),
            output: p.object({status: p.string()}),
            meta: {
                summary: 'Health check',
                description: 'Liveness probe',
                tags: ['system'],
            },
            access: 'public',
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
    assert.equal(search.access, 'private');
    assert.equal(search.mcp.enabled, true);
    assert.equal((search.input as {required?: string[]}).required?.includes('teamId'), true);

    const health = doc.routes.healthcheck;

    assert.equal(health.access, 'public');
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
        () => parseCallspecDocument({callspec: '1.0'}),
        /must include info/,
    );

});

test('parseCallspecDocument: rejects unsupported major versions', (assert) => {

    assert.throws(
        () => parseCallspecDocument({
            callspec: '2.0',
            info: {title: 'X', version: '1.0.0'},
            routes: {},
        }),
        /Unsupported Callspec document version/,
    );

});
