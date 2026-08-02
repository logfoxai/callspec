import type {Request, RequestHandler, Router} from 'express';
import {
    CallspecUnauthorizedError,
    CallspecValidationError,
    isRouteFailure,
    sendRouteFailureResponse,
} from './errors';
import {BUILTIN_ERROR} from './builtinErrors';
import {isAllowedRouteFailure} from './defineErrors';
import {executeRoute} from './executeRoute';
import {emitCallspec} from './emitCallspec';
import {listMcpTools} from './mcpTools';
import {mountMcp} from './mountMcp';
import {emitOpenApi} from './openapi';
import {resolveRouteContext} from './resolveRouteContext';
import {
    defaultAuthHint,
    joinMountPath,
    joinRoutePath,
    metaBrandingFromCallspecMeta,
    resolveCallspecMeta,
    siblingSpecPath,
    slugServerName,
} from './metaDefaults';
import type {Callspec} from './types';
import {mountCallspecUi} from './callspec-ui/mountCallspecUi';

type MountDocsOptions = {
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
    /** MCP HTTP path on this router. Default `/mcp`. */
    mcpPath?: string
};

type ResolvedDocsSurfaces = {
    enabled: boolean
    uiPath: string
    callspecPath: string
    openApiPath: string
};

function sendFrameworkError(
    res: import('express').Response,
    err: unknown,
): void {

    if (err instanceof CallspecValidationError) {

        res.status(400).json({error: BUILTIN_ERROR.VALIDATION_ERROR, errors: err.errors});
        return;

    }

    if (err instanceof CallspecUnauthorizedError) {

        res.status(401).json({error: BUILTIN_ERROR.UNAUTHORIZED});
        return;

    }

    res.status(500).json({error: BUILTIN_ERROR.INTERNAL_ERROR});

}

import type {RouteFailure} from './types';

function sendRouteFailureIfAllowed(
    res: import('express').Response,
    failure: RouteFailure,
    routeErrors: import('./types').RouteDef<any, any, any>['errors'],
): void {

    if (!isAllowedRouteFailure(failure, routeErrors)) {

        res.status(500).json({error: BUILTIN_ERROR.INTERNAL_ERROR});
        return;

    }

    sendRouteFailureResponse(res, failure);

}

function resolveDocsSurfaces(options: MountSpecOptions): ResolvedDocsSurfaces {

    const defaults = {
        uiPath: '/docs',
        callspecPath: '/callspec.json',
        openApiPath: '/openapi.json',
    };

    if (options.docs === false) {

        return {...defaults, enabled: false};

    }

    const docsOptions = typeof options.docs === 'object' ? options.docs : {};

    return {
        enabled: true,
        uiPath: docsOptions.uiPath ?? defaults.uiPath,
        callspecPath: docsOptions.callspecPath ?? defaults.callspecPath,
        openApiPath: docsOptions.openApiPath ?? defaults.openApiPath,
    };

}

export function mountSpec<Ctx>(
    router: Router,
    spec: Callspec<Ctx>,
    options: MountSpecOptions = {},
): void {

    const basePath = options.basePath ?? '';
    const resolvedMeta = resolveCallspecMeta(spec.meta);
    const {routes, exports} = spec;
    const docs = resolveDocsSurfaces(options);
    const mcpSubPath = options.mcpPath ?? '/mcp';

    const emitOptions = {
        title: resolvedMeta.title,
        version: resolvedMeta.version,
        basePath,
        description: resolvedMeta.intro,
        exports,
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
                description: resolvedMeta.intro,
            }));

        });

        const uiPath = joinMountPath(basePath, docs.uiPath);
        const authHint = defaultAuthHint(resolvedMeta, routes);

        mountCallspecUi(router, {
            path: uiPath,
            specPath: siblingSpecPath(docs.callspecPath),
            rpcBase: '..',
            title: resolvedMeta.title,
            branding: metaBrandingFromCallspecMeta(resolvedMeta, {authHint}),
            mcpPath: siblingSpecPath(mcpSubPath),
        });

    }

    for (const [name, route] of Object.entries(routes)) {

        router.post(joinRoutePath(basePath, name), (async (req, res) => {

            try {

                const ctx = await resolveRouteContext(route, spec.authenticate, req as Request);
                const result = await executeRoute(route, req.body, ctx);

                if (isRouteFailure(result)) {

                    sendRouteFailureIfAllowed(res, result, route.errors);
                    return;

                }

                res.json(result);

            } catch (err) {

                if (isRouteFailure(err)) {

                    sendRouteFailureIfAllowed(res, err, route.errors);
                    return;

                }

                sendFrameworkError(res, err);

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

    router.post(joinRoutePath(basePath, ':routeName'), ((req, res) => {

        res.status(404).json({
            error: BUILTIN_ERROR.ROUTE_NOT_FOUND,
            data: {route: req.params.routeName ?? ''},
        });

    }) as RequestHandler);

}
