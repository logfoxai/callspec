import {test} from 'kizu';
import {renderRouteHeader, renderRouteLead} from './routeHeader';
import type {CallspecUiRoute} from '../types';

const base: CallspecUiRoute = {
    name: 'getTweet',
    summary: 'Get Tweet by ID',
    description: 'Returns a Tweet specified by the requested ID.',
    auth: 'bearer',
    mcp: false,
    tags: [],
    inputSchema: {},
    outputSchema: {},
};

test('route header: docs-style title from meta.summary, no back button', (assert) => {

    const html = renderRouteHeader(base);

    assert.equal(html.includes('breadcrumb'), false);
    assert.equal(html.includes('All routes'), false);
    // Title is route.summary (from route({ meta: { summary } })).
    assert.equal(html.includes('<h1 class="route-title">Get Tweet by ID</h1>'), true);
    assert.equal(html.includes('class="method"'), true);
    assert.equal(html.includes('POST'), true);
    assert.equal(html.includes('class="route-name"'), true);
    assert.equal(html.includes('getTweet'), true);
    // Lead/description is a separate panel below the full-width divider.
    assert.equal(html.includes('route-desc'), false);
    assert.equal(
        renderRouteLead(base).includes('Returns a Tweet specified by the requested ID.'),
        true,
    );

});

test('route header: falls back to route name when summary empty', (assert) => {

    const html = renderRouteHeader({...base, summary: ''});

    assert.equal(html.includes('<h1 class="route-title">getTweet</h1>'), true);
    // Don't duplicate the name under an identical title.
    assert.equal(html.includes('class="route-name"'), false);

});
