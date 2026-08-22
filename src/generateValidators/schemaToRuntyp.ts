import type {JsonSchema} from '../callspecDocumentTypes';

function isRecord(value: unknown): value is Record<string, unknown> {

    return typeof value === 'object' && value !== null && !Array.isArray(value);

}

function escapeString(value: string): string {

    return JSON.stringify(value);

}

function schemaToRuntypExpr(schema: unknown): string {

    if (!isRecord(schema)) {

        return 'p.any()';

    }

    if ('$ref' in schema) {

        throw new Error('JSON Schema $ref is not supported in validator codegen');

    }

    if (Array.isArray(schema.enum) && schema.enum.length > 0) {

        const literals = schema.enum.map((value) => `p.literal(${JSON.stringify(value)})`);

        if (literals.length === 1) return literals[0];

        return `p.union(${literals.join(', ')})`;

    }

    if ('const' in schema) {

        return `p.literal(${JSON.stringify(schema.const)})`;

    }

    if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {

        const parts = schema.oneOf.map((entry) => schemaToRuntypExpr(entry));

        if (parts.length === 1) return parts[0];

        return `p.union(${parts.join(', ')})`;

    }

    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {

        const parts = schema.anyOf.map((entry) => schemaToRuntypExpr(entry));

        if (parts.length === 1) return parts[0];

        return `p.union(${parts.join(', ')})`;

    }

    const primaryType = Array.isArray(schema.type)
        ? schema.type.find((entry) => entry !== 'null')
        : schema.type;

    if (primaryType === 'string') {

        if (schema.format === 'date-time' || schema.format === 'date') {

            return 'p.date()';

        }

        if (schema.format === 'binary') {

            return 'p.any()';

        }

        if (schema.format === 'email') {

            return 'p.email()';

        }

        if (schema.format === 'uuid') {

            return 'p.uuid()';

        }

        if (schema.format === 'uri' || schema.format === 'url') {

            return 'p.url()';

        }

        const opts: string[] = [];

        if (schema.minLength !== undefined || schema.maxLength !== undefined) {

            const lenParts: string[] = [];

            if (schema.minLength !== undefined) lenParts.push(`min: ${schema.minLength}`);
            if (schema.maxLength !== undefined) lenParts.push(`max: ${schema.maxLength}`);

            opts.push(`len: { ${lenParts.join(', ')} }`);

        }

        if (typeof schema.pattern === 'string') {

            opts.push(`pattern: ${escapeString(schema.pattern)}`);

        }

        if (opts.length === 0) return 'p.string()';

        return `p.string({ ${opts.join(', ')} })`;

    }

    if (primaryType === 'number' || primaryType === 'integer') {

        if (schema.minimum !== undefined || schema.maximum !== undefined) {

            const rangeParts: string[] = [];

            if (schema.minimum !== undefined) rangeParts.push(`min: ${schema.minimum}`);
            if (schema.maximum !== undefined) rangeParts.push(`max: ${schema.maximum}`);

            return `p.number({ range: { ${rangeParts.join(', ')} } })`;

        }

        return 'p.number()';

    }

    if (primaryType === 'boolean') {

        return 'p.boolean()';

    }

    if (primaryType === 'array') {

        const item = schemaToRuntypExpr(schema.items ?? {});

        const opts: string[] = [];

        if (schema.minItems !== undefined || schema.maxItems !== undefined) {

            const lenParts: string[] = [];

            if (schema.minItems !== undefined) lenParts.push(`min: ${schema.minItems}`);
            if (schema.maxItems !== undefined) lenParts.push(`max: ${schema.maxItems}`);

            opts.push(`len: { ${lenParts.join(', ')} }`);

        }

        if (opts.length === 0) return `p.array(${item})`;

        return `p.array(${item}, { ${opts.join(', ')} })`;

    }

    if (primaryType === 'object' || isRecord(schema.properties)) {

        const properties = schema.properties as Record<string, unknown> | undefined;

        if (!properties || !Object.keys(properties).length) {

            if (schema.additionalProperties === true) return 'p.any()';

            return 'p.any()';

        }

        const required = Array.isArray(schema.required) ? schema.required as string[] : [];
        const fields = Object.keys(properties).sort((a, b) => a.localeCompare(b));
        const lines: string[] = [];

        for (const key of fields) {

            let fieldExpr = schemaToRuntypExpr(properties[key]);

            if (!required.includes(key)) {

                fieldExpr = `p.optional(${fieldExpr})`;

            }

            lines.push(`${escapeString(key)}: ${fieldExpr}`);

        }

        const objectOpts: string[] = [];

        if (schema.additionalProperties === true) {

            objectOpts.push('allowUnknownKeys: true');

        }

        if (objectOpts.length === 0) {

            return `p.object({\n        ${lines.join(',\n        ')},\n    })`;

        }

        return `p.object({\n        ${lines.join(',\n        ')},\n    }, { ${objectOpts.join(', ')} })`;

    }

    if (Object.keys(schema).length === 0) {

        return 'p.any()';

    }

    throw new Error('Unsupported JSON Schema shape for validator codegen');

}

export function schemaToRuntyp(schema: JsonSchema): string {

    return schemaToRuntypExpr(schema);

}

export function assertGeneratableValidatorSchema(schema: unknown, label: string): void {

    if (!isRecord(schema)) {

        throw new Error(`${label} must be a JSON Schema object`);

    }

    if ('$ref' in schema) {

        throw new Error(`${label} uses unsupported JSON Schema $ref`);

    }

}

export function typeNameForExport(exportKey: string): string {

    return exportKey.charAt(0).toUpperCase() + exportKey.slice(1);

}
