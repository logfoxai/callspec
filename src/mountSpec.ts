import type {Request, RequestHandler, Router} from 'express';
import {CallspecUnauthorizedError, CallspecValidationError, formatRouteErrorBody, isCallspecRouteError} from './errors';
import {executeRoute} from './executeRoute';
import {emitCallspec} from './emitCallspec';
import {listMcpTools} from './mcpTools';
import {mountMcp} from './mountMcp';
import {emitOpenApi} from './openapi';
import {resolveRouteContext} from './resolveRouteContext';
import {
    defaultAuthHint,
    joinMountPath,
    metaBrandingFromCallspecMeta,
    resolveCallspecMeta,
    siblingSpecPath,
    slugServerName,
} from './metaDefaults';
import type {Callspec} from './types';
import {mountCallspecUi} from './callspec-ui/mountCallspecUi';

export type MountDocsOptions = {
    /** Docs UI mount path. Default `/docs`. */
    uiPath?: string
    /** Native Callspec document path. Default `/callspec.json`. */
    callspecPath?: string
    /** OpenAPI document path. Default `/openapi.json`. */
    openApiPath?: string
};

export type MountSpecOptions = {
    basePath?: string
    /**
     * Default true — serves `/docs`, `/callspec.json`, and `/openapi.json` together.
     * Pass `false` to disable all docs/spec surfaces.
     */
    docs?: boolean | MountDocsOptions
    /** @deprecated Use `docs: false` to disable all docs/spec surfaces. */
    ui?: boolean | string
    /** @deprecated Use `docs: false` to disable all docs/spec surfaces. */
    openApi?: boolean | string
    /** MCP HTTP path on this router. Default `/mcp`. */
    mcpPath?: string
};

type ResolvedDocsSurfaces = {
    enabled: boolean
    uiPath: string
    callspecPath: string
    openApiPath: string
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

    if (isCallspecRouteError(err)) {

        res.status(err.status).json(formatRouteErrorBody(err));
        return;

    }

    throw err;

}

function resolveDocsSurfaces(options: MountSpecOptions): ResolvedDocsSurfaces {

    const defaults = {
        uiPath: '/docs',
        callspecPath: '/callspec.json',
        openApiPath: '/openapi.json',
    };

    if (options.docs === false || options.ui === false || options.openApi === false) {

        return {...defaults, enabled: false};

    }

    const docsOptions = typeof options.docs === 'object' ? options.docs : {};

    return {
        enabled: true,
        uiPath: docsOptions.uiPath
            ?? (typeof options.ui === 'string' ? options.ui : defaults.uiPath),
        callspecPath: docsOptions.callspecPath ?? defaults.callspecPath,
        openApiPath: docsOptions.openApiPath
            ?? (typeof options.openApi === 'string' ? options.openApi : defaults.openApiPath),
    };

}

export function mountSpec<Ctx>(
    router: Router,
    spec: Callspec<Ctx>,
    options: MountSpecOptions = {},
): void {

    const basePath = options.basePath ?? '';
    const resolvedMeta = resolveCallspecMeta(spec.meta);
    const {routes} = spec;
    const docs = resolveDocsSurfaces(options);
    const mcpSubPath = options.mcpPath ?? '/mcp';

    const emitOptions = {
        title: resolvedMeta.title,
        version: resolvedMeta.version,
        basePath,
        description: resolvedMeta.intro,
    };

    if (docs.enabled) {

        const callspecMountPath = joinMountPath(basePath, docs.callspecPath);

        router.get(callspecMountPath, (_req, res) => {

            res.json(emitCallspec(routes, emitOptions));

        });

        const openApiMountPath = joinMountPath(basePath, docs.openApiPath);

        router.get(openApiMountPath, (_req, res) => {

            res.json(emitOpenApi(routes, {
                title: resolvedMeta.title,
                version: resolvedMeta.version,
                basePath,
            }));

        });

        const uiPath = joinMountPath(basePath, docs.uiPath);
        const authHint = defaultAuthHint(resolvedMeta, routes);
        const mcpMountPath = joinMountPath(basePath, mcpSubPath);

        mountCallspecUi(router, {
            path: uiPath,
            specPath: siblingSpecPath(callspecMountPath),
            rpcBase: '..',
            title: resolvedMeta.title,
            branding: metaBrandingFromCallspecMeta(resolvedMeta, {authHint}),
            mcpPath: siblingSpecPath(mcpMountPath),
        });

    }

    for (const [name, route] of Object.entries(routes)) {

        router.post(`${basePath}/${name}`.replace(/\/{2,}/g, '/'), (async (req, res, next) => {

            try {

                const ctx = await resolveRouteContext(route, spec.authenticate, req as Request);
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

    if (listMcpTools(routes).length > 0) {

        mountMcp(router, routes, spec.authenticate, {
            path: joinMountPath(basePath, mcpSubPath),
            serverInfo: {
                name: slugServerName(resolvedMeta.title),
                version: resolvedMeta.version,
            },
            instructions: resolvedMeta.mcpInstructions,
        });

    }

}
