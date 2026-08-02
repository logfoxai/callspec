import type {Infer, Pred} from 'runtyp';
import {mergeDomainErrorDefs} from './builtinErrors';
import {resolveRouteErrorDefs, type DefineErrorsInput} from './defineErrors';
import type {RouteDef, RouteHandler, RouteMeta, RouteAccess, McpRouteConfig} from './types';

export function defineRoute<
    I extends Pred<any>,
    O extends Pred<any>,
    Ctx,
>(
    def: {
        input: I
        output: O
        meta: RouteMeta
        access?: RouteAccess
        mcp?: McpRouteConfig
        errors?: DefineErrorsInput
        handler: RouteHandler<Infer<I>, Infer<O>, Ctx>
    },
): RouteDef<Infer<I>, Infer<O>, Ctx> {

    if (def.handler.length !== 2) {

        throw new Error(
            `Route handler must accept (input, ctx) — arity 2, got ${def.handler.length}`,
        );

    }

    return {
        input: def.input,
        output: def.output,
        errors: mergeDomainErrorDefs(resolveRouteErrorDefs(def.errors)),
        meta: def.meta,
        access: def.access ?? 'private',
        mcp: def.mcp,
        handler: def.handler,
    };

}
