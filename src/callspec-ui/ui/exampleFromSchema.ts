function isPlainObject(value: unknown): value is Record<string, unknown> {

    return typeof value === 'object' && value !== null && !Array.isArray(value);

}

export function exampleFromSchema(schema: unknown, key?: string): unknown {

    if (!isPlainObject(schema)) return {};

    if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];

    if (schema.const !== undefined) return schema.const;

    const type = schema.type;

    if (type === 'string') {

        if (key?.toLowerCase().includes('id')) return '00000000-0000-0000-0000-000000000000';
        if (key?.toLowerCase().includes('email')) return 'user@example.com';
        return '';

    }

    if (type === 'number' || type === 'integer') return 0;

    if (type === 'boolean') return false;

    if (type === 'array') {

        const items = schema.items;

        return items ? [exampleFromSchema(items)] : [];

    }

    if (type === 'object' || schema.properties) {

        const props = isPlainObject(schema.properties) ? schema.properties : undefined;
        const required = Array.isArray(schema.required)
            ? schema.required.filter((item): item is string => typeof item === 'string')
            : [];
        const out: Record<string, unknown> = {};

        if (props) {

            for (const [propKey, propSchema] of Object.entries(props)) {

                if (required.includes(propKey) || Object.keys(out).length < 4) {

                    out[propKey] = exampleFromSchema(propSchema, propKey);

                }

            }

        }

        return out;

    }

    return null;

}

export function errorWireExample(code: string, dataSchema?: unknown): {error: string, data?: unknown} {

    const out: {error: string, data?: unknown} = {error: code};

    if (dataSchema) {

        out.data = exampleFromSchema(dataSchema);

    }

    return out;

}
