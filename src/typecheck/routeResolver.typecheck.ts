 
/**
 * Compile-only assertions — checked via `npm run typecheck:routes`.
 */
import {predicates as p} from 'runtyp';
import {defineRoute} from '../defineRoute';
import {defineErrors} from '../defineErrors';
import {resolverFor, type RouteResolverFor} from '../routeResolver';

type Ctx = {userId: string};

const searchInput = p.object({query: p.string()});
const searchOutput = p.object({results: p.array(p.string())});
const searchErr = defineErrors({NOT_FOUND: {}});

const searchRoute = {
    input: searchInput,
    output: searchOutput,
    errors: searchErr,
} as const;

const searchResolver = resolverFor(searchRoute)(async (input, _ctx: Ctx) => {

    void input.query;

    return {results: [input.query]};

});

defineRoute({
    ...searchRoute,
    meta: {summary: 'Search', description: 'Search', tags: ['t']},
    auth: 'none',
    handler: searchResolver,
});

const typedResolver: RouteResolverFor<typeof searchRoute, Ctx> = async (input, _ctx) => {

    return {results: [input.query]};

};

defineRoute({
    ...searchRoute,
    meta: {summary: 'Search', description: 'Search', tags: ['t']},
    auth: 'none',
    handler: typedResolver,
});

// @ts-expect-error wrong input field type
resolverFor(searchRoute)(async (_input: {query: number}, _ctx: Ctx) => ({results: []}));

// @ts-expect-error wrong success output shape
resolverFor(searchRoute)(async (_input, _ctx: Ctx) => ({results: [1]}));

// @ts-expect-error undeclared domain failure
resolverFor(searchRoute)(async (_input, _ctx: Ctx) => {

    const other = defineErrors({OTHER: {}});

    return other.OTHER();

});
