import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {route} from './route';
import {listMcpTools} from './mcpTools';

const routes = {
    greet: route({
        input: p.object({name: p.string()}),
        output: p.object({hello: p.string()}),
        meta: {summary: 'Greet', tags: ['demo']},
        auth: 'none',
        mcp: true,
        handler: async (input, _ctx) => ({hello: input.name}),
    }),
    purgeCache: route({
        input: p.object({key: p.string()}),
        output: p.object({ok: p.boolean()}),
        meta: {summary: 'Purge cache', tags: ['ops']},
        auth: 'none',
        scope: 'private',
        mcp: true,
        handler: async (_input, _ctx) => ({ok: true}),
    }),
};

test('listMcpTools: default visibility omits scope private tools', (assert) => {

    assert.equal(listMcpTools(routes).map((tool) => tool.name).join(','), 'greet');

});

test('listMcpTools: visibility all includes scope private tools', (assert) => {

    assert.equal(
        listMcpTools(routes, 'all').map((tool) => tool.name).sort().join(','),
        'greet,purgeCache',
    );

});
