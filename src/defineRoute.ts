import type {Infer, Pred} from 'runtyp';
import {builtInErrorDefs} from './builtinErrors';
import {
    resolveRouteErrorDefs,
    type BuiltinRouteFailures,
    type DefineErrorsInput,
    type RouteFailuresFor,
} from './defineErrors';
import type {RouteDef, RouteHandler, RouteMeta, RouteAuth, RouteScope, McpRouteConfig} from './types';

type DefineRouteBase<I extends Pred<any>, O extends Pred<any>> = {
    input: I
    output: O
    meta: RouteMeta
    auth?: RouteAuth
    scope?: RouteScope
    mcp?: McpRouteConfig
};

/** Route with no domain errors — builtins only on the handler return type. */
export function defineRoute<I extends Pred<any>, O extends Pred<any>, Ctx>(
    def: DefineRouteBase<I, O> & {
        errors?: undefined
        handler: RouteHandler<Infer<I>, Infer<O>, Ctx, BuiltinRouteFailures>
    },
): RouteDef<Infer<I>, Infer<O>, Ctx>;

/** Route with domain errors declared on `errors:`. */
export function defineRoute<
    I extends Pred<any>,
    O extends Pred<any>,
    Ctx,
    const E extends DefineErrorsInput,
>(
    def: DefineRouteBase<I, O> & {
        errors: E
        handler: RouteHandler<Infer<I>, Infer<O>, Ctx, RouteFailuresFor<E>>
    },
): RouteDef<Infer<I>, Infer<O>, Ctx>;

export function defineRoute<
    I extends Pred<any>,
    O extends Pred<any>,
    Ctx,
>(
    def: DefineRouteBase<I, O> & {
        errors?: DefineErrorsInput
        handler: RouteHandler<Infer<I>, Infer<O>, Ctx, BuiltinRouteFailures>
    },
): RouteDef<Infer<I>, Infer<O>, Ctx> {

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
    };

}
