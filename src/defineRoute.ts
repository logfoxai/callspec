import type {RouteDef, RouteHandler} from './types';

export function defineRoute<TInput, TOutput, Ctx>(
    def: {
        input: RouteDef<TInput, TOutput, Ctx>['input']
        output?: RouteDef<TInput, TOutput, Ctx>['output']
        meta: RouteDef<TInput, TOutput, Ctx>['meta']
        access?: RouteDef<TInput, TOutput, Ctx>['access']
        mcp?: RouteDef<TInput, TOutput, Ctx>['mcp']
        handler: RouteHandler<TInput, TOutput, Ctx>
    },
): RouteDef<TInput, TOutput, Ctx> {

    if (def.handler.length !== 2) {

        throw new Error(
            `Route handler must accept (input, ctx) — arity 2, got ${def.handler.length}`,
        );

    }

    return {
        input: def.input,
        output: def.output,
        meta: def.meta,
        access: def.access ?? 'private',
        mcp: def.mcp,
        handler: def.handler,
    };

}
