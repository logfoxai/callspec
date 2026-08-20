import {test} from 'kizu';
import {exportedRoutes, hasBearerRoutes} from './routeVisibility';
import {predicates as p} from 'runtyp';
import {route} from './route';

test('exportedRoutes: includes only scope public routes', (assert) => {

    const routes = {
        exported: route({
            input: p.object({}),
            output: p.object({}),
            meta: {summary: 'x', description: 'x', tags: []},
            scope: 'public',
            auth: 'none',
            handler: async (_input, _ctx) => ({}),
        }),
        internal: route({
            input: p.object({}),
            output: p.object({}),
            meta: {summary: 'x', description: 'x', tags: []},
            scope: 'private',
            auth: 'none',
            handler: async (_input, _ctx) => ({}),
        }),
    };

    assert.equal(Object.keys(exportedRoutes(routes)).join(','), 'exported');
    assert.equal(Object.keys(exportedRoutes(routes, 'public')).join(','), 'exported');
    assert.equal(Object.keys(exportedRoutes(routes, 'all')).sort().join(','), 'exported,internal');

});

test('hasBearerRoutes: true when any route requires bearer auth', (assert) => {

    const routes = {
        open: route({
            input: p.object({}),
            output: p.object({}),
            meta: {summary: 'x', description: 'x', tags: []},
            auth: 'none',
            handler: async (_input, _ctx) => ({}),
        }),
        secured: route({
            input: p.object({}),
            output: p.object({}),
            meta: {summary: 'x', description: 'x', tags: []},
            auth: 'bearer',
            handler: async (_input, _ctx) => ({}),
        }),
    };

    assert.equal(hasBearerRoutes(routes), true);

});
