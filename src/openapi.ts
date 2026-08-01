import {toJsonSchema} from 'runtyp';
import type {RoutesMap} from './types';
import {joinRoutePath} from './metaDefaults';
import {openApiErrorResponses} from './routeErrorDocument';

export type OpenApiOptions = {
    title: string
    version: string
    basePath?: string
};

export function emitOpenApi(
    routes: RoutesMap<any>,
    options: OpenApiOptions,
): Record<string, unknown> {

    const paths: Record<string, unknown> = {};
    const basePath = options.basePath ?? '';
    const hasPrivate = Object.values(routes).some((route) => route.access === 'private');

    for (const [name, route] of Object.entries(routes)) {

        const outputSchema = toJsonSchema(route.output);

        const errorResponses = openApiErrorResponses(route.errors, {
            includeUnauthorized: route.access === 'private',
        });

        paths[joinRoutePath(basePath, name)] = {
            post: {
                operationId: name,
                summary: route.meta.summary,
                description: route.meta.description,
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
                security: route.access === 'private' ? [{bearer: []}] : [],
                'x-callspec-access': route.access,
                ...(route.mcp ? {'x-callspec-mcp': true} : {}),
            },
        };

    }

    return {
        openapi: '3.1.0',
        info: {
            title: options.title,
            version: options.version,
        },
        ...(hasPrivate ? {
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
