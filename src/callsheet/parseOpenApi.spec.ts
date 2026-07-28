import {test} from 'kizu';
import {parseCallspecOpenApi} from './parseOpenApi';
import {renderCallsheetPage} from './mountCallsheet';

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

test('parseCallspecOpenApi: extracts routes and callspec extensions', (assert) => {

    const spec = parseCallspecOpenApi(sampleDoc);

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

test('mountCallsheet: renderCallsheetPage injects config', (assert) => {

    const html = renderCallsheetPage({
        specUrl: './openapi.json',
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

    assert.equal(html.includes('window.__CALLSHEET__='), true);
    assert.equal(html.includes('./openapi.json'), true);
    assert.equal(html.includes('Welcome to Acme API.'), true);
    assert.equal(html.includes('../mcp'), true);

});
