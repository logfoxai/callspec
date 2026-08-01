import {toJsonSchema} from 'runtyp';
import type {JsonSchema} from './callspecDocument';
import {mergeOpenApiErrorResponses, openApiFrameworkErrorResponses} from './frameworkErrors';
import type {RouteErrorDef} from './types';

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

    const framework = openApiFrameworkErrorResponses({
        includeUnauthorized: options.includeUnauthorized,
    });

    if (!errors) {

        return framework;

    }

    const domain: Record<string, unknown> = {};

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

        domain[statusKey] = {
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

    return mergeOpenApiErrorResponses(framework, domain);

}
