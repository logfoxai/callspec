 
/**
 * Compile-only assertions — checked via `npm run typecheck:routes`.
 */
import {predicates as p} from 'runtyp';
import {defineErrors} from '../defineErrors';
import {route} from '../route';
import type {HandlerFor} from '../routeHandler';

type Ctx = {userId: string};

const searchInput = p.object({query: p.string()});
const searchOutput = p.object({results: p.array(p.string())});
const searchErr = defineErrors({NOT_FOUND: {}});

const searchPreds = {
    input: searchInput,
    output: searchOutput,
    errors: searchErr,
    meta: {summary: 'Search', tags: ['t']},
    auth: 'none',
} as const;

const searchHandler: HandlerFor<typeof searchPreds, Ctx> = async (input, _ctx) => {

    void input.query;

    return {results: [input.query]};

};

route({
    input: searchPreds.input,
    output: searchPreds.output,
    errors: searchPreds.errors,
    meta: searchPreds.meta,
    auth: searchPreds.auth,
    handler: searchHandler,
});

const typedHandler: HandlerFor<typeof searchPreds, Ctx> = async (input, _ctx) => {

    return {results: [input.query]};

};

route({
    input: searchPreds.input,
    output: searchPreds.output,
    errors: searchPreds.errors,
    meta: searchPreds.meta,
    auth: searchPreds.auth,
    handler: typedHandler,
});

route({
    input: searchPreds.input,
    output: searchPreds.output,
    errors: searchPreds.errors,
    meta: searchPreds.meta,
    auth: searchPreds.auth,
    // @ts-expect-error wrong input field type
    handler: async (_input: {query: number}, _ctx: Ctx) => ({results: []}),
});

route({
    input: searchPreds.input,
    output: searchPreds.output,
    errors: searchPreds.errors,
    meta: searchPreds.meta,
    auth: searchPreds.auth,
    // @ts-expect-error wrong success output shape
    handler: async (_input, _ctx: Ctx) => ({results: [1]}),
});

route({
    input: searchPreds.input,
    output: searchPreds.output,
    errors: searchPreds.errors,
    meta: searchPreds.meta,
    auth: searchPreds.auth,
    // @ts-expect-error undeclared domain failure
    handler: async (_input, _ctx: Ctx) => {

        const other = defineErrors({OTHER: {}});

        return other.OTHER();

    },
});
