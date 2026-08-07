import fs from 'fs';
import os from 'os';
import path from 'path';
import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {route} from './route';
import {emitCallspec} from './emitCallspec';
import {parseCallspecDocument} from './callspecDocument';
import {generateValidatorsFile} from './generateValidators/generateValidators';
import {generateValidatorsSource} from './generateValidators/generateValidatorsSource';
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
                resolver: async (_input, _ctx) => ({results: []}),
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

test('generateValidatorsSource: rejects duplicate export and route pred names', (assert) => {

    const logQueryFilter = p.object({env: p.string()});

    const doc = emitCallspec(
        {
            searchLogs: route({
                input: p.object({teamId: p.string()}),
                output: p.object({ok: p.boolean()}),
                meta: {summary: 'Search', description: 'Search', tags: []},
                resolver: async (_input, _ctx) => ({ok: true}),
            }),
        },
        {
            title: 'API',
            version: '1.0.0',
            exports: {searchLogsInput: logQueryFilter},
        },
    );

    assert.throws(
        () => generateValidatorsSource(doc),
        /Duplicate validator name "searchLogsInput"/,
    );

});

test('schemaToRuntyp: uuid and url formats', (assert) => {

    assert.equal(schemaToRuntyp({type: 'string', format: 'uuid'}), 'p.uuid()');
    assert.equal(schemaToRuntyp({type: 'string', format: 'uri'}), 'p.url()');

});

test('generateValidatorsFile: emits runtyp preds for exports and routes', async (assert) => {

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
                resolver: async (_input, _ctx) => ({results: []}),
            }),
        },
        {
            title: 'API',
            version: '1.0.0',
            basePath: '/v1',
            exports: {logQueryFilter},
        },
    );

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'callspec-validators-'));
    const sourcePath = path.join(dir, 'callspec.json');
    const outputPath = path.join(dir, 'validators.ts');

    fs.writeFileSync(sourcePath, JSON.stringify(doc));

    await generateValidatorsFile(sourcePath, outputPath);

    const generated = fs.readFileSync(outputPath, 'utf8');

    assert.equal(generated.includes("from 'runtyp'"), true);
    assert.equal(generated.includes('export const logQueryFilter ='), true);
    assert.equal(generated.includes('export type LogQueryFilter = Infer<typeof logQueryFilter>'), true);
    assert.equal(generated.includes('export const searchLogsInput ='), true);
    assert.equal(generated.includes('export type SearchLogsInput = Infer<typeof searchLogsInput>'), true);
    assert.equal(generated.includes('express'), false);

    const sampleFilter = {env: 'production'};
    const pred = logQueryFilter;

    assert.equal(pred(sampleFilter).isValid, true);

    fs.rmSync(dir, {recursive: true, force: true});

});
