import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {route} from './route';
import {emitCallspec} from './emitCallspec';
import {parseCallspecDocument} from './callspecDocument';
import {generateSchemasSection} from './generateClient/generateSchemasSection';
import {schemaToRuntyp} from './generateValidators/schemaToRuntyp';

test('schemaToRuntyp: object with optional fields', (assert) => {

    const expr = schemaToRuntyp({
        type: 'object',
        properties: {
            teamId: {type: 'string'},
            query: {type: 'string'},
        },
        required: ['teamId'],
        additionalProperties: false,
    });

    assert.equal(expr.includes('p.object({'), true);
    assert.equal(expr.includes('"teamId": p.string()'), true);
    assert.equal(expr.includes('"query": p.optional(p.string())'), true);

});

test('schemaToRuntyp: union via oneOf', (assert) => {

    const expr = schemaToRuntyp({
        oneOf: [
            {type: 'string'},
            {type: 'number'},
        ],
    });

    assert.equal(expr, 'p.union(p.string(), p.number())');

});

test('emitCallspec: includes exports when provided', (assert) => {

    const logQueryFilter = p.object({
        env: p.string(),
        appIds: p.optional(p.array(p.string())),
    });

    const doc = emitCallspec(
        {
            searchLogs: route({
                input: p.object({
                    teamId: p.string(),
                    env: p.string(),
                }),
                output: p.object({results: p.array(p.object({id: p.string()}))}),
                meta: {summary: 'Search', description: 'Search logs', tags: ['logs']},
                handler: async (_input, _ctx) => ({results: []}),
            }),
        },
        {
            title: 'API',
            version: '1.0.0',
            exports: {logQueryFilter},
        },
    );

    assert.equal(doc.exports?.logQueryFilter !== undefined, true);
    assert.equal((doc.exports?.logQueryFilter as {required?: string[]}).required?.includes('env'), true);

});

test('parseCallspecDocument: round-trips exports', (assert) => {

    const logQueryFilter = p.object({env: p.string()});

    const doc = emitCallspec(
        {},
        {title: 'API', version: '1.0.0', exports: {logQueryFilter}},
    );

    const parsed = parseCallspecDocument(JSON.parse(JSON.stringify(doc)));

    assert.equal(parsed.exports?.logQueryFilter !== undefined, true);

});

test('generateSchemasSection: rejects duplicate export and route pred names', (assert) => {

    const logQueryFilter = p.object({env: p.string()});

    const doc = emitCallspec(
        {
            searchLogs: route({
                input: p.object({teamId: p.string()}),
                output: p.object({ok: p.boolean()}),
                meta: {summary: 'Search', description: 'Search', tags: []},
                handler: async (_input, _ctx) => ({ok: true}),
            }),
        },
        {
            title: 'API',
            version: '1.0.0',
            exports: {searchLogsInput: logQueryFilter},
        },
    );

    assert.throws(
        () => generateSchemasSection(doc),
        /Duplicate validator name "searchLogsInput"/,
    );

});

test('schemaToRuntyp: uuid and url formats', (assert) => {

    assert.equal(schemaToRuntyp({type: 'string', format: 'uuid'}), 'p.uuid()');
    assert.equal(schemaToRuntyp({type: 'string', format: 'uri'}), 'p.url()');

});

test('generateSchemasSection: emits schemas object for exports and routes', (assert) => {

    const logQueryFilter = p.object({
        env: p.string(),
        vector: p.optional(p.string()),
    });

    const doc = emitCallspec(
        {
            searchLogs: route({
                input: p.object({
                    teamId: p.string(),
                    env: p.string(),
                }),
                output: p.object({results: p.array(p.object({id: p.string()}))}),
                meta: {summary: 'Search', description: 'Search logs', tags: ['logs']},
                handler: async (_input, _ctx) => ({results: []}),
            }),
        },
        {
            title: 'API',
            version: '1.0.0',
            basePath: '/v1',
            exports: {logQueryFilter},
        },
    );

    const generated = generateSchemasSection(doc);

    assert.equal(generated.includes('export const schemas = {'), true);
    assert.equal(generated.includes('logQueryFilter:'), true);
    assert.equal(
        generated.includes('export type LogQueryFilter = Infer<typeof schemas.logQueryFilter>'),
        true,
    );
    assert.equal(generated.includes('searchLogsInput:'), true);
    assert.equal(generated.includes('searchLogsOutput:'), true);
    assert.equal(
        generated.includes('export type SearchLogsInput = Infer<'),
        false,
        'route Input Infer types are omitted to avoid colliding with client types',
    );

});
