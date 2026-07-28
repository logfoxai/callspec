import {toJsonSchema} from 'runtyp';
import type {Registry} from './types';

export type OpenApiOptions = {
    title: string
    version: string
    basePath?: string
    security?: Array<Record<string, string[]>>
};

function routePath(basePath: string, name: string): string {

    return `${basePath}/${name}`.replace(/\/{2,}/g, '/');

}

export function emitOpenApi(registry: Registry<any>, options: OpenApiOptions): Record<string, unknown> {

    const paths: Record<string, unknown> = {};
    const basePath = options.basePath ?? '';

    for (const [name, route] of Object.entries(registry)) {

        paths[routePath(basePath, name)] = {
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
                    200: {
                        description: 'Success',
                        content: route.output ? {
                            'application/json': {
                                schema: toJsonSchema(route.output),
                            },
                        } : {
                            'application/json': {
                                schema: {type: 'object'},
                            },
                        },
                    },
                    401: {description: 'Unauthorized'},
                    400: {description: 'Validation error'},
                },
                ...(route.access === 'private' && options.security ? {security: options.security} : {}),
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
        paths,
    };

}
