import type {Request, RequestHandler, Router} from 'express';
import {
    CallspecUnauthorizedError,
    CallspecValidationError,
    isRouteFailure,
    sendRouteFailureResponse,
} from './errors';
import {BUILTIN_ERROR} from './builtinErrors';
import {
    CALLSPEC_JSON_PATH,
    DOCS_UI_PATH,
    OPENAPI_JSON_PATH,
} from './callspecDocumentSource';
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
    relativeToMountPath,
    relativeToMountRoot,
    resolveCallspecMeta,
    slugServerName,
} from './metaDefaults';
import type {Callspec, RouteFailure} from './types';
import {mountCallspecUi} from './callspec-ui/mountCallspecUi';
import {defaultLogCall, type OnCall} from './callObservability';
import {defaultLogUnhandledError, logRequest} from './mountSpecLogging';

export type MountSpecOptions = {
    basePath?: string
    /**
     * Default true — serves `/docs`, `/callspec.json`, and `/openapi.json` at the mount root.
     * Pass `false` to disable all docs/spec surfaces.
     */
    docs?: boolean
    /** Docs UI mount path on this router. Default `/docs`. `callspec.json` and `openapi.json` stay fixed. */
    docsPath?: string
    /** MCP HTTP path on this router. Default `/mcp`. */
    mcpPath?: string
    /**
     * Request logging (jsout-express) and unhandled-error logging (jsout) on this router.
     * Default true — pass `false` in tests to silence output.
     */
    logging?: boolean
    /**
     * Structured per-call events (MCP `tools/call` today). Default: jsout `call` info
     * when `logging` is enabled. Pass a custom sink for Logfox, or `() => {}` to disable
     * call events while keeping HTTP access logs.
     */
    onCall?: OnCall
    /**
     * Map unexpected throws to intentional `RouteFailure` responses before log +
     * `INTERNAL_ERROR`. Return undefined to fall through to the default path.
     */
    handleUnhandledError?: (err: unknown, req: Request) => RouteFailure | undefined
    /** Override unhandled-error logging. Default uses jsout `logger.error`. */
    logUnhandledError?: (err: unknown, req: Request) => void
};

function noopLogUnhandledError(_err: unknown, _req: Request): void {

}

export function mountSpec<Ctx>(
    router: Router,
    spec: Callspec<Ctx>,
    options: MountSpecOptions = {},
): void {

    const basePath = options.basePath ?? '';
    const resolvedMeta = resolveCallspecMeta(spec.meta);
    const {routes, exports} = spec;
    const docsEnabled = options.docs !== false;
    const docsPath = options.docsPath ?? DOCS_UI_PATH;
    const mcpSubPath = options.mcpPath ?? '/mcp';
    const loggingEnabled = options.logging !== false;
    const logUnhandledError = options.logUnhandledError
        ?? (loggingEnabled ? defaultLogUnhandledError : noopLogUnhandledError);
    const handleUnhandledError = options.handleUnhandledError;

    if (loggingEnabled) {

        router.use(logRequest);

    }

    const emitOptions = {
        title: resolvedMeta.title,
        version: resolvedMeta.version,
        basePath,
        description: resolvedMeta.intro,
        exports,
    };

    if (docsEnabled) {

        router.get(joinMountPath(basePath, CALLSPEC_JSON_PATH), (_req, res) => {

            res.json(emitCallspec(routes, emitOptions));

        });

        router.get(joinMountPath(basePath, OPENAPI_JSON_PATH), (_req, res) => {

            res.json(emitOpenApi(routes, {
                title: resolvedMeta.title,
                version: resolvedMeta.version,
                basePath,
                description: resolvedMeta.intro,
            }));

        });

        const authHint = defaultAuthHint(resolvedMeta, routes);
        const brandingWithMcp = metaBrandingFromCallspecMeta(resolvedMeta, {authHint});
        const {mcp, ...branding} = brandingWithMcp;

        mountCallspecUi(router, {
            path: joinMountPath(basePath, docsPath),
            specPath: relativeToMountPath(docsPath, CALLSPEC_JSON_PATH),
            rpcBase: relativeToMountRoot(docsPath),
            title: resolvedMeta.title,
            branding,
            mcp,
            mcpPath: relativeToMountPath(docsPath, mcpSubPath),
        });

    }

    for (const [name, route] of Object.entries(routes)) {

        router.post(joinRoutePath(basePath, name), (async (req, res) => {

            try {

                const ctx = await resolveRouteContext(route, spec.authenticate, req as Request);
                const result = await executeRoute(route, req.body, ctx);

                if (isRouteFailure(result)) {

                    sendRouteFailureResponse(res, result);
                    return;

                }

                res.json(result);

            } catch (err) {

                if (isRouteFailure(err)) {

                    sendRouteFailureResponse(res, err);
                    return;

                }

                if (err instanceof CallspecValidationError) {

                    res.status(400).json({error: BUILTIN_ERROR.VALIDATION_ERROR, errors: err.errors});
                    return;

                }

                if (err instanceof CallspecUnauthorizedError) {

                    res.status(401).json({error: BUILTIN_ERROR.UNAUTHORIZED});
                    return;

                }

                const handled = handleUnhandledError?.(err, req as Request);

                if (handled) {

                    sendRouteFailureResponse(res, handled);
                    return;

                }

                logUnhandledError(err, req as Request);
                res.status(500).json({error: BUILTIN_ERROR.INTERNAL_ERROR});

            }

        }) as RequestHandler);

    }

    if (listMcpTools(routes).length > 0) {

        const onCall = options.onCall ?? (loggingEnabled ? defaultLogCall : undefined);

        mountMcp(router, routes, spec.authenticate, {
            path: joinMountPath(basePath, mcpSubPath),
            serverInfo: {
                name: slugServerName(resolvedMeta.title),
                version: resolvedMeta.version,
            },
            instructions: resolvedMeta.mcpInstructions,
            onCall,
        });

    }

    router.post(joinRoutePath(basePath, ':routeName'), ((req, res) => {

        res.status(404).json({
            error: BUILTIN_ERROR.ROUTE_NOT_FOUND,
            data: {route: req.params.routeName ?? ''},
        });

    }) as RequestHandler);

}
