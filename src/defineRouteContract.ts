import type {Infer, Pred} from 'runtyp';
import {defineRoute} from './defineRoute';
import type {DefineErrorsInput} from './defineErrors';
import type {RouteResolverFor} from './routeResolver';
import type {McpRouteConfig, RouteAuth, RouteDef, RouteMeta, RouteScope} from './types';

/** Route wire contract and meta — everything passed to `defineSpec` except the resolver. */
export type RouteContractInput = {
    input: Pred<any>
    output: Pred<any>
    errors?: DefineErrorsInput
    meta: RouteMeta
    auth?: RouteAuth
    scope?: RouteScope
    mcp?: McpRouteConfig
};

type ResolverCtx<Fn> = Fn extends (input: any, ctx: infer C) => any ? C : unknown;

/** Step 1 — declare preds, errors, and route meta once; share with `resolverFor` and tests. */
export function defineRouteContract<const Def extends RouteContractInput>(def: Def): Def {

    return def;

}

/** Step 2 — attach a typed resolver; result is a `defineRoute` entry for `defineSpec`. */
export function resolveRoute<
    const Def extends RouteContractInput,
    Fn extends RouteResolverFor<Def, ResolverCtx<Fn>>,
>(contract: Def, resolver: Fn): RouteDef<Infer<Def['input']>, Infer<Def['output']>, ResolverCtx<Fn>> {

    return defineRoute({
        ...contract,
        resolver,
    } as Parameters<typeof defineRoute>[0]);

}
