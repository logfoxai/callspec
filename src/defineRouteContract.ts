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

/** Contract handle — preds, meta, and typed `resolverFor` / `withResolver` helpers. */
export type RouteContract<Def extends RouteContractInput> = Def & {
    resolverFor<Fn extends RouteResolverFor<Def, ResolverCtx<Fn>>>(fn: Fn): Fn
    withResolver<Fn extends RouteResolverFor<Def, ResolverCtx<Fn>>>(
        resolver: Fn,
    ): RouteDef<Infer<Def['input']>, Infer<Def['output']>, ResolverCtx<Fn>>
};

/** Step 1 — declare preds, errors, and route meta; then `.resolverFor` / `.withResolver`. */
export function defineRouteContract<const Def extends RouteContractInput>(def: Def): RouteContract<Def> {

    return {
        ...def,
        resolverFor<Fn extends RouteResolverFor<Def, ResolverCtx<Fn>>>(fn: Fn): Fn {

            return fn;

        },
        withResolver<Fn extends RouteResolverFor<Def, ResolverCtx<Fn>>>(
            fn: Fn,
        ): RouteDef<Infer<Def['input']>, Infer<Def['output']>, ResolverCtx<Fn>> {

            return resolveRoute(def, fn);

        },
    };

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
