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

export type RoutesMap<Ctx = unknown> = Record<string, RouteDef<any, any, Ctx>>;

/** @deprecated Use {@link RoutesMap} — route map only; prefer {@link Callspec}. */
export type Spec<Ctx = unknown> = RoutesMap<Ctx>;

export type CallspecLogo = {
    light?: string
    dark?: string
};

export type CallspecWebsite = {
    url: string
    label?: string
};

export type Authenticate<Ctx> = (
    token: string,
    req: Request,
) => Ctx | undefined | Promise<Ctx | undefined>;

export type CallspecMeta = {
    title?: string
    version?: string
    intro?: string
    website?: CallspecWebsite
    logo?: CallspecLogo
    authHint?: string
    mcpInstructions?: string
};

export type Callspec<Ctx = unknown> = {
    meta: CallspecMeta
    routes: RoutesMap<Ctx>
    authenticate?: Authenticate<Ctx>
};

export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export type InferRouteInput<R extends RouteDef<any, any, any>> =
    R extends RouteDef<infer I, any, any> ? I : never;

export type InferRouteOutput<R extends RouteDef<any, any, any>> =
    R extends {output: Pred<infer O>}
        ? O
        : UnwrapPromise<ReturnType<R['handler']>>;

export type InferSpec<T extends RoutesMap<any>> = {
    [K in keyof T]: {
        name: K & string
        input: InferRouteInput<T[K]>
        output: InferRouteOutput<T[K]>
    }
};
