import {test} from 'kizu';
import {parseUiCallspecDocument} from './parseUiDocument';

test('parseUiCallspecDocument: coerces minimal route shape', (assert) => {

    const doc = parseUiCallspecDocument({
        callspec: '1.0',
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
        () => parseUiCallspecDocument({callspec: '1.0', routes: {}}),
        /info\.title and info\.version/,
    );

});
