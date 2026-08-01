import {toJsonSchema} from 'runtyp';
import type {JsonSchema} from './callspecDocument';
import type {RouteErrorDef} from './types';

export function routeErrorSchemas(
    errors: Record<string, RouteErrorDef> | undefined,
): Record<string, {status: number, schema: JsonSchema}> | undefined {

    if (!errors || !Object.keys(errors).length) {

        return undefined;

    }

    const documented: Record<string, {status: number, schema: JsonSchema}> = {};

    for (const [code, def] of Object.entries(errors)) {

        const properties: Record<string, JsonSchema> = {
            error: {const: code},
        };

        const required = ['error'];

        if (def.data) {

            properties.data = toJsonSchema(def.data) as JsonSchema;
            required.push('data');

        }

        documented[code] = {
            status: def.status,
            schema: {
                type: 'object',
                properties,
                required,
                additionalProperties: false,
            },
        };

    }

    return documented;

}

const VALIDATION_ERROR_SCHEMA: JsonSchema = {
    type: 'object',
    properties: {
        error: {type: 'string'},
        errors: {type: 'object', additionalProperties: {type: 'string'}},
    },
    required: ['error', 'errors'],
};

export function openApiErrorResponses(
    errors: Record<string, RouteErrorDef> | undefined,
    options: {includeUnauthorized?: boolean} = {},
): Record<string, unknown> {

    const responses: Record<string, unknown> = {
        200: {
            description: 'Success',
        },
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

        const documented = routeErrorSchemas({[code]: def})?.[code];

        if (!documented) continue;

        const group = byStatus.get(documented.status) ?? [];

        group.push({code, schema: documented.schema});
        byStatus.set(documented.status, group);

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
                        schema: domainSchemas.length === 1
                            ? {oneOf: [VALIDATION_ERROR_SCHEMA, domainSchemas[0]]}
                            : {oneOf: [VALIDATION_ERROR_SCHEMA, ...domainSchemas]},
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
