import {builtInErrorDefs} from './builtinErrors';
import {toJsonSchema} from 'runtyp';
import type {JsonSchema} from './callspecDocument';
import {mergeOpenApiErrorResponses, openApiMountBuiltinErrorResponses} from './builtinErrors';
import {unwrapOptionalPred} from './routeErrorPred';
import type {RouteErrorDef} from './types';

function errorWireSchema(code: string, def: RouteErrorDef): JsonSchema {

    const properties: Record<string, JsonSchema> = {
        error: {const: code},
    };
    const required = ['error'];

    if (def.data) {

        const {pred, optional} = unwrapOptionalPred(def.data);

        properties.data = toJsonSchema(pred) as JsonSchema;

        if (!optional) {

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

/** Payload schemas for callspec.json — wire shape is always `{ error, data? }`. */
export function documentRouteErrors(
    errors: Record<string, RouteErrorDef> | undefined,
): Record<string, {status: number, data?: JsonSchema, dataRequired?: boolean}> | undefined {

    if (!errors || !Object.keys(errors).length) {

        return undefined;

    }

    const documented: Record<string, {status: number, data?: JsonSchema, dataRequired?: boolean}> = {};

    for (const [code, def] of Object.entries(errors)) {

        const entry: {status: number, data?: JsonSchema, dataRequired?: boolean} = {
            status: def.status,
        };

        if (def.data) {

            const {pred, optional} = unwrapOptionalPred(def.data);

            entry.data = toJsonSchema(pred) as JsonSchema;
            entry.dataRequired = !optional;

        }

        documented[code] = entry;

    }

    return documented;

}

export function openApiErrorResponses(
    domainErrors: Record<string, RouteErrorDef> | undefined,
    options: {includeUnauthorized?: boolean} = {},
): Record<string, unknown> {

    const mountBuiltin = openApiMountBuiltinErrorResponses({
        includeUnauthorized: options.includeUnauthorized,
    });

    const errors = {
        ...builtInErrorDefs,
        ...domainErrors,
    };

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

    return mergeOpenApiErrorResponses(mountBuiltin, domain);

}
