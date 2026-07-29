import type {Request, RequestHandler, Router} from 'express';
import {CallspecUnauthorizedError, CallspecValidationError} from './errors';
import {executeRoute} from './executeRoute';
import {listMcpTools} from './mcpTools';
import {mountMcp, type MountMcpOptions} from './mountMcp';
import {emitOpenApi, type OpenApiOptions} from './openapi';
import type {ContextResolver, Registry} from './types';
import {mountCallsheet, type MountCallsheetOptions} from './callsheet/mountCallsheet';

export type MountRegistryMcpOptions = {
    /** MCP HTTP path on this router. Default `/mcp`. */
    path?: string
    /** When false, skip MCP even if routes opt in. Default true. */
    expose?: boolean
    /** MCP server identity. Defaults from `docs.openApi` title/version when omitted. */
    serverInfo?: { name: string, version: string }
    instructions?: string
};

export type MountRegistryDocsOptions = {
    /** OpenAPI document metadata. Required to expose docs. */
    openApi?: OpenApiOptions
    /** Serve GET …/openapi.json. Default: true when docs are enabled. */
    exposeOpenApi?: boolean
    /** Serve the callsheet UI at `/docs`. Default: true when docs are enabled. */
    exposeUi?: boolean
    /** OpenAPI JSON path on this router. Default `/openapi.json`. */
    openApiPath?: string
    /** callsheet UI mount path. Default `/docs`. */
    uiPath?: string
    /** Options passed to callsheet (rpcBase override, branding, MCP, etc.). */
    callsheet?: Pick<MountCallsheetOptions, 'rpcBase' | 'branding' | 'mcpPath' | 'mcp' | 'brandAssetsDir'>
};

export type MountRegistryOptions<Ctx> = {
    contextResolver?: ContextResolver<Ctx>
    /**
     * @deprecated Use `docs.openApi` with `docs.exposeOpenApi` / `docs.exposeUi`.
     * When true and `openApi` or `docs.openApi` is set, enables docs surfaces.
     */
    exposeDocs?: boolean
    /** @deprecated Use `docs.openApi`. */
    openApi?: OpenApiOptions
    /** Docs configuration — OpenAPI spec and/or callsheet UI, each toggled independently. */
    docs?: MountRegistryDocsOptions | false
    /** MCP server — auto-enabled when routes use `mcp: true`. Pass `false` to disable. */
    mcp?: MountRegistryMcpOptions | false
    basePath?: string
};

function sendError(res: import('express').Response, err: unknown): void {

    if (err instanceof CallspecValidationError) {

        res.status(400).json({error: err.message, errors: err.errors});
        return;

    }

    if (err instanceof CallspecUnauthorizedError) {

        res.status(401).send('Unauthorized');
        return;

    }

    throw err;

}

function resolveDocsOptions(
    options: MountRegistryOptions<unknown>,
): MountRegistryDocsOptions | false {

    if (options.docs === false) return false;

    const legacyEnabled = options.exposeDocs === true;
    const merged = options.docs ?? {};

    const openApi = merged.openApi ?? options.openApi;

    if (!openApi) return false;

    if (!legacyEnabled && options.docs === undefined && options.exposeDocs === undefined) {

        return false;

    }

    const docsEnabled = legacyEnabled || options.docs !== undefined;

    return {
        openApi,
        exposeOpenApi: merged.exposeOpenApi ?? (docsEnabled ? true : false),
        exposeUi: merged.exposeUi ?? (docsEnabled ? true : false),
        openApiPath: merged.openApiPath ?? '/openapi.json',
        uiPath: merged.uiPath ?? '/docs',
        callsheet: merged.callsheet,
    };

}

function slugServerName(title: string): string {

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return slug || 'callspec';

}

function resolveMcpOptions<Ctx>(
    registry: Registry<Ctx>,
    options: MountRegistryOptions<Ctx>,
    docs: MountRegistryDocsOptions | false,
): MountMcpOptions<Ctx> | false {

    if (options.mcp === false) return false;

    if (listMcpTools(registry).length === 0) return false;

    const merged = options.mcp ?? {};

    if (merged.expose === false) return false;

    const openApi = docs !== false
        ? docs.openApi
        : options.openApi;

    const serverInfo = merged.serverInfo ?? (openApi ? {
        name: slugServerName(openApi.title ?? 'callspec'),
        version: openApi.version ?? '0.0.0',
    } : {
        name: 'callspec',
        version: '0.0.0',
    });

    const mcpPath = merged.path ?? '/mcp';
    const basePath = options.basePath ?? '';

    return {
        path: `${basePath}${mcpPath}`.replace(/\/{2,}/g, '/') || '/mcp',
        contextResolver: options.contextResolver,
        serverInfo,
        instructions: merged.instructions,
    };

}

export function mountRegistry<Ctx>(
    router: Router,
    registry: Registry<Ctx>,
    options: MountRegistryOptions<Ctx> = {},
): void {

    const basePath = options.basePath ?? '';
    const docs = resolveDocsOptions(options as MountRegistryOptions<unknown>);

    if (docs && docs.openApi && docs.exposeOpenApi !== false) {

        const openApiPath = docs.openApiPath ?? '/openapi.json';

        router.get(`${basePath}${openApiPath}`, (_req, res) => {

            res.json(emitOpenApi(registry, {
                ...docs.openApi as OpenApiOptions,
                basePath,
            }));

        });

    }

    if (docs && docs.exposeUi !== false) {

        const uiPath = docs.uiPath ?? '/docs';
        const openApiPath = docs.openApiPath ?? '/openapi.json';
        const specPath = openApiPath.startsWith('/')
            ? `..${openApiPath}`
            : openApiPath;

        mountCallsheet(router, {
            path: `${basePath}${uiPath}`.replace(/\/{2,}/g, '/') || '/docs',
            specPath,
            rpcBase: docs.callsheet?.rpcBase ?? '..',
            title: docs.openApi?.title,
            branding: docs.callsheet?.branding,
            mcpPath: docs.callsheet?.mcpPath,
            mcp: docs.callsheet?.mcp,
            brandAssetsDir: docs.callsheet?.brandAssetsDir,
        });

    }

    for (const [name, route] of Object.entries(registry)) {

        router.post(`${basePath}/${name}`, (async (req, res, next) => {

            try {

                const ctx = options.contextResolver
                    ? await options.contextResolver(req as Request)
                    : undefined;

                const response = await executeRoute(route, req.body, ctx);
                res.json(response);

            } catch (err) {

                try {

                    sendError(res, err);

                } catch (rethrow) {

                    next(rethrow);

                }

            }

        }) as RequestHandler);

    }

    const mcp = resolveMcpOptions(registry, options, docs);

    if (mcp) {

        mountMcp(router, registry, mcp);

    }

}
