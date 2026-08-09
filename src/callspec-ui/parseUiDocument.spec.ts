import {test} from 'kizu';
import {parseUiCallspecDocument} from './parseUiDocument';

test('parseUiCallspecDocument: coerces minimal route shape', (assert) => {

    const doc = parseUiCallspecDocument({
        callspec: '2.0',
        info: {title: 'Demo', version: '1.0.0'},
        routes: {
            ping: {
                name: 'ping',
                path: '/ping',
                input: {type: 'object'},
                output: {type: 'object'},
            },
        },
    });

    assert.equal(doc.info.title, 'Demo');
    assert.equal(doc.routes.ping.summary, 'ping');
    assert.equal(doc.routes.ping.auth, 'none');
    assert.equal(doc.routes.ping.scope, 'public');
    assert.equal(doc.routes.ping.mcp.enabled, false);

});

test('parseUiCallspecDocument: rejects missing info', (assert) => {

    assert.throws(
        () => parseUiCallspecDocument({callspec: '2.0', routes: {}}),
        /info\.title and info\.version/,
    );

});

test('parseUiCallspecDocument: coerces domain error codes', (assert) => {

    const doc = parseUiCallspecDocument({
        callspec: '2.0',
        info: {title: 'Demo', version: '1.0.0'},
        routes: {
            getUser: {
                name: 'getUser',
                path: '/getUser',
                summary: 'Get user',
                tags: ['users'],
                auth: 'bearer',
                input: {type: 'object'},
                output: {type: 'object'},
                errors: {
                    USER_LOCKED: {
                        status: 403,
                        data: {type: 'object', properties: {until: {type: 'string'}}},
                        dataRequired: true,
                    },
                    NOT_READY: {status: 400},
                },
                mcp: {enabled: false},
            },
        },
    });

    assert.equal(doc.routes.getUser.errors, {
        USER_LOCKED: {
            status: 403,
            data: {type: 'object', properties: {until: {type: 'string'}}},
            dataRequired: true,
        },
        NOT_READY: {status: 400},
    });

});
