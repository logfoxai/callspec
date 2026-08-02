/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * Compile-only assertions — checked via `npm run typecheck:routes`.
 */
import {predicates as p} from 'runtyp';
import {defineRoute} from '../defineRoute';
import {defineErrors, err} from '../defineErrors';

type Ctx = {userId: string};

const searchInput = p.object({query: p.string()});
const searchOutput = p.object({results: p.array(p.string())});

async function searchResolver(input: {query: string}, _ctx: Ctx) {

    return {results: [input.query]};

}

async function wrongSearchResolver(_input: {query: number}, _ctx: Ctx) {

    return {results: [] as string[]};

}

defineRoute({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    access: 'public',
    // @ts-expect-error handler output must match output pred
    handler: async (_input, _ctx: Ctx) => ({hello: 123}),
});

async function wrongInputResolver(input: {name: number}, _ctx: Ctx) {

    return {hello: String(input.name)};

}

defineRoute({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    access: 'public',
    // @ts-expect-error handler input must match input pred
    handler: wrongInputResolver,
});

defineRoute({
    input: searchInput,
    output: searchOutput,
    meta: {summary: 'Search', description: 'Search', tags: ['t']},
    access: 'public',
    // @ts-expect-error handler input must match input pred
    handler: wrongSearchResolver,
});

defineRoute({
    input: searchInput,
    output: searchOutput,
    meta: {summary: 'Search', description: 'Search', tags: ['t']},
    access: 'public',
    handler: searchResolver,
});

async function wrongOutputResolver(_input: {name: string}, _ctx: Ctx) {

    return {hello: 123};

}

defineRoute({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    access: 'public',
    // @ts-expect-error handler output must match output pred
    handler: wrongOutputResolver,
});

async function correctResolver(input: {name: string}, _ctx: Ctx) {

    return {hello: input.name};

}

defineRoute({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    access: 'public',
    handler: correctResolver,
});

defineRoute({
    input: p.object({name: p.string()}),
    output: p.any(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    access: 'public',
    handler: correctResolver,
});

const domainErr = defineErrors({
    MY_CODE: {},
});

defineRoute({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    access: 'public',
    errors: domainErr,
    handler: (_input, _ctx: Ctx) => domainErr.MY_CODE(),
});

defineRoute({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    access: 'public',
    errors: domainErr,
    // @ts-expect-error undeclared domain failure on this route
    handler: (_input, _ctx: Ctx) => {

        const other = defineErrors({OTHER: {}});

        return other.OTHER();

    },
});

defineRoute({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    access: 'public',
    handler: (_input, _ctx: Ctx) => err.NOT_FOUND(),
});

defineRoute({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    access: 'public',
    // @ts-expect-error route without errors: allows builtins only
    handler: (_input, _ctx: Ctx) => domainErr.MY_CODE(),
});
