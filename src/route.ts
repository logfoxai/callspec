import type {Infer, Pred} from 'runtyp';
import {builtInErrorDefs} from './builtinErrors';
import {
    resolveRouteErrorDefs,
    type BuiltinRouteFailures,
    type DefineErrorsInput,
    type RouteFailuresFor,
} from './defineErrors';
import {emptyObjectInput, voidSuccess} from './routeDefaults';
import {type RouteHandler, type RouteMeta, type RouteAuth, type RouteScope, type McpRouteConfig, type WiredRoute} from './types';

/** Route preds and meta — the fields on `route()` besides `handler`. */
export type RouteContractInput = {
    input?: Pred<any>
    output?: Pred<any>
    errors?: DefineErrorsInput
    meta: RouteMeta
    auth?: RouteAuth
    scope?: RouteScope
    mcp?: McpRouteConfig
};

type RouteBase = {
    meta: RouteMeta
    auth?: RouteAuth
    scope?: RouteScope
    mcp?: McpRouteConfig
};

type InferPred<T> = T extends Pred<infer U> ? U : never;

type InferredInput<I> = [I] extends [undefined]
    ? Infer<typeof emptyObjectInput>
    : InferPred<I>;
type InferredOutput<O> = [O] extends [undefined]
    ? void
    : InferPred<O>;

/** Route with no domain errors — builtins only on the handler return type. */
export function route<
    I extends Pred<any> | undefined,
    O extends Pred<any> | undefined,
    Ctx,
>(
    def: RouteBase & {
        input?: I
        output?: O
        errors?: undefined
        handler: RouteHandler<InferredInput<I>, InferredOutput<O>, Ctx, BuiltinRouteFailures>
    },
): WiredRoute<InferredInput<I>, InferredOutput<O>, Ctx>;

/** Route with domain errors declared on `errors:`. */
export function route<
    I extends Pred<any> | undefined,
    O extends Pred<any> | undefined,
    Ctx,
    const E extends DefineErrorsInput,
>(
    def: RouteBase & {
        input?: I
        output?: O
        errors: E
        handler: RouteHandler<InferredInput<I>, InferredOutput<O>, Ctx, RouteFailuresFor<E>>
    },
): WiredRoute<InferredInput<I>, InferredOutput<O>, Ctx>;

export function route<
    I extends Pred<any> | undefined,
    O extends Pred<any> | undefined,
    Ctx,
>(
    def: RouteBase & {
        input?: I
        output?: O
        errors?: DefineErrorsInput
        handler: RouteHandler<InferredInput<I>, InferredOutput<O>, Ctx, BuiltinRouteFailures>
    },
): WiredRoute<InferredInput<I>, InferredOutput<O>, Ctx> {

    if (def.handler.length !== 2) {

        throw new Error(
            `Route handler must accept (input, ctx) — arity 2, got ${def.handler.length}`,
        );

    }

    const domainErrors = resolveRouteErrorDefs(def.errors);

    return {
        input: def.input ?? emptyObjectInput,
        output: def.output ?? voidSuccess,
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
