/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * Compile-only assertions — checked via `npm run typecheck:routes`.
 */
import {predicates as p} from 'runtyp';
import {route} from '../route';
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

route({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    // @ts-expect-error handler output must match output pred
    resolver: async (_input, _ctx: Ctx) => ({hello: 123}),
});

async function wrongInputResolver(input: {name: number}, _ctx: Ctx) {

    return {hello: String(input.name)};

}

route({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    // @ts-expect-error handler input must match input pred
    resolver: wrongInputResolver,
});

route({
    input: searchInput,
    output: searchOutput,
    meta: {summary: 'Search', description: 'Search', tags: ['t']},
    auth: 'none',
    // @ts-expect-error handler input must match input pred
    resolver: wrongSearchResolver,
});

route({
    input: searchInput,
    output: searchOutput,
    meta: {summary: 'Search', description: 'Search', tags: ['t']},
    auth: 'none',
    resolver: searchResolver,
});

async function wrongOutputResolver(_input: {name: string}, _ctx: Ctx) {

    return {hello: 123};

}

route({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    // @ts-expect-error handler output must match output pred
    resolver: wrongOutputResolver,
});

async function correctResolver(input: {name: string}, _ctx: Ctx) {

    return {hello: input.name};

}

route({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    resolver: correctResolver,
});

route({
    input: p.object({name: p.string()}),
    output: p.any(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    resolver: correctResolver,
});

const domainErr = defineErrors({
    MY_CODE: {},
});

route({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    errors: domainErr,
    resolver: (_input, _ctx: Ctx) => domainErr.MY_CODE(),
});

route({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    errors: domainErr,
    // @ts-expect-error undeclared domain failure on this route
    resolver: (_input, _ctx: Ctx) => {

        const other = defineErrors({OTHER: {}});

        return other.OTHER();

    },
});

route({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    resolver: (_input, _ctx: Ctx) => err.NOT_FOUND(),
});

route({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    // @ts-expect-error route without errors: allows builtins only
    resolver: (_input, _ctx: Ctx) => domainErr.MY_CODE(),
});
