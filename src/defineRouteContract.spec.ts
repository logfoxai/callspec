import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {defineErrors, err} from './defineErrors';
import {defineRouteContract, resolveRoute} from './defineRouteContract';
import {executeRoute} from './executeRoute';
import {resolverFor} from './routeResolver';

test('resolveRoute matches defineRoute behavior', async (assert) => {

    const productErr = defineErrors({
        PRODUCT_DISCONTINUED: {},
    });

    const contract = defineRouteContract({
        input: p.object({id: p.string()}),
        output: p.object({id: p.string(), name: p.string()}),
        errors: productErr,
        meta: {summary: 'Get product', tags: ['catalog']},
        auth: 'none',
    });

    const resolver = resolverFor(contract)(async (input, _ctx) => {

        if (input.id === 'missing') return err.NOT_FOUND();

        return {id: input.id, name: 'Widget'};

    });

    const route = resolveRoute(contract, resolver);

    assert.equal(
        await executeRoute(route, {id: 'sku-1'}, undefined),
        {id: 'sku-1', name: 'Widget'},
        'success path',
    );

    assert.equal(
        await executeRoute(route, {id: 'missing'}, undefined),
        err.NOT_FOUND(),
        'builtin not found',
    );

});

test('resolveRoute rejects non-2-arg resolvers', (assert) => {

    const contract = defineRouteContract({
        input: p.object({}),
        output: p.any(),
        meta: {summary: 'x', tags: ['t']},
    });

    assert.throws(
        () => resolveRoute(
            contract,
            (() => 'ok') as unknown as (input: unknown, ctx: unknown) => string,
        ),
        /arity 2/,
        'throws on 0-arg resolver',
    );

});
