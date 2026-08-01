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

export type RouteErrorDef = {
    status: number
    data?: Pred<unknown>
};

export type RouteHandler<TInput, TOutput, Ctx> = (
    input: TInput,
    ctx: Ctx,
) => Promise<TOutput> | TOutput;

export type RouteDef<TInput = unknown, TOutput = unknown, Ctx = unknown> = {
    input: Pred<TInput>
    output: Pred<TOutput>
    errors?: Record<string, RouteErrorDef>
    meta: RouteMeta
    access: RouteAccess
    mcp?: McpRouteConfig
    handler: RouteHandler<TInput, TOutput, Ctx>
};

export type RoutesMap<Ctx = unknown> = Record<string, RouteDef<any, any, Ctx>>;

type CallspecLogo = {
    light?: string
    dark?: string
};

type CallspecWebsite = {
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
    exports?: Record<string, import('runtyp').Pred<any>>
    authenticate?: Authenticate<Ctx>
};
