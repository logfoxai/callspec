/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * Compile-only assertions — checked via `npm run typecheck:routes`.
 */
import {predicates as p} from 'runtyp';
import {defineErrors, err} from '../defineErrors';
import {spec} from '../defineSpec';
import {route} from '../route';
import type {ResolverFor} from '../routeResolver';

type Ctx = {userId: string};

const productErr = defineErrors({
    PRODUCT_DISCONTINUED: {},
});

const getProductByIdPreds = {
    input: p.object({id: p.string()}),
    output: p.object({id: p.string(), name: p.string()}),
    errors: productErr,
    meta: {summary: 'Get product', tags: ['catalog']},
    auth: 'none',
} as const;

const getProductByIdResolver: ResolverFor<typeof getProductByIdPreds, Ctx> = async (input, _ctx) => {

    if (input.id === 'missing') return err.NOT_FOUND();

    return {id: input.id, name: 'Widget'};

};

const getProductById = route({
    input: getProductByIdPreds.input,
    output: getProductByIdPreds.output,
    errors: getProductByIdPreds.errors,
    meta: getProductByIdPreds.meta,
    auth: getProductByIdPreds.auth,
    resolver: getProductByIdResolver,
});

void getProductById.resolver;

spec<Ctx>({
    routes: {getProductById},
});

async function wrongInputResolver(input: {id: number}, _ctx: Ctx) {

    return {id: String(input.id), name: 'x'};

}

route({
    input: getProductByIdPreds.input,
    output: getProductByIdPreds.output,
    errors: getProductByIdPreds.errors,
    meta: getProductByIdPreds.meta,
    auth: getProductByIdPreds.auth,
    // @ts-expect-error resolver input must match route input pred
    resolver: wrongInputResolver,
});

async function wrongOutputResolver(input: {id: string}, _ctx: Ctx) {

    return {id: input.id, name: 123};

}

route({
    input: getProductByIdPreds.input,
    output: getProductByIdPreds.output,
    errors: getProductByIdPreds.errors,
    meta: getProductByIdPreds.meta,
    auth: getProductByIdPreds.auth,
    // @ts-expect-error resolver output must match route output pred
    resolver: wrongOutputResolver,
});

route({
    input: getProductByIdPreds.input,
    output: getProductByIdPreds.output,
    errors: getProductByIdPreds.errors,
    meta: getProductByIdPreds.meta,
    auth: getProductByIdPreds.auth,
    // @ts-expect-error undeclared domain failure
    resolver: async (_input, _ctx: Ctx) => {

        const other = defineErrors({OTHER: {}});

        return other.OTHER();

    },
});

const noErrorsPreds = {
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'Hello', tags: ['demo']},
    auth: 'none',
} as const;

route({
    input: noErrorsPreds.input,
    output: noErrorsPreds.output,
    meta: noErrorsPreds.meta,
    auth: noErrorsPreds.auth,
    // @ts-expect-error route without errors allows builtins only
    resolver: async (_input, _ctx: Ctx) => {

        const domain = defineErrors({MY_CODE: {}});

        return domain.MY_CODE();

    },
});

// @ts-expect-error resolver is required on route()
route({
    input: p.object({id: p.string()}),
    output: p.object({id: p.string(), name: p.string()}),
    errors: productErr,
    meta: {summary: 'Get product', tags: ['catalog']},
    auth: 'none',
});
