import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {defineErrors, err} from './defineErrors';
import {route} from './route';
import {executeRoute} from './executeRoute';

test('route wires handler for spec', async (assert) => {

    const productErr = defineErrors({
        PRODUCT_DISCONTINUED: {},
    });

    const getProductById = route({
        input: p.object({id: p.string()}),
        output: p.object({id: p.string(), name: p.string()}),
        errors: productErr,
        meta: {summary: 'Get product', tags: ['catalog']},
        auth: 'none',
        handler: async (input, _ctx) => {

            if (input.id === 'missing') return err.NOT_FOUND();

            return {id: input.id, name: 'Widget'};

        },
    });

    assert.equal(
        await executeRoute(getProductById, {id: 'sku-1'}, undefined),
        {id: 'sku-1', name: 'Widget'},
        'success path',
    );

    assert.equal(
        await executeRoute(getProductById, {id: 'missing'}, undefined),
        err.NOT_FOUND(),
        'builtin not found',
    );

    assert.equal(typeof getProductById.handler, 'function', 'handler on wired route');

});

test('route rejects non-2-arg handlers', (assert) => {

    assert.throws(
        () => route({
            input: p.object({}),
            output: p.any(),
            meta: {summary: 'x', tags: ['t']},
            handler: (() => 'ok') as unknown as (input: unknown, ctx: unknown) => string,
        }),
        /arity 2/,
        'throws on 0-arg handler',
    );

    assert.throws(
        () => route({
            meta: {summary: 'x', tags: ['t']},
            handler: ((_ctx: unknown) => undefined) as unknown as (
                input: unknown,
                ctx: unknown,
            ) => undefined,
        }),
        /arity 2/,
        'throws on 1-arg handler when input and output are omitted',
    );

});

test('route without input defaults to empty object pred', async (assert) => {

    const whoami = route({
        output: p.object({ok: p.boolean()}),
        meta: {summary: 'Whoami', tags: ['auth']},
        auth: 'none',
        handler: async (_input, _ctx) => ({ok: true}),
    });

    assert.equal(whoami.input({}).isValid, true, 'accepts {}');
    assert.equal(whoami.input({extra: 1}).isValid, false, 'rejects unknown keys');
    assert.equal(await executeRoute(whoami, {}, undefined), {ok: true});
    assert.equal(await executeRoute(whoami, undefined, undefined), {ok: true});

});

test('route without output is void success', async (assert) => {

    const destroy = route({
        input: p.object({id: p.string()}),
        meta: {summary: 'Destroy', tags: ['auth']},
        auth: 'none',
        handler: async (_input, _ctx) => undefined,
    });

    assert.equal(await executeRoute(destroy, {id: 'u1'}, undefined), null);

});

test('route without input or output works', async (assert) => {

    const ping = route({
        meta: {summary: 'Ping', tags: ['health']},
        auth: 'none',
        handler: async (_input, _ctx) => undefined,
    });

    assert.equal(ping.input({}).isValid, true);
    assert.equal(ping.input({nope: true}).isValid, false);
    assert.equal(await executeRoute(ping, {}, undefined), null);
    assert.equal(await executeRoute(ping, undefined, undefined), null);

});

test('explicit empty object input and output stay empty objects', async (assert) => {

    const explicit = route({
        input: p.object({}),
        output: p.object({}),
        meta: {summary: 'Explicit empty', tags: ['t']},
        auth: 'none',
        handler: async (_input, _ctx) => ({}),
    });

    assert.equal(explicit.input({}).isValid, true);
    assert.equal(explicit.input({extra: 1}).isValid, false);
    assert.equal(await executeRoute(explicit, {}, undefined), {});

});
