/* eslint-disable @typescript-eslint/explicit-function-return-type */
/**
 * Compile-only assertions — checked via `npm run typecheck:routes`.
 */
import {predicates as p} from 'runtyp';
import {route} from '../route';
import {defineErrors, err} from '../defineErrors';
import {file, type UploadedFile} from '../file';

type Ctx = {userId: string};

const searchInput = p.object({query: p.string()});
const searchOutput = p.object({results: p.array(p.string())});

async function searchHandler(input: {query: string}, _ctx: Ctx) {

    return {results: [input.query]};

}

async function wrongSearchHandler(_input: {query: number}, _ctx: Ctx) {

    return {results: [] as string[]};

}

route({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    // @ts-expect-error handler output must match output pred
    handler: async (_input, _ctx: Ctx) => ({hello: 123}),
});

async function wrongInputHandler(input: {name: number}, _ctx: Ctx) {

    return {hello: String(input.name)};

}

route({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    // @ts-expect-error handler input must match input pred
    handler: wrongInputHandler,
});

route({
    input: searchInput,
    output: searchOutput,
    meta: {summary: 'Search', description: 'Search', tags: ['t']},
    auth: 'none',
    // @ts-expect-error handler input must match input pred
    handler: wrongSearchHandler,
});

route({
    input: searchInput,
    output: searchOutput,
    meta: {summary: 'Search', description: 'Search', tags: ['t']},
    auth: 'none',
    handler: searchHandler,
});

async function wrongOutputHandler(_input: {name: string}, _ctx: Ctx) {

    return {hello: 123};

}

route({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    // @ts-expect-error handler output must match output pred
    handler: wrongOutputHandler,
});

async function correctHandler(input: {name: string}, _ctx: Ctx) {

    return {hello: input.name};

}

route({
    input: p.object({name: p.string()}),
    output: p.object({hello: p.string()}),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    handler: correctHandler,
});

route({
    input: p.object({name: p.string()}),
    output: p.any(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    handler: correctHandler,
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
    handler: (_input, _ctx: Ctx) => domainErr.MY_CODE(),
});

route({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    errors: domainErr,
    // @ts-expect-error undeclared domain failure on this route
    handler: (_input, _ctx: Ctx) => {

        const other = defineErrors({OTHER: {}});

        return other.OTHER();

    },
});

route({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    handler: (_input, _ctx: Ctx) => err.NOT_FOUND(),
});

route({
    input: p.object({}),
    output: p.string(),
    meta: {summary: 'x', description: 'x', tags: ['t']},
    auth: 'none',
    // @ts-expect-error route without errors: allows builtins only
    handler: (_input, _ctx: Ctx) => domainErr.MY_CODE(),
});

route({
    input: p.object({file: file({mime: ['image/png']})}),
    output: p.object({filename: p.string()}),
    meta: {summary: 'Upload', tags: ['user']},
    auth: 'none',
    handler: async (input, _ctx: Ctx) => {

        const uploaded: UploadedFile = input.file;

        return {filename: uploaded.filename};

    },
});

route({
    input: p.object({file: file()}),
    output: p.object({filename: p.string()}),
    meta: {summary: 'Upload', tags: ['user']},
    auth: 'none',
    // @ts-expect-error handler file field must be UploadedFile, not string
    handler: async (input: {file: string}, _ctx: Ctx) => ({filename: input.file}),
});
