/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * Compile-only assertions — checked via `npm run typecheck:routes`.
 */
import {predicates as p} from 'runtyp';
import {defineErrors, err} from '../defineErrors';
import {defineRouteContract, resolveRoute} from '../defineRouteContract';
import {resolverFor} from '../routeResolver';

type Ctx = {userId: string};

const productErr = defineErrors({
    PRODUCT_DISCONTINUED: {},
});

const getProductByIdContract = defineRouteContract({
    input: p.object({id: p.string()}),
    output: p.object({id: p.string(), name: p.string()}),
    errors: productErr,
    meta: {summary: 'Get product', tags: ['catalog']},
    auth: 'none',
});

const getProductByIdResolver = resolverFor(getProductByIdContract)(async (input, _ctx: Ctx) => {

    if (input.id === 'missing') return err.NOT_FOUND();

    return {id: input.id, name: 'Widget'};

});

resolveRoute(getProductByIdContract, getProductByIdResolver);

async function wrongInputResolver(input: {id: number}, _ctx: Ctx) {

    return {id: String(input.id), name: 'x'};

}

resolveRoute(
    getProductByIdContract,
    // @ts-expect-error resolver input must match contract input pred
    wrongInputResolver,
);

async function wrongOutputResolver(input: {id: string}, _ctx: Ctx) {

    return {id: input.id, name: 123};

}

resolveRoute(
    getProductByIdContract,
    // @ts-expect-error resolver output must match contract output pred
    wrongOutputResolver,
);

resolveRoute(
    getProductByIdContract,
    // @ts-expect-error undeclared domain failure
    async (_input, _ctx: Ctx) => {

        const other = defineErrors({OTHER: {}});

        return other.OTHER();

    },
);

const noErrorsContract = defineRouteContract({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'Hello', tags: ['demo']},
    auth: 'none',
});

resolveRoute(
    noErrorsContract,
    // @ts-expect-error route without errors allows builtins only
    async (_input, _ctx: Ctx) => {

        const domain = defineErrors({MY_CODE: {}});

        return domain.MY_CODE();

    },
);
