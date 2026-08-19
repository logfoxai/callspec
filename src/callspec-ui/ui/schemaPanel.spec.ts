import {test} from 'kizu';
import {renderRouteErrorsSection, renderSchemaExamplePanel} from './schemaPanel';

test('error-card schema toggle stays in-flow (no seam overlap)', (assert) => {

    const html = renderRouteErrorsSection({
        name: 'healthcheck',
        auth: 'none',
        errors: {},
    });

    assert.equal(html.includes('error-card-schema__head'), true);
    assert.equal(html.includes('error-card-schema__toggle'), false);

});

test('renderSchemaExamplePanel: schema and example views with toggle', (assert) => {

    const html = renderSchemaExamplePanel({
        panelId: 'request',
        title: 'Request',
        schema: {
            type: 'object',
            properties: {message: {type: 'string'}},
            required: ['message'],
        },
    });

    assert.equal(html.includes('data-schema-panel="request"'), true);
    assert.equal(html.includes('class="schema-view-toggle"'), true);
    assert.equal(html.includes('>Schema</button>'), true);
    assert.equal(html.includes('schema-view-toggle__btn--active'), true);
    assert.equal(html.includes('data-view="example">'), true);
    assert.equal(html.includes('data-view="schema" hidden'), true);
    assert.equal(html.includes('>Example</button>'), true);
    assert.equal(html.includes('schema-panel__view'), true);
    assert.equal(html.includes('data-schema-toggle="request"'), true);
    assert.equal(html.includes('message'), true);

});

test('renderRouteErrorsSection: groups built-in and domain errors', (assert) => {

    const html = renderRouteErrorsSection({
        name: 'register',
        auth: 'none',
        errors: {
            USER_EXISTS: {
                status: 409,
                data: {type: 'object', properties: {email: {type: 'string'}}},
            },
        },
    });

    assert.equal(html.includes('error-group-title">Built-in'), true);
    assert.equal(html.includes('error-group-title">Domain'), true);
    assert.equal(html.includes('class="section errors-section"'), true);
    assert.equal(html.includes('<details class="error-card">'), true);
    assert.equal(html.includes('error-card-caret'), true);
    assert.equal(html.includes('error-card" open'), false);
    assert.equal(html.includes('INTERNAL_ERROR'), true);
    assert.equal(html.includes('NETWORK_ERROR'), true);
    assert.equal(html.includes('USER_EXISTS'), true);

});
