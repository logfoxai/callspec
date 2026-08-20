import {toJsonSchema} from 'runtyp';
import type {RoutesMap} from './types';
import {joinRoutePath} from './metaDefaults';
import {exportedRoutes, hasBearerRoutes, type ExportVisibility} from './routeVisibility';
import {openApiErrorResponses} from './routeErrorDocument';

export type OpenApiOptions = {
    title: string
    version: string
    basePath?: string
    description?: string
    visibility?: ExportVisibility
};

export function emitOpenApi(
    routes: RoutesMap<any>,
    options: OpenApiOptions,
): Record<string, unknown> {

    const paths: Record<string, unknown> = {};
    const basePath = options.basePath ?? '';
    const hasBearer = hasBearerRoutes(routes);

    for (const [name, route] of Object.entries(exportedRoutes(routes, options.visibility))) {

        const outputSchema = toJsonSchema(route.output);

        const errorResponses = openApiErrorResponses(route.errors, {
            includeUnauthorized: route.auth === 'bearer',
        });

        paths[joinRoutePath(basePath, name)] = {
            post: {
                operationId: name,
                summary: route.meta.summary,
                ...(route.meta.description ? {description: route.meta.description} : {}),
                tags: [...route.meta.tags],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: toJsonSchema(route.input),
                        },
                    },
                },
                responses: {
                    ...errorResponses,
                    200: {
                        description: 'Success',
                        content: {
                            'application/json': {
                                schema: outputSchema,
                            },
                        },
                    },
                },
                security: route.auth === 'bearer' ? [{bearer: []}] : [],
                'x-callspec-auth': route.auth,
                'x-callspec-scope': route.scope,
                ...(route.mcp ? {'x-callspec-mcp': true} : {}),
            },
        };

    }

    return {
        openapi: '3.1.0',
        info: {
            title: options.title,
            version: options.version,
            ...(options.description ? {description: options.description} : {}),
        },
        ...(hasBearer ? {
            components: {
                securitySchemes: {
                    bearer: {
                        type: 'http',
                        scheme: 'bearer',
                    },
                },
            },
        } : {}),
        paths,
    };

}
