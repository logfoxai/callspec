import type {JsonSchema} from './callspecDocument';

/** Framework-owned error codes — always JSON `{ error, data? }`, never declared per route. */
export const FRAMEWORK_ERROR = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
} as const;

export type FrameworkErrorCode = typeof FRAMEWORK_ERROR[keyof typeof FRAMEWORK_ERROR];

export type CallspecUnauthorizedErrorBody = {
    error: typeof FRAMEWORK_ERROR.UNAUTHORIZED
};

export type CallspecInternalErrorBody = {
    error: typeof FRAMEWORK_ERROR.INTERNAL_ERROR
};

export type CallspecRouteNotFoundErrorBody = {
    error: typeof FRAMEWORK_ERROR.ROUTE_NOT_FOUND
    data: {route: string}
};

export type CallspecValidationErrorBody = {
    error: typeof FRAMEWORK_ERROR.VALIDATION_ERROR
    errors: Record<string, string>
};

export type CallspecFrameworkErrorBody =
    | CallspecValidationErrorBody
    | CallspecUnauthorizedErrorBody
    | CallspecInternalErrorBody
    | CallspecRouteNotFoundErrorBody;

const VALIDATION_ERROR_SCHEMA: JsonSchema = {
    type: 'object',
    properties: {
        error: {const: FRAMEWORK_ERROR.VALIDATION_ERROR},
        errors: {type: 'object', additionalProperties: {type: 'string'}},
    },
    required: ['error', 'errors'],
};

const UNAUTHORIZED_ERROR_SCHEMA: JsonSchema = {
    type: 'object',
    properties: {
        error: {const: FRAMEWORK_ERROR.UNAUTHORIZED},
    },
    required: ['error'],
};

const INTERNAL_ERROR_SCHEMA: JsonSchema = {
    type: 'object',
    properties: {
        error: {const: FRAMEWORK_ERROR.INTERNAL_ERROR},
    },
    required: ['error'],
};

const ROUTE_NOT_FOUND_ERROR_SCHEMA: JsonSchema = {
    type: 'object',
    properties: {
        error: {const: FRAMEWORK_ERROR.ROUTE_NOT_FOUND},
        data: {
            type: 'object',
            properties: {route: {type: 'string'}},
            required: ['route'],
        },
    },
    required: ['error', 'data'],
};

export function openApiFrameworkErrorResponses(options: {
    includeUnauthorized?: boolean
} = {}): Record<string, unknown> {

    const responses: Record<string, unknown> = {
        400: {
            description: FRAMEWORK_ERROR.VALIDATION_ERROR,
            content: {
                'application/json': {schema: VALIDATION_ERROR_SCHEMA},
            },
        },
        404: {
            description: FRAMEWORK_ERROR.ROUTE_NOT_FOUND,
            content: {
                'application/json': {schema: ROUTE_NOT_FOUND_ERROR_SCHEMA},
            },
        },
        500: {
            description: FRAMEWORK_ERROR.INTERNAL_ERROR,
            content: {
                'application/json': {schema: INTERNAL_ERROR_SCHEMA},
            },
        },
    };

    if (options.includeUnauthorized) {

        responses['401'] = {
            description: FRAMEWORK_ERROR.UNAUTHORIZED,
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
    framework: Record<string, unknown>,
    domain: Record<string, unknown>,
): Record<string, unknown> {

    const merged = {...framework};

    for (const [status, response] of Object.entries(domain)) {

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
