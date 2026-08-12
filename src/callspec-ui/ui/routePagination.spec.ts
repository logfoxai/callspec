import {readFileSync} from 'node:fs';
import path from 'node:path';
import {test} from 'kizu';
import type {CallspecUiRoute} from '../types';
import {renderRoutePagination} from './routePagination';

const root = path.resolve(__dirname, '../../..');

const routes: CallspecUiRoute[] = [
    {
        name: 'createUser',
        summary: 'Create a user',
        description: 'Registers a new account',
        tags: ['users'],
        auth: 'bearer',
        mcp: true,
        inputSchema: {type: 'object'},
        outputSchema: {type: 'object'},
        errors: {},
    },
    {
        name: 'getUser',
        summary: 'Get user',
        description: 'Fetch by id',
        tags: ['users'],
        auth: 'bearer',
        mcp: false,
        inputSchema: {type: 'object'},
        outputSchema: {type: 'object'},
        errors: {},
    },
    {
        name: 'healthcheck',
        summary: 'Health check',
        description: 'Liveness probe',
        tags: ['system'],
        auth: 'none',
        mcp: false,
        inputSchema: {type: 'object'},
        outputSchema: {type: 'object'},
        errors: {},
    },
];

test('renderRoutePagination: empty when no neighbors', (assert) => {

    assert.equal(renderRoutePagination('onlyRoute', [{
        name: 'onlyRoute',
        summary: 'Only route',
        description: '',
        tags: ['system'],
        auth: 'none',
        mcp: false,
        inputSchema: {type: 'object'},
        outputSchema: {type: 'object'},
        errors: {},
    }]), '');

});

test('renderRoutePagination: docs-style footer markup with prev and next', (assert) => {

    const html = renderRoutePagination('createUser', routes);

    assert.equal(html.includes('class="pagination-links"'), true);
    assert.equal(html.includes('rel="prev"'), true);
    assert.equal(html.includes('class="link-title">healthcheck</span>'), true);
    assert.equal(html.includes('rel="next"'), true);
    assert.equal(html.includes('class="link-title">getUser</span>'), true);
    assert.equal(html.includes('data-route="getUser"'), true);

});

test('renderRoutePagination: next keeps label before arrow (right-aligned card)', (assert) => {

    const html = renderRoutePagination('createUser', routes);
    const nextStart = html.indexOf('rel="next"');
    const nextHtml = html.slice(nextStart, html.indexOf('</button>', nextStart));
    const titleAt = nextHtml.indexOf('class="link-title">getUser</span>');
    const svgAt = nextHtml.indexOf('<svg');

    assert.equal(titleAt >= 0 && svgAt >= 0, true);
    assert.equal(titleAt < svgAt, true);

});

test('renderRoutePagination: previous route only', (assert) => {

    const html = renderRoutePagination('getUser', routes);

    assert.equal(html.includes('rel="prev"'), true);
    assert.equal(html.includes('Previous'), true);
    assert.equal(html.includes('class="link-title">createUser</span>'), true);
    assert.equal(html.includes('rel="next"'), false);

});

test('pagination-links: two columns so prev/next share a row (explorer + docs)', (assert) => {

    const styles = readFileSync(path.join(root, 'src/callspec-ui/ui/styles.css'), 'utf8');
    const docs = readFileSync(path.join(root, 'src/styles/starlight-custom.css'), 'utf8');

    assert.equal(
        /\.pagination-links\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(
            styles,
        ),
        true,
    );
    assert.equal(styles.includes('minmax(min(18rem, 100%), 1fr)'), false);
    assert.equal(
        /pagination-links\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(
            docs,
        ),
        true,
    );

});
