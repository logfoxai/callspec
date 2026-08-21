import {test} from 'kizu';
import type {CallspecUiRoute} from '../types';
import {homeIcon, routesIcon} from './icons';
import {renderSidebar} from './sidebarNav';

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
