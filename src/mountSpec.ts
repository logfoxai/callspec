import type {Request, RequestHandler, Router} from 'express';
import {CallspecUnauthorizedError, CallspecValidationError} from './errors';
import {executeRoute} from './executeRoute';
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

export type MountSpecOptions = {
    basePath?: string
    /** Default true — serves `/docs`. Pass `false` to disable, or a custom path string. */
    ui?: boolean | string
    /** Default true — serves `/openapi.json`. Pass `false` to disable, or a custom path string. */
    openApi?: boolean | string
    /** MCP HTTP path on this router. Default `/mcp`. */
    mcpPath?: string
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

function resolveSurfacePath(
    value: boolean | string | undefined,
    defaultPath: string,
): {enabled: boolean, path: string} {

    if (value === false) {

        return {enabled: false, path: defaultPath};

    }

    if (typeof value === 'string') {

        return {enabled: true, path: value};

    }

    return {enabled: true, path: defaultPath};

}

export function mountSpec<Ctx>(
    router: Router,
    spec: Callspec<Ctx>,
    options: MountSpecOptions = {},
): void {

    const basePath = options.basePath ?? '';
    const resolvedMeta = resolveCallspecMeta(spec.meta);
    const {routes} = spec;

    const ui = resolveSurfacePath(options.ui, '/docs');
    const openApi = resolveSurfacePath(options.openApi, '/openapi.json');
    const mcpSubPath = options.mcpPath ?? '/mcp';

    if (openApi.enabled) {

        const openApiPath = joinMountPath(basePath, openApi.path);

        router.get(openApiPath, (_req, res) => {

            res.json(emitOpenApi(routes, {
                title: resolvedMeta.title,
                version: resolvedMeta.version,
                basePath,
            }));

        });

    }

    if (ui.enabled && openApi.enabled) {

        const uiPath = joinMountPath(basePath, ui.path);
        const openApiMountPath = joinMountPath(basePath, openApi.path);
        const mcpMountPath = joinMountPath(basePath, mcpSubPath);
        const authHint = defaultAuthHint(resolvedMeta, routes);

        mountCallspecUi(router, {
            path: uiPath,
            specPath: siblingSpecPath(openApiMountPath),
            rpcBase: '..',
            title: resolvedMeta.title,
            branding: metaBrandingFromCallspecMeta(resolvedMeta, {authHint}),
            mcpPath: siblingSpecPath(mcpMountPath),
        });

    }

    for (const [name, route] of Object.entries(routes)) {

        router.post(`${basePath}/${name}`.replace(/\/{2,}/g, '/'), (async (req, res, next) => {

            try {

                const ctx = await resolveRouteContext(route, spec.meta, req as Request);
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

        mountMcp(router, routes, spec.meta, {
            path: joinMountPath(basePath, mcpSubPath),
            serverInfo: {
                name: slugServerName(resolvedMeta.title),
                version: resolvedMeta.version,
            },
            instructions: resolvedMeta.mcpInstructions,
        });

    }

}
