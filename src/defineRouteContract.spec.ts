import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {defineErrors, err} from './defineErrors';
import {route} from './defineRouteContract';
import {executeRoute} from './executeRoute';

test('route wires resolver for spec', async (assert) => {

    const productErr = defineErrors({
        PRODUCT_DISCONTINUED: {},
    });

    const getProductById = route({
        input: p.object({id: p.string()}),
        output: p.object({id: p.string(), name: p.string()}),
        errors: productErr,
        meta: {summary: 'Get product', tags: ['catalog']},
        auth: 'none',
        resolver: async (input, _ctx) => {

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

    assert.equal(typeof getProductById.resolver, 'function', 'resolver on wired route');

});

test('route rejects non-2-arg resolvers', (assert) => {

    assert.throws(
        () => route({
            input: p.object({}),
            output: p.any(),
            meta: {summary: 'x', tags: ['t']},
            resolver: (() => 'ok') as unknown as (input: unknown, ctx: unknown) => string,
        }),
        /arity 2/,
        'throws on 0-arg resolver',
    );

});
