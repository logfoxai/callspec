import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'kizu';
import {renderRouteErrorsSection, renderSchemaExamplePanel} from './schemaPanel';

const styles = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), 'styles.css'),
    'utf8',
);

test('error-card schema toggle stays in-flow (no seam overlap)', (assert) => {

    // Absolute + translateY(-50%) parks the Schema/Example control on the
    // description/code border and clips into both panels.
    const toggleRule = styles.match(/\.error-card-schema__toggle\s*\{[^}]+\}/)?.[0] ?? '';

    assert.equal(toggleRule.includes('position: absolute'), false);
    assert.equal(toggleRule.includes('translateY(-50%)'), false);
    assert.equal(styles.includes('error-card-schema__head'), true);

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
