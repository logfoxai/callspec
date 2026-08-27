import {BUILTIN_ERROR, builtInErrorDefs} from '../../builtinErrors';
import {CLIENT_ERROR} from '../../clientErrorNormalization/types';
import {documentRouteErrors} from '../../routeErrorDocument';
import type {RouteAuth} from '../../types';
import type {CallspecUiRoute} from '../types';

type RouteErrorKind = 'framework' | 'handler' | 'client' | 'domain';

export type CatalogRouteError = {
    code: string
    status: number
    kind: RouteErrorKind
    summary: string
    schema: unknown
    example: unknown
    dataRequired?: boolean
    clientOnly?: boolean
};

const builtinCodes = new Set<string>(Object.values(BUILTIN_ERROR));

const HANDLER_SUMMARIES: Record<string, string> = {
    [BUILTIN_ERROR.NOT_FOUND]: 'Resource missing — return from handler',
    [BUILTIN_ERROR.FORBIDDEN]: 'Authenticated but not allowed',
    [BUILTIN_ERROR.TOO_MANY_REQUESTS]: 'Rate limit or quota exceeded',
    [BUILTIN_ERROR.SERVICE_UNAVAILABLE]: 'Service down or unreachable — from your handler, or from the browser client when it cannot connect to the API',
};

function wireErrorSchema(code: string, dataSchema?: unknown, dataRequired?: boolean): unknown {

    const properties: Record<string, unknown> = {
        error: {const: code},
    };
    const required = ['error'];

    if (dataSchema) {

        properties.data = dataSchema;

        if (dataRequired) {

            required.push('data');

        }

    }

    return {
        type: 'object',
        properties,
        required,
        additionalProperties: false,
    };

}

function exampleFromCatalogData(schema: unknown): unknown {

    if (typeof schema !== 'object' || schema === null || !('properties' in schema)) {

        return {};

    }

    const props = (schema as {properties?: Record<string, unknown>}).properties ?? {};
    const out: Record<string, unknown> = {};

    for (const [key, propSchema] of Object.entries(props)) {

        const type = typeof propSchema === 'object' && propSchema !== null && 'type' in propSchema
            ? (propSchema as {type?: string}).type
            : undefined;

        if (type === 'string') {

            out[key] = key.includes('message') || key.includes('title') ? 'message' : '';

        } else if (type === 'integer' || type === 'number') {

            out[key] = 0;

        } else {

            out[key] = null;

        }

    }

    return out;

}

function frameworkErrors(auth: RouteAuth, routeName: string): CatalogRouteError[] {

    const entries: CatalogRouteError[] = [
        {
            code: BUILTIN_ERROR.VALIDATION_ERROR,
            status: 400,
            kind: 'framework',
            summary: 'Input fails the route input schema',
            schema: {
                type: 'object',
                properties: {
                    error: {const: BUILTIN_ERROR.VALIDATION_ERROR},
                    errors: {type: 'object', additionalProperties: {type: 'string'}},
                },
                required: ['error', 'errors'],
                additionalProperties: false,
            },
            example: {
                error: BUILTIN_ERROR.VALIDATION_ERROR,
                errors: {fieldName: 'message'},
            },
        },
        {
            code: BUILTIN_ERROR.ROUTE_NOT_FOUND,
            status: 404,
            kind: 'framework',
            summary: 'RPC method not in the mounted spec',
            schema: wireErrorSchema(BUILTIN_ERROR.ROUTE_NOT_FOUND, {
                type: 'object',
                properties: {route: {type: 'string'}},
                required: ['route'],
            }, true),
            example: {
                error: BUILTIN_ERROR.ROUTE_NOT_FOUND,
                data: {route: routeName},
            },
        },
        {
            code: BUILTIN_ERROR.INTERNAL_ERROR,
            status: 500,
            kind: 'framework',
            summary: 'Unhandled throw or rejected promise in the handler',
            schema: wireErrorSchema(BUILTIN_ERROR.INTERNAL_ERROR),
            example: {error: BUILTIN_ERROR.INTERNAL_ERROR},
        },
    ];

    if (auth === 'bearer') {

        entries.push({
            code: BUILTIN_ERROR.UNAUTHORIZED,
            status: 401,
            kind: 'framework',
            summary: 'Bearer token missing or invalid',
            schema: wireErrorSchema(BUILTIN_ERROR.UNAUTHORIZED),
            example: {error: BUILTIN_ERROR.UNAUTHORIZED},
        });

    }

    return entries;

}

