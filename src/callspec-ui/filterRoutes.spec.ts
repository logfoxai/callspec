import {test} from 'kizu';
import {
    applyRouteFilters,
    groupRoutesByTag,
    neighborsInTagGroup,
    routeNeighbors,
    type RouteFilterable,
    type RouteFilters,
} from './filterRoutes';

const routes: RouteFilterable[] = [
    {
        name: 'createUser',
        summary: 'Create a user',
        description: 'Registers a new account',
        tags: ['users'],
        auth: 'bearer',
        mcp: true,
    },
    {
        name: 'getUser',
        summary: 'Get user',
        description: 'Fetch by id',
        tags: ['users'],
        auth: 'bearer',
        mcp: false,
    },
    {
        name: 'healthcheck',
        summary: 'Health check',
        description: 'Liveness probe',
        tags: ['system'],
        auth: 'none',
        mcp: false,
    },
    {
        name: 'searchLogs',
        summary: 'Search logs',
        description: 'Query events by team',
        tags: ['logs', 'ops'],
        auth: 'bearer',
        mcp: true,
    },
];

const baseFilters: RouteFilters = {
    text: '',
    auth: 'all',
    tag: null,
    mcpOnly: false,
};

test('applyRouteFilters: matches name, summary, description, and tags', (assert) => {

    assert.equal(
        applyRouteFilters(routes, {...baseFilters, text: 'create'}).map((r) => r.name),
        ['createUser'],
    );
    assert.equal(
        applyRouteFilters(routes, {...baseFilters, text: 'liveness'}).map((r) => r.name),
        ['healthcheck'],
    );
    assert.equal(
        applyRouteFilters(routes, {...baseFilters, text: 'Fetch'}).map((r) => r.name),
        ['getUser'],
    );
    assert.equal(
        applyRouteFilters(routes, {...baseFilters, text: 'ops'}).map((r) => r.name),
        ['searchLogs'],
    );

});

test('applyRouteFilters: auth, tag, and mcpOnly combine with text', (assert) => {

    assert.equal(
        applyRouteFilters(routes, {...baseFilters, auth: 'none'}).map((r) => r.name),
        ['healthcheck'],
    );
    assert.equal(
        applyRouteFilters(routes, {...baseFilters, tag: 'users', text: 'get'}).map((r) => r.name),
        ['getUser'],
    );
    assert.equal(
        applyRouteFilters(routes, {...baseFilters, mcpOnly: true}).map((r) => r.name),
        ['createUser', 'searchLogs'],
    );

});

test('groupRoutesByTag: sorts tags and routes alphabetically', (assert) => {

    const groups = groupRoutesByTag(routes);
    const tags = [...groups.keys()];

    assert.equal(tags, ['logs', 'ops', 'system', 'users']);
    assert.equal(groups.get('users')?.map((r) => r.name), ['createUser', 'getUser']);

});

test('neighborsInTagGroup: prev/next within primary tag, alphabetical', (assert) => {

    assert.equal(neighborsInTagGroup(routes, 'getUser'), {
        tag: 'users',
        prev: 'createUser',
        next: null,
    });
    assert.equal(neighborsInTagGroup(routes, 'createUser'), {
        tag: 'users',
        prev: null,
        next: 'getUser',
    });
    assert.equal(neighborsInTagGroup(routes, 'healthcheck'), {
        tag: 'system',
        prev: null,
        next: null,
    });

});

test('routeNeighbors: prev/next across tags in sidebar order', (assert) => {

    assert.equal(routeNeighbors(routes, 'searchLogs'), {
        prev: null,
        next: 'healthcheck',
    });
    assert.equal(routeNeighbors(routes, 'healthcheck'), {
        prev: 'searchLogs',
        next: 'createUser',
    });
    assert.equal(routeNeighbors(routes, 'createUser'), {
        prev: 'healthcheck',
        next: 'getUser',
    });
    assert.equal(routeNeighbors(routes, 'getUser'), {
        prev: 'createUser',
        next: null,
    });

});

test('neighborsInTagGroup: unknown route returns nulls', (assert) => {

    assert.equal(neighborsInTagGroup(routes, 'missing'), {
        tag: null,
        prev: null,
        next: null,
    });

});
