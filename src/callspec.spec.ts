import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {defineRegistry, defineRoute, executeRoute} from '.';
import {CallspecUnauthorizedError, CallspecValidationError} from './errors';

test('defineRoute rejects non-2-arg handlers', (assert) => {

    assert.throws(
        () => defineRoute({
            input: p.object({}),
            meta: {summary: 'x', description: 'x', tags: ['t']},
            handler: (() => 'ok') as unknown as (input: unknown, ctx: unknown) => string,
        }),
        /arity 2/,
        'throws on 0-arg handler',
    );

});

test('executeRoute validates and calls handler', async (assert) => {

    const route = defineRoute({
        input: p.object({n: p.number()}),
        meta: {summary: 'x', description: 'x', tags: ['t']},
        access: 'public',
        handler: async (input: {n: number}, _ctx: unknown) => ({double: input.n * 2}),
    });

    const out = await executeRoute(route, {n: 3}, undefined);

    assert.equal(out, {double: 6}, 'handler result');

});

test('executeRoute 401 on private without ctx', async (assert) => {

    const route = defineRoute({
        input: p.object({}),
        meta: {summary: 'x', description: 'x', tags: ['t']},
        access: 'private',
        handler: async (_input: unknown, _ctx: unknown) => 'secret',
    });

    try {

        await executeRoute(route, {}, undefined);
        assert.fail('expected unauthorized');

    } catch (err) {

        assert.equal(err instanceof CallspecUnauthorizedError, true, 'unauthorized');

    }

});

test('executeRoute validation error', async (assert) => {

    const route = defineRoute({
        input: p.object({n: p.number()}),
        meta: {summary: 'x', description: 'x', tags: ['t']},
        access: 'public',
        handler: async (input: {n: number}, _ctx: unknown) => input,
    });

    try {

        await executeRoute(route, {n: 'bad'}, undefined);
        assert.fail('expected validation error');

    } catch (err) {

        assert.equal(err instanceof CallspecValidationError, true, 'validation');

    }

});

test('defineRegistry wires routes', (assert) => {

    const api = defineRegistry({
        ping: defineRoute({
            input: p.object({}),
            meta: {summary: 'Ping', description: 'Ping', tags: ['health']},
            access: 'public',
            handler: async (_input: unknown, _ctx: unknown) => 'pong',
        }),
    });

    assert.equal(typeof api.ping.handler, 'function', 'registry has route');

});
