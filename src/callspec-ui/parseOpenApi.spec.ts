import {test} from 'kizu';
import {parseCallspecOpenApi} from './parseOpenApi';
import {callspecDocumentToUiSpec} from './toUiSpec';
import {renderCallspecUiPage} from './mountCallspecUi';
import {predicates as p} from 'runtyp';
import {defineRoute} from '../defineRoute';
import {emitCallspec} from '../emitCallspec';
import {parseCallspecDocument} from '../callspecDocument';

const sampleDoc = {
    openapi: '3.1.0',
    info: {title: 'Demo API', version: '1.0.0'},
    paths: {
        '/healthcheck': {
            post: {
                operationId: 'healthcheck',
                summary: 'Health check',
                description: 'Liveness probe',
                tags: ['health'],
                'x-callspec-access': 'public',
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {type: 'object', properties: {}},
                        },
                    },
                },
                responses: {
                    200: {
                        content: {
                            'application/json': {
                                schema: {type: 'string'},
                            },
                        },
                    },
                },
            },
        },
        '/searchLogs': {
            post: {
                operationId: 'searchLogs',
                summary: 'Search logs',
                description: 'Query log events',
                tags: ['logs'],
                'x-callspec-access': 'private',
                'x-callspec-mcp': true,
                security: [{bearer: []}],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {teamId: {type: 'string'}},
                                required: ['teamId'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        content: {
                            'application/json': {
                                schema: {type: 'array', items: {type: 'object'}},
                            },
                        },
                    },
                },
            },
        },
    },
};

test('parseCallspecOpenApi: still parses OpenAPI for compatibility tooling', (assert) => {

    const spec = parseCallspecOpenApi(sampleDoc);

    assert.equal(spec.routes.length, 2);
    assert.equal(spec.routes.find((route) => route.name === 'searchLogs')?.mcp, true);

});

test('callspecDocumentToUiSpec: extracts routes from native document', (assert) => {

    const doc = parseCallspecDocument({
        callspec: '1.0',
        info: {title: 'Demo API', version: '1.0.0'},
        routes: {
            healthcheck: {
                name: 'healthcheck',
                path: '/healthcheck',
                method: 'POST',
                summary: 'Health check',
                description: 'Liveness probe',
                tags: ['health'],
                access: 'public',
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
                access: 'private',
                input: {
                    type: 'object',
                    properties: {teamId: {type: 'string'}},
                    required: ['teamId'],
                },
                output: {type: 'array', items: {type: 'object'}},
                mcp: {enabled: true},
            },
        },
    });

    const spec = callspecDocumentToUiSpec(doc);

    assert.equal(spec.title, 'Demo API');
    assert.equal(spec.version, '1.0.0');
    assert.equal(spec.routes.length, 2);

    const health = spec.routes.find((route) => route.name === 'healthcheck');

    assert.equal(health?.access, 'public');
    assert.equal(health?.mcp, false);
    assert.equal(health?.tags[0], 'health');

    const search = spec.routes.find((route) => route.name === 'searchLogs');

    assert.equal(search?.access, 'private');
    assert.equal(search?.mcp, true);

});

test('emitCallspec to UI spec: native round trip', (assert) => {

    const doc = emitCallspec({
        healthcheck: defineRoute({
            input: p.object({}),
            output: p.string(),
            meta: {summary: 'Health', description: 'Health', tags: ['health']},
            access: 'public',
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

test('mountCallspecUi: renderCallspecUiPage injects config', (assert) => {

    const html = renderCallspecUiPage({
        specUrl: './callspec.json',
        rpcBase: '..',
        title: 'Test',
        branding: {
            name: 'Acme',
            intro: 'Welcome to Acme API.',
            websiteUrl: 'https://acme.example',
        },
        mcpPath: '../mcp',
        mcp: {authHint: 'Bearer required'},
    });

    assert.equal(html.includes('window.__CALLSPEC_UI__='), true);
    assert.equal(html.includes('./callspec.json'), true);
    assert.equal(html.includes('Welcome to Acme API.'), true);
    assert.equal(html.includes('../mcp'), true);

});
