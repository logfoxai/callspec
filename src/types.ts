import type {Request} from 'express';
import type {Pred} from 'runtyp';

export type RouteMeta = {
    summary: string
    description: string
    tags: readonly string[]
};

export type McpRouteConfig =
    | true
    | {
        name?: string
        annotations?: Record<string, unknown>
    };

export type RouteAccess = 'public' | 'private';

export type RouteHandler<TInput, TOutput, Ctx> = (
    input: TInput,
    ctx: Ctx,
) => Promise<TOutput> | TOutput;

export type RouteDef<TInput = unknown, TOutput = unknown, Ctx = unknown> = {
    input: Pred<TInput>
    output?: Pred<TOutput>
    meta: RouteMeta
    access: RouteAccess
    mcp?: McpRouteConfig
    handler: RouteHandler<TInput, TOutput, Ctx>
};

export type Registry<Ctx = unknown> = Record<string, RouteDef<any, any, Ctx>>;

export type ContextResolver<Ctx> = (req: Request) => Ctx | Promise<Ctx | undefined> | Ctx | undefined;

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export type InferRouteInput<R extends RouteDef<any, any, any>> =
    R extends RouteDef<infer I, any, any> ? I : never;

export type InferRouteOutput<R extends RouteDef<any, any, any>> =
    R extends {output: Pred<infer O>}
        ? O
        : UnwrapPromise<ReturnType<R['handler']>>;

export type InferRegistry<T extends Registry<any>> = {
    [K in keyof T]: {
        name: K & string
        input: InferRouteInput<T[K]>
        output: InferRouteOutput<T[K]>
    }
};
