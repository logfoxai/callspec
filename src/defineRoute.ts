import type {Infer, Pred} from 'runtyp';
import {builtInErrorDefs} from './builtinErrors';
import {
    resolveRouteErrorDefs,
    type BuiltinRouteFailures,
    type DefineErrorsInput,
    type RouteFailuresFor,
} from './defineErrors';
import {type RouteResolver, type RouteMeta, type RouteAuth, type RouteScope, type McpRouteConfig, type WiredRoute} from './types';

type DefineRouteBase<I extends Pred<any>, O extends Pred<any>> = {
    input: I
    output: O
    meta: RouteMeta
    auth?: RouteAuth
    scope?: RouteScope
    mcp?: McpRouteConfig
};

/** Route with no domain errors — builtins only on the resolver return type. */
export function defineRoute<I extends Pred<any>, O extends Pred<any>, Ctx>(
    def: DefineRouteBase<I, O> & {
        errors?: undefined
        resolver: RouteResolver<Infer<I>, Infer<O>, Ctx, BuiltinRouteFailures>
    },
): WiredRoute<Infer<I>, Infer<O>, Ctx>;

/** Route with domain errors declared on `errors:`. */
export function defineRoute<
    I extends Pred<any>,
    O extends Pred<any>,
    Ctx,
    const E extends DefineErrorsInput,
>(
    def: DefineRouteBase<I, O> & {
        errors: E
        resolver: RouteResolver<Infer<I>, Infer<O>, Ctx, RouteFailuresFor<E>>
    },
): WiredRoute<Infer<I>, Infer<O>, Ctx>;

export function defineRoute<
    I extends Pred<any>,
    O extends Pred<any>,
    Ctx,
>(
    def: DefineRouteBase<I, O> & {
        errors?: DefineErrorsInput
        resolver: RouteResolver<Infer<I>, Infer<O>, Ctx, BuiltinRouteFailures>
    },
): WiredRoute<Infer<I>, Infer<O>, Ctx> {

    if (def.resolver.length !== 2) {

        throw new Error(
            `Route resolver must accept (input, ctx) — arity 2, got ${def.resolver.length}`,
        );

    }

    const domainErrors = resolveRouteErrorDefs(def.errors);

    return {
        input: def.input,
        output: def.output,
        errors: {
            ...builtInErrorDefs,
            ...domainErrors,
        },
        meta: def.meta,
        auth: def.auth ?? 'bearer',
        scope: def.scope ?? 'public',
        mcp: def.mcp,
        resolver: def.resolver,
        __callspecWired: true as const,
    };

}
