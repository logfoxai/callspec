import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {spec, route} from '.';
import {executeRoute} from './executeRoute';
import {CallspecUnauthorizedError, CallspecValidationError} from './errors';

test('route rejects non-2-arg handlers', (assert) => {

    assert.throws(
        () => route({
            input: p.object({}),
            output: p.any(),
            meta: {summary: 'x', description: 'x', tags: ['t']},
            handler: (() => 'ok') as unknown as (input: unknown, ctx: unknown) => string,
        }),
        /arity 2/,
        'throws on 0-arg handler',
    );

});

test('executeRoute validates and calls handler', async (assert) => {

    const r = route({
        input: p.object({n: p.number()}),
        output: p.object({double: p.number()}),
        meta: {summary: 'x', description: 'x', tags: ['t']},
        auth: 'none',
        handler: async (input: {n: number}, _ctx: unknown) => ({double: input.n * 2}),
    });

    const out = await executeRoute(r, {n: 3}, undefined);

    assert.equal(out, {double: 6}, 'handler result');

});

test('executeRoute 401 on private without ctx', async (assert) => {

    const r = route({
        input: p.object({}),
        output: p.string(),
        meta: {summary: 'x', description: 'x', tags: ['t']},
        auth: 'bearer',
        handler: async (_input: unknown, _ctx: unknown) => 'secret',
    });

    try {

        await executeRoute(r, {}, undefined);
        assert.fail('expected unauthorized');

    } catch (err) {

        assert.equal(err instanceof CallspecUnauthorizedError, true, 'unauthorized');

    }

});

test('executeRoute validation error', async (assert) => {

    const r = route({
        input: p.object({n: p.number()}),
        output: p.object({n: p.number()}),
        meta: {summary: 'x', description: 'x', tags: ['t']},
        auth: 'none',
        handler: async (input: {n: number}, _ctx: unknown) => input,
    });

    try {

        await executeRoute(r, {n: 'bad'}, undefined);
        assert.fail('expected validation error');

    } catch (err) {

        assert.equal(err instanceof CallspecValidationError, true, 'validation');

    }

});

test('executeRoute coerces ISO date input and serializes Date output', async (assert) => {

    const iso = '2024-01-15T12:00:00.000Z';
    const r = route({
        input: p.object({time: p.date()}),
        output: p.object({time: p.date()}),
        meta: {summary: 'x', description: 'x', tags: ['t']},
        auth: 'none',
        handler: async (input: {time: Date}, _ctx: unknown) => ({time: input.time}),
    });

    const out = await executeRoute(r, {time: iso}, undefined) as {time: string};

    assert.equal(typeof out.time, 'string');
    assert.equal(out.time, iso);

});

test('executeRoute does not coerce ISO strings for p.string() fields', async (assert) => {

    const iso = '2024-01-15T12:00:00.000Z';
    const r = route({
        input: p.object({created_at: p.string()}),
        output: p.object({created_at: p.string()}),
        meta: {summary: 'x', description: 'x', tags: ['t']},
        auth: 'none',
        handler: async (input: {created_at: string}, _ctx: unknown) => {

            assert.equal(typeof input.created_at, 'string');
            return input;

        },
    });

    const out = await executeRoute(r, {created_at: iso}, undefined) as {created_at: string};

    assert.equal(out.created_at, iso);

});

test('spec wires meta and routes', (assert) => {

    const api = spec({
        routes: {
            ping: route({
                input: p.object({}),
                output: p.string(),
                meta: {summary: 'Ping', description: 'Ping', tags: ['health']},
                auth: 'none',
                handler: async (_input: unknown, _ctx: unknown) => 'pong',
            }),
        },
    });

    assert.equal(typeof api.routes.ping.handler, 'function', 'spec has route');
    assert.equal(api.meta.title, undefined, 'meta starts sparse');

});

test('spec requires authenticate for bearer routes', (assert) => {

    assert.throws(
        () => spec({
            routes: {
                secret: route({
                    input: p.object({}),
                    output: p.string(),
                    meta: {summary: 'x', description: 'x', tags: ['t']},
                    auth: 'bearer',
                    handler: async (_input: unknown, _ctx: unknown) => 'secret',
                }),
            },
        }),
        /authenticate/,
    );

});
