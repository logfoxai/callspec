import {test} from 'kizu';
import {callspecDocumentToUiSpec} from './toUiSpec';
import {predicates as p} from 'runtyp';
import {route} from '../route';
import {emitCallspec} from '../emitCallspec';
import {parseCallspecDocument} from '../callspecDocument';

test('callspecDocumentToUiSpec: extracts routes from native document', (assert) => {

    const doc = parseCallspecDocument({
        callspec: '2.0',
        info: {title: 'Demo API', version: '1.0.0'},
        routes: {
            healthcheck: {
                name: 'healthcheck',
                path: '/healthcheck',
                method: 'POST',
                summary: 'Health check',
                description: 'Liveness probe',
                tags: ['health'],
                auth: 'none',
                input: {type: 'object', properties: {}},
                output: {type: 'string'},
                mcp: {enabled: false},
            },
            searchLogs: {
                name: 'searchLogs',
                path: '/searchLogs',
                method: 'POST',
                summary: 'Search logs',
                description: 'Query log events',
                tags: ['logs'],
                auth: 'bearer',
                input: {
                    type: 'object',
                    properties: {teamId: {type: 'string'}},
                    required: ['teamId'],
                },
                output: {type: 'array', items: {type: 'object'}},
                errors: {
                    TEAM_NOT_FOUND: {status: 404, data: {type: 'object'}},
                },
                mcp: {enabled: true},
            },
        },
    });

    const spec = callspecDocumentToUiSpec(doc);

    assert.equal(spec.title, 'Demo API');
    assert.equal(spec.version, '1.0.0');
    assert.equal(spec.routes.length, 2);

    const health = spec.routes.find((route) => route.name === 'healthcheck');

    assert.equal(health?.auth, 'none');
    assert.equal(health?.mcp, false);
    assert.equal(health?.tags[0], 'health');
    assert.equal(health?.errors, undefined);

    const search = spec.routes.find((route) => route.name === 'searchLogs');

    assert.equal(search?.auth, 'bearer');
    assert.equal(search?.mcp, true);
    assert.equal(search?.errors, {
        TEAM_NOT_FOUND: {status: 404, data: {type: 'object'}},
    });

});

test('emitCallspec to UI spec: native round trip', (assert) => {

    const doc = emitCallspec({
        healthcheck: route({
            input: p.object({}),
            output: p.string(),
            meta: {summary: 'Health', description: 'Health', tags: ['health']},
            auth: 'none',
            handler: async (_input, _ctx) => 'ok',
        }),
    }, {
        title: 'Demo API',
        version: '1.0.0',
    });

    const spec = callspecDocumentToUiSpec(parseCallspecDocument(JSON.parse(JSON.stringify(doc))));

    assert.equal(spec.routes.length, 1);
    assert.equal(spec.routes[0]?.name, 'healthcheck');

});