function handlerErrors(): CatalogRouteError[] {

    const documented = documentRouteErrors(builtInErrorDefs) ?? {};

    return Object.entries(documented)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([code, def]) => ({
            code,
            status: def.status,
            kind: 'handler' as const,
            summary: HANDLER_SUMMARIES[code] ?? 'Return from handler via err.*',
            schema: wireErrorSchema(code, def.data, def.dataRequired),
            example: def.data
                ? {error: code, data: exampleFromCatalogData(def.data)}
                : {error: code},
            dataRequired: def.dataRequired,
        }));

}

function clientOnlyErrors(): CatalogRouteError[] {

    return [
        {
            code: CLIENT_ERROR.NETWORK_ERROR,
            status: 0,
            kind: 'client',
            summary: 'Device offline or request aborted before any HTTP response',
            clientOnly: true,
            schema: {
                type: 'object',
                properties: {
                    ok: {const: false},
                    status: {const: 0},
                    code: {const: CLIENT_ERROR.NETWORK_ERROR},
                    data: {
                        type: 'object',
                        properties: {
                            message: {type: 'string'},
                            name: {type: 'string'},
                        },
                        required: ['message'],
                    },
                },
                required: ['ok', 'status', 'code', 'data'],
            },
            example: {
                ok: false,
                status: 0,
                code: CLIENT_ERROR.NETWORK_ERROR,
                data: {message: 'Network unavailable', name: 'TypeError'},
            },
        },
        {
            code: CLIENT_ERROR.UNKNOWN_ERROR,
            status: 0,
            kind: 'client',
            summary: 'HTTP response outside the route contract — debug only; do not show data to users',
            clientOnly: true,
            schema: {
                type: 'object',
                properties: {
                    ok: {const: false},
                    status: {type: 'integer', description: 'HTTP status of the foreign response'},
                    code: {const: CLIENT_ERROR.UNKNOWN_ERROR},
                    data: {
                        type: 'object',
                        properties: {
                            body: {},
                            headers: {type: 'object', additionalProperties: {type: 'string'}},
                        },
                        required: ['body'],
                    },
                },
                required: ['ok', 'status', 'code', 'data'],
            },
            example: {
                ok: false,
                status: 502,
                code: CLIENT_ERROR.UNKNOWN_ERROR,
                data: {body: '<html>Bad Gateway</html>'},
            },
        },
    ];

}

function domainErrors(
    routeErrors: CallspecUiRoute['errors'],
): CatalogRouteError[] {

    if (!routeErrors) return [];

    return Object.entries(routeErrors)
        .filter(([code]) => !builtinCodes.has(code))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([code, def]) => ({
            code,
            status: def.status,
            kind: 'domain' as const,
            summary: 'Declared for this route',
            schema: wireErrorSchema(code, def.data, def.dataRequired),
            example: def.data
                ? {error: code, data: exampleFromCatalogData(def.data)}
                : {error: code},
            dataRequired: def.dataRequired,
        }));

}

export function partitionRouteErrors(
    route: Pick<CallspecUiRoute, 'name' | 'auth' | 'errors'>,
): {builtin: CatalogRouteError[], domain: CatalogRouteError[]} {

    return {
        builtin: [
            ...frameworkErrors(route.auth, route.name),
            ...handlerErrors(),
            ...clientOnlyErrors(),
        ],
        domain: domainErrors(route.errors),
    };

}
