import {test} from 'kizu';
import type {CallspecUiRoute} from '../types';
import {homeIcon, routesIcon} from './icons';
import {renderSidebar, renderSidebarRouteGroups} from './sidebarNav';

const user: CallspecUiRoute = {
    name: 'getUser',
    summary: 'Get user',
    description: '',
    tags: ['users'],
    auth: 'bearer',
    mcp: false,
    inputSchema: {},
    outputSchema: {},
};

test('sidebar Home and Routes have icons; tags sit below a page-links group', (assert) => {

    const html = renderSidebar([user], {kind: 'home'}, true, '<label class="sidebar-search-slot">search</label>');

    assert.equal(html.includes('class="sidebar-page-links"'), true);
    assert.equal(html.includes('data-view="home"'), true);
    assert.equal(html.includes('data-view="routes"'), true);
    assert.equal(html.includes(homeIcon()), true);
    assert.equal(html.includes(routesIcon()), true);
    assert.equal(html.includes('class="sidebar-search"'), true);
    assert.equal(html.indexOf('sidebar-page-links') < html.indexOf('sidebar-search'), true);
    assert.equal(html.indexOf('sidebar-search') < html.indexOf('sidebar-group'), true);
    assert.equal(html.includes('sidebar-group-label">users</span>'), true);

});

test('renderSidebarRouteGroups: tag routes only — no search chrome or Home/Routes', (assert) => {

    const html = renderSidebarRouteGroups([user], {kind: 'route', name: 'getUser'});

    assert.equal(html.includes('class="sidebar-top-level"'), true);
    assert.equal(html.includes('data-route="getUser"'), true);
    assert.equal(html.includes('sidebar-group-label">users</span>'), true);
    assert.equal(html.includes('sidebar-search'), false);
    assert.equal(html.includes('data-view="home"'), false);
    assert.equal(html.includes('data-view="routes"'), false);

});

test('renderSidebarRouteGroups: empty filter result is an empty string', (assert) => {

    assert.equal(renderSidebarRouteGroups([], {kind: 'home'}), '');

});
