import type {Request} from 'express';
import type {Pred} from 'runtyp';

export type RouteMeta = {
    summary: string
    /** Optional prose — schemas, errors, and summary already surface in docs UI. */
    description?: string
    tags: readonly string[]
};

export type McpRouteConfig =
    | true
    | {
        name?: string
        annotations?: Record<string, unknown>
    };

export type RouteAuth = 'none' | 'bearer';

/** Whether a route appears in callspec.json, OpenAPI, docs UI, SDK codegen, and MCP tools/list. */
export type RouteScope = 'public' | 'private';

/** Default HTTP status for domain route errors when `status` is omitted. */
export const DEFAULT_ROUTE_ERROR_STATUS = 400;

export type RouteErrorSpec = {
    status?: number
    data?: Pred<unknown>
};

export type RouteErrorDef = {
    status: number
    data?: Pred<unknown>
};

/** Declared route failure — return from handlers via `defineErrors` / `err` handles. */
export type RouteFailure = {
    ok: false
    code: string
    status: number
    data?: unknown
};

export type RouteHandler<
    TInput,
    TOutput,
    Ctx,
    TFailure extends RouteFailure = RouteFailure,
> = (
    input: TInput,
    ctx: Ctx,
) => Promise<TOutput | TFailure> | TOutput | TFailure;

export type RouteDef<TInput = unknown, TOutput = unknown, Ctx = unknown> = {
    input: Pred<TInput>
    output: Pred<TOutput>
    errors?: Record<string, RouteErrorDef>
    meta: RouteMeta
    auth: RouteAuth
    scope: RouteScope
    mcp?: McpRouteConfig
    handler: RouteHandler<TInput, TOutput, Ctx>
};

/** Wired route — returned from `route({ …, handler })`; required by `spec`. */
export type WiredRoute<TInput = unknown, TOutput = unknown, Ctx = unknown> = RouteDef<
    TInput,
    TOutput,
    Ctx
> & {
    readonly __callspecWired: true
};

export type RoutesMap<Ctx = unknown> = Record<string, WiredRoute<any, any, Ctx>>;

type CallspecLogo = {
    light?: string
    dark?: string
};

type CallspecWebsite = {
    url: string
    label?: string
};

export type CallspecUiTheme = {
    accent?: string
    background?: string
    surface?: string
    fontFamily?: string
    fontUrls?: string[]
};

export type CallspecNavbarLink = {
    label: string
    href: string
    external?: boolean
};

export type CallspecUiFooter = {
    /** Show “Powered by callspec”. Default true when omitted. */
    poweredBy?: boolean
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
    theme?: CallspecUiTheme
    navbarLinks?: CallspecNavbarLink[]
    footer?: CallspecUiFooter
    favicon?: string
};

export type Callspec<Ctx = unknown> = {
    meta: CallspecMeta
    routes: RoutesMap<Ctx>
    exports?: Record<string, import('runtyp').Pred<any>>
    authenticate?: Authenticate<Ctx>
};
