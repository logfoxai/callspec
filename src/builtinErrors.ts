import {predicates as p} from 'runtyp';
import type {JsonSchema} from './callspecDocument';
import type {RouteErrorDef, RouteErrorSpec} from './types';
import {DEFAULT_ROUTE_ERROR_STATUS} from './types';

/** Builtin error codes — always on every route contract; never declared per route. */
export const BUILTIN_ERROR = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
    NOT_FOUND: 'NOT_FOUND',
    FORBIDDEN: 'FORBIDDEN',
    CONFLICT: 'CONFLICT',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type BuiltinErrorCode = typeof BUILTIN_ERROR[keyof typeof BUILTIN_ERROR];

/** Builtin codes handlers throw via {@link errors} / {@link err} — subset of {@link BUILTIN_ERROR}. */
export type ThrowableBuiltinCode =
    | typeof BUILTIN_ERROR.NOT_FOUND
    | typeof BUILTIN_ERROR.FORBIDDEN
    | typeof BUILTIN_ERROR.CONFLICT
    | typeof BUILTIN_ERROR.TOO_MANY_REQUESTS
    | typeof BUILTIN_ERROR.SERVICE_UNAVAILABLE;

export type OptionalBuiltinContext = {
    message?: string
    description?: string
};

export const builtInErrors = {
    NOT_FOUND: {
        status: 404,
        data: p.optional(p.object({
            message: p.optional(p.string()),
            description: p.optional(p.string()),
        })),
    },
    FORBIDDEN: {
        status: 403,
        data: p.optional(p.object({
            message: p.optional(p.string()),
            description: p.optional(p.string()),
        })),
    },
    CONFLICT: {
        status: 409,
        data: p.optional(p.object({
            message: p.optional(p.string()),
            description: p.optional(p.string()),
        })),
    },
    TOO_MANY_REQUESTS: {
        status: 429,
        data: p.object({
            title: p.string(),
            message: p.string(),
        }),
    },
    SERVICE_UNAVAILABLE: {
        status: 503,
        data: p.optional(p.object({
            message: p.optional(p.string()),
            description: p.optional(p.string()),
        })),
    },
} satisfies Record<ThrowableBuiltinCode, RouteErrorSpec>;

export function builtInErrorDefs(): Record<ThrowableBuiltinCode, RouteErrorDef> {

    const defs = {} as Record<ThrowableBuiltinCode, RouteErrorDef>;

    for (const [code, spec] of Object.entries(builtInErrors) as [ThrowableBuiltinCode, RouteErrorSpec][]) {

        defs[code] = {
            status: spec.status ?? DEFAULT_ROUTE_ERROR_STATUS,
            ...(spec.data ? {data: spec.data} : {}),
        };

    }

    return defs;

}

export function mergeDomainErrorDefs(
    domain: Record<string, RouteErrorDef> | undefined,
): Record<string, RouteErrorDef> {

    return {
        ...builtInErrorDefs(),
        ...domain,
    };

}

export function isThrowableBuiltinCode(code: string): code is ThrowableBuiltinCode {

    return Object.prototype.hasOwnProperty.call(builtInErrors, code);

}

const VALIDATION_ERROR_SCHEMA: JsonSchema = {
    type: 'object',
    properties: {
        error: {const: BUILTIN_ERROR.VALIDATION_ERROR},
        errors: {type: 'object', additionalProperties: {type: 'string'}},
    },
    required: ['error', 'errors'],
};

const UNAUTHORIZED_ERROR_SCHEMA: JsonSchema = {
    type: 'object',
    properties: {
        error: {const: BUILTIN_ERROR.UNAUTHORIZED},
    },
    required: ['error'],
};

const INTERNAL_ERROR_SCHEMA: JsonSchema = {
    type: 'object',
    properties: {
        error: {const: BUILTIN_ERROR.INTERNAL_ERROR},
    },
    required: ['error'],
};

const ROUTE_NOT_FOUND_ERROR_SCHEMA: JsonSchema = {
    type: 'object',
    properties: {
        error: {const: BUILTIN_ERROR.ROUTE_NOT_FOUND},
        data: {
            type: 'object',
            properties: {route: {type: 'string'}},
            required: ['route'],
        },
    },
    required: ['error', 'data'],
};

/** OpenAPI responses for mount/router-owned builtin errors (not handler throwables). */
export function openApiMountBuiltinErrorResponses(options: {
    includeUnauthorized?: boolean
} = {}): Record<string, unknown> {

    const responses: Record<string, unknown> = {
        400: {
            description: BUILTIN_ERROR.VALIDATION_ERROR,
            content: {
                'application/json': {schema: VALIDATION_ERROR_SCHEMA},
            },
        },
        404: {
            description: BUILTIN_ERROR.ROUTE_NOT_FOUND,
            content: {
                'application/json': {schema: ROUTE_NOT_FOUND_ERROR_SCHEMA},
            },
        },
        500: {
            description: BUILTIN_ERROR.INTERNAL_ERROR,
            content: {
                'application/json': {schema: INTERNAL_ERROR_SCHEMA},
            },
        },
    };

    if (options.includeUnauthorized) {

        responses['401'] = {
            description: BUILTIN_ERROR.UNAUTHORIZED,
            content: {
                'application/json': {schema: UNAUTHORIZED_ERROR_SCHEMA},
            },
        };

    }

    return responses;

}

function jsonResponseSchema(content: unknown): JsonSchema | undefined {

    if (typeof content !== 'object' || content === null) {

        return undefined;

    }

    const media = (content as Record<string, unknown>)['application/json'];

    if (typeof media !== 'object' || media === null) {

        return undefined;

    }

    return (media as {schema?: JsonSchema}).schema;

}

function withJsonSchema(schema: JsonSchema): Record<string, unknown> {

    return {
        'application/json': {schema},
    };

}

function mergeJsonSchemas(left: JsonSchema, right: JsonSchema): JsonSchema {

    const flatten = (schema: JsonSchema): JsonSchema[] => {

        if (Array.isArray(schema.oneOf)) {

            return schema.oneOf as JsonSchema[];

        }

        return [schema];

    };

    const combined = [...flatten(left), ...flatten(right)];
    const seen = new Set<string>();
    const unique: JsonSchema[] = [];

    for (const schema of combined) {

        const key = JSON.stringify(schema);

        if (seen.has(key)) {

            continue;

        }

        seen.add(key);
        unique.push(schema);

    }

    return unique.length === 1 ? unique[0]! : {oneOf: unique};

}

export function mergeOpenApiErrorResponses(
    mountBuiltin: Record<string, unknown>,
    throwableAndDomain: Record<string, unknown>,
): Record<string, unknown> {

    const merged = {...mountBuiltin};

    for (const [status, response] of Object.entries(throwableAndDomain)) {

        if (merged[status]) {

            const existing = merged[status] as {description?: string, content?: unknown};
            const incoming = response as {description?: string, content?: unknown};
            const existingSchema = jsonResponseSchema(existing.content);
            const incomingSchema = jsonResponseSchema(incoming.content);

            merged[status] = {
                description: [existing.description, incoming.description].filter(Boolean).join(' | '),
                content: existingSchema && incomingSchema
                    ? withJsonSchema(mergeJsonSchemas(existingSchema, incomingSchema))
                    : incoming.content ?? existing.content,
            };
            continue;

        }

        merged[status] = response;

    }

    return merged;

}
