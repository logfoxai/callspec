import {toJsonSchema} from 'runtyp';
import type {JsonSchema} from './callspecDocument';
import type {RouteErrorDef} from './types';

const VALIDATION_ERROR_SCHEMA: JsonSchema = {
    type: 'object',
    properties: {
        error: {type: 'string'},
        errors: {type: 'object', additionalProperties: {type: 'string'}},
    },
    required: ['error', 'errors'],
};

function errorWireSchema(code: string, def: RouteErrorDef): JsonSchema {

    const properties: Record<string, JsonSchema> = {
        error: {const: code},
    };
    const required = ['error'];

    if (def.data) {

        properties.data = toJsonSchema(def.data) as JsonSchema;
        required.push('data');

    }

    return {
        type: 'object',
        properties,
        required,
        additionalProperties: false,
    };

}

/** Payload schemas for callspec.json — wire shape is always `{ error, data? }`. */
export function documentRouteErrors(
    errors: Record<string, RouteErrorDef> | undefined,
): Record<string, {status: number, data?: JsonSchema}> | undefined {

    if (!errors || !Object.keys(errors).length) {

        return undefined;

    }

    const documented: Record<string, {status: number, data?: JsonSchema}> = {};

    for (const [code, def] of Object.entries(errors)) {

        documented[code] = {
            status: def.status,
            ...(def.data ? {data: toJsonSchema(def.data) as JsonSchema} : {}),
        };

    }

    return documented;

}

export function openApiErrorResponses(
    errors: Record<string, RouteErrorDef> | undefined,
    options: {includeUnauthorized?: boolean} = {},
): Record<string, unknown> {

    const responses: Record<string, unknown> = {
        400: {
            description: 'Validation error',
            content: {
                'application/json': {
                    schema: VALIDATION_ERROR_SCHEMA,
                },
            },
        },
    };

    if (options.includeUnauthorized) {

        responses['401'] = {description: 'Unauthorized'};

    }

    if (!errors) {

        return responses;

    }

    const byStatus = new Map<number, Array<{code: string, schema: JsonSchema}>>();

    for (const [code, def] of Object.entries(errors)) {

        const group = byStatus.get(def.status) ?? [];

        group.push({code, schema: errorWireSchema(code, def)});
        byStatus.set(def.status, group);

    }

    for (const [status, entries] of byStatus.entries()) {

        const statusKey = String(status);
        const domainSchemas = entries.map((entry) => entry.schema);
        const domainDescription = entries.map((entry) => entry.code).join(' | ');

        if (status === 400) {

            responses[statusKey] = {
                description: `Validation error | ${domainDescription}`,
                content: {
                    'application/json': {
                        schema: {oneOf: [VALIDATION_ERROR_SCHEMA, ...domainSchemas]},
                    },
                },
            };
            continue;

        }

        responses[statusKey] = {
            description: domainDescription,
            content: {
                'application/json': {
                    schema: domainSchemas.length === 1
                        ? domainSchemas[0]
                        : {oneOf: domainSchemas},
                },
            },
        };

    }

    return responses;

}
