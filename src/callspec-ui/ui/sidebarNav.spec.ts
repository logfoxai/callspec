import {test} from 'kizu';
import type {CallspecUiRoute} from '../types';
import {homeIcon, routesIcon} from './icons';
import {
    renderSidebar,
    renderSidebarRouteGroups,
    sidebarRouteGroupsOptions,
} from './sidebarNav';

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

const alpha: CallspecUiRoute = {
    ...user,
    name: 'listUsers',
    tags: ['alpha'],
};

const beta: CallspecUiRoute = {
    ...user,
    name: 'getUser',
    tags: ['beta'],
};

test('sidebar omits Home when showHome is false', (assert) => {

    const html = renderSidebar([user], {kind: 'routes'}, false);

    assert.equal(html.includes('data-view="home"'), false);
    assert.equal(html.includes('data-view="routes"'), true);
    assert.equal(html.includes(homeIcon()), false);
    assert.equal(html.includes(routesIcon()), true);

});

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

test('renderSidebarRouteGroups: tag groups collapsed by default', (assert) => {

    const html = renderSidebarRouteGroups([alpha, beta], {kind: 'home'});

    assert.equal((html.match(/<details open>/g) ?? []).length, 0);

});

test('renderSidebarRouteGroups: opens the active route group when collapsed by default', (assert) => {

    const html = renderSidebarRouteGroups([alpha, beta], {kind: 'route', name: 'getUser'});

    assert.equal((html.match(/<details open>/g) ?? []).length, 1);
    assert.equal(html.includes('sidebar-link--active'), true);
    assert.equal(html.includes('data-route="getUser"'), true);

});

test('renderSidebarRouteGroups: expandAll opens every group while searching', (assert) => {

    const html = renderSidebarRouteGroups([alpha, beta], {kind: 'home'}, {expandAll: true});

    assert.equal((html.match(/<details open>/g) ?? []).length, 2);

});

test('sidebarRouteGroupsOptions: search text expands all groups', (assert) => {

    assert.equal(sidebarRouteGroupsOptions({kind: 'home'}, 'get', null).expandAll, true);

});

test('renderSidebarRouteGroups: preserves collapsed groups across re-renders', (assert) => {

    const html = renderSidebarRouteGroups(
        [alpha, beta],
        {kind: 'route', name: 'getUser'},
        {openTags: new Set(['beta'])},
    );

    assert.equal((html.match(/<details open>/g) ?? []).length, 1);
    assert.equal(/sidebar-group-label">alpha<\/span>[\s\S]{0,120}<details open>/.test(html), false);

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
