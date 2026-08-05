import {test} from 'kizu';
import {exportedRoutes, hasBearerRoutes} from './routeVisibility';
import {predicates as p} from 'runtyp';
import {defineRoute} from './defineRoute';

test('exportedRoutes: includes only scope public routes', (assert) => {

    const routes = {
        exported: defineRoute({
            input: p.object({}),
            output: p.object({}),
            meta: {summary: 'x', description: 'x', tags: []},
            scope: 'public',
            auth: 'none',
            handler: async (_input, _ctx) => ({}),
        }),
        internal: defineRoute({
            input: p.object({}),
            output: p.object({}),
            meta: {summary: 'x', description: 'x', tags: []},
            scope: 'private',
            auth: 'none',
            handler: async (_input, _ctx) => ({}),
        }),
    };

    assert.equal(Object.keys(exportedRoutes(routes)).join(','), 'exported');

});

test('hasBearerRoutes: true when any route requires bearer auth', (assert) => {

    const routes = {
        open: defineRoute({
            input: p.object({}),
            output: p.object({}),
            meta: {summary: 'x', description: 'x', tags: []},
            auth: 'none',
            handler: async (_input, _ctx) => ({}),
        }),
        secured: defineRoute({
            input: p.object({}),
            output: p.object({}),
            meta: {summary: 'x', description: 'x', tags: []},
            auth: 'bearer',
            handler: async (_input, _ctx) => ({}),
        }),
    };

    assert.equal(hasBearerRoutes(routes), true);

});
