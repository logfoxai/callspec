import type {Request, RequestHandler, Router} from 'express';
import {CallspecUnauthorizedError, CallspecValidationError} from './errors';
import {executeRoute} from './executeRoute';
import {emitOpenApi, type OpenApiOptions} from './openapi';
import type {ContextResolver, Registry} from './types';
import {mountCallsheet, type MountCallsheetOptions} from './callsheet/mountCallsheet';

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
    /** Options passed to callsheet (rpcBase override, etc.). */
    callsheet?: Pick<MountCallsheetOptions, 'rpcBase'>
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

}
