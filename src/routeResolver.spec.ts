import {test} from 'kizu';
import {predicates as p} from 'runtyp';
import {defineErrors} from './defineErrors';
import {isRouteFailure} from './errors';
import {resolverFor, type RouteResolverFor} from './routeResolver';

test('resolverFor returns the resolver unchanged — callable as a normal function', async (assert) => {

    const catalog = new Map([
        ['sku-1', {id: 'sku-1', name: 'Trail Pack', priceCents: 8900}],
    ]);

    const searchErr = defineErrors({
        PRODUCT_NOT_FOUND: {data: p.object({id: p.string()})},
    });

    const searchRoute = {
        input: p.object({id: p.string()}),
        output: p.object({name: p.string(), priceCents: p.number()}),
        errors: searchErr,
    } as const;

    const fn: RouteResolverFor<typeof searchRoute> = async (input, _ctx) => {

        const product = catalog.get(input.id);

        if (!product) return searchErr.PRODUCT_NOT_FOUND({id: input.id});

        return {name: product.name, priceCents: product.priceCents};

    };

    const resolver = resolverFor(searchRoute)(fn);

    assert.equal(resolver, fn);

    const success = await resolver({id: 'sku-1'}, {});

    assert.equal(success.name, 'Trail Pack');
    assert.equal(success.priceCents, 8900);

    const failure = await resolver({id: 'missing'}, {});

    assert.equal(isRouteFailure(failure), true);

    if (isRouteFailure(failure)) {

        assert.equal(failure.code, 'PRODUCT_NOT_FOUND');
        assert.equal((failure.data as {id: string}).id, 'missing');

    }

});
