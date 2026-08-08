import type {Infer, Pred} from 'runtyp';
import {builtInErrorDefs} from './builtinErrors';
import {
    resolveRouteErrorDefs,
    type BuiltinRouteFailures,
    type DefineErrorsInput,
    type RouteFailuresFor,
} from './defineErrors';
import {type RouteHandler, type RouteMeta, type RouteAuth, type RouteScope, type McpRouteConfig, type WiredRoute} from './types';

/** Route preds and meta — the fields on `route()` besides `handler`. */
export type RouteContractInput = {
    input: Pred<any>
    output: Pred<any>
    errors?: DefineErrorsInput
    meta: RouteMeta
    auth?: RouteAuth
    scope?: RouteScope
    mcp?: McpRouteConfig
};

type RouteBase<I extends Pred<any>, O extends Pred<any>> = {
    input: I
    output: O
    meta: RouteMeta
    auth?: RouteAuth
    scope?: RouteScope
    mcp?: McpRouteConfig
};

/** Route with no domain errors — builtins only on the handler return type. */
export function route<I extends Pred<any>, O extends Pred<any>, Ctx>(
    def: RouteBase<I, O> & {
        errors?: undefined
        handler: RouteHandler<Infer<I>, Infer<O>, Ctx, BuiltinRouteFailures>
    },
): WiredRoute<Infer<I>, Infer<O>, Ctx>;

/** Route with domain errors declared on `errors:`. */
export function route<
    I extends Pred<any>,
    O extends Pred<any>,
    Ctx,
    const E extends DefineErrorsInput,
>(
    def: RouteBase<I, O> & {
        errors: E
        handler: RouteHandler<Infer<I>, Infer<O>, Ctx, RouteFailuresFor<E>>
    },
): WiredRoute<Infer<I>, Infer<O>, Ctx>;

export function route<
    I extends Pred<any>,
    O extends Pred<any>,
    Ctx,
>(
    def: RouteBase<I, O> & {
        errors?: DefineErrorsInput
        handler: RouteHandler<Infer<I>, Infer<O>, Ctx, BuiltinRouteFailures>
    },
): WiredRoute<Infer<I>, Infer<O>, Ctx> {

    if (def.handler.length !== 2) {

        throw new Error(
            `Route handler must accept (input, ctx) — arity 2, got ${def.handler.length}`,
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
        handler: def.handler,
        __callspecWired: true as const,
    };

}
