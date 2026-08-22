import {toJsonSchema, type Pred} from 'runtyp';
import type {JsonSchema} from './callspecDocumentTypes';
import {routeFileFields} from './file';

export function inputJsonSchema(input: Pred<unknown>): JsonSchema {

    const schema = toJsonSchema(input) as JsonSchema;
    const fields = routeFileFields(input);

    if (fields.length === 0) return schema;

    const properties = {
        ...((schema.properties as Record<string, JsonSchema> | undefined) ?? {}),
    };

    for (const field of fields) {

        properties[field.name] = {
            type: 'string',
            format: 'binary',
            ...(field.opts.mime?.length === 1
                ? {contentMediaType: field.opts.mime[0]}
                : {}),
        };

    }

    return {
        ...schema,
        properties,
    };

}
