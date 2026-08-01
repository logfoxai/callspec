export type GeneratedType = {
    name: string
    definition: string
};

export type SchemaToTypesResult = {
    typeName: string
    types: GeneratedType[]
};

const TS_RESERVED = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for',
    'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return', 'super',
    'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with',
    'implements', 'interface', 'let', 'package', 'private', 'protected', 'public',
    'static', 'yield', 'await',
]);

export function sanitizeMethodName(routeName: string): string {

    let name = routeName.replace(/[^a-zA-Z0-9_$]/g, '_');

    if (/^[0-9]/.test(name)) {

        name = `_${name}`;

    }

    if (TS_RESERVED.has(name)) {

        name = `${name}_`;

    }

    return name;

}

export function typeNameForRoute(routeName: string, suffix: string): string {

    const base = routeName
        .split(/[^a-zA-Z0-9]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    return `${base || 'Route'}${suffix}`;

}

function isRecord(value: unknown): value is Record<string, unknown> {

    return typeof value === 'object' && value !== null && !Array.isArray(value);

}

function uniqueTypeName(base: string, used: Set<string>): string {

    let name = base;

    if (!used.has(name)) {

        used.add(name);
        return name;

    }

    let index = 2;

    while (used.has(`${name}${index}`)) {

        index += 1;

    }

    name = `${base}${index}`;
    used.add(name);

    return name;

}

function schemaType(
    schema: unknown,
    typePrefix: string,
    usedNames: Set<string>,
    generated: GeneratedType[],
    options?: {isRoot?: boolean},
): string {

    if (!isRecord(schema)) return 'unknown';

    if (Array.isArray(schema.enum) && schema.enum.length > 0) {

        return schema.enum.map((value) => JSON.stringify(value)).join(' | ');

    }

    if ('const' in schema) {

        return JSON.stringify(schema.const);

    }

    const nullable = schema.nullable === true
        || (Array.isArray(schema.type) && schema.type.includes('null'));

    const primaryType = Array.isArray(schema.type)
        ? schema.type.find((entry) => entry !== 'null')
        : schema.type;

    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {

        const parts = schema.anyOf.map((entry, index) => schemaType(
            entry,
            `${typePrefix}AnyOf${index + 1}`,
            usedNames,
            generated,
        ));

        const union = [...new Set(parts)].join(' | ');

        return nullable ? `${union} | null` : union;

    }

    if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {

        const parts = schema.oneOf.map((entry, index) => schemaType(
            entry,
            `${typePrefix}OneOf${index + 1}`,
            usedNames,
            generated,
        ));

        const union = [...new Set(parts)].join(' | ');

        return nullable ? `${union} | null` : union;

    }

    if (primaryType === 'string') {

        if (schema.format === 'date-time' || schema.format === 'date') return 'Date';

        return 'string';

    }

    if (primaryType === 'number' || primaryType === 'integer') return 'number';

    if (primaryType === 'boolean') return 'boolean';

    if (primaryType === 'array') {

        const itemType = schemaType(schema.items, `${typePrefix}Item`, usedNames, generated);

        return `${itemType}[]`;

    }

    if (primaryType === 'object' || isRecord(schema.properties)) {

        const properties = schema.properties as Record<string, unknown> | undefined;

        if (!properties || !Object.keys(properties).length) {

            if (schema.additionalProperties === true) return 'Record<string, unknown>';

            if (isRecord(schema.additionalProperties)) {

                const valueType = schemaType(
                    schema.additionalProperties,
                    `${typePrefix}Value`,
                    usedNames,
                    generated,
                );

                return `Record<string, ${valueType}>`;

            }

            return 'Record<string, unknown>';

        }

        const required = Array.isArray(schema.required) ? schema.required as string[] : [];
        const fields = Object.keys(properties).sort((a, b) => a.localeCompare(b));
        const lines: string[] = [];

        for (const key of fields) {

            const optional = required.includes(key) ? '' : '?';
            const fieldType = schemaType(
                properties[key],
                `${typePrefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`,
                usedNames,
                generated,
            );

            lines.push(`    ${JSON.stringify(key)}${optional}: ${fieldType};`);

        }

        const objectType = `{\n${lines.join('\n')}\n}`;

        if (options?.isRoot) {

            return objectType;

        }

        const nestedName = uniqueTypeName(typePrefix, usedNames);

        generated.push({
            name: nestedName,
            definition: `export type ${nestedName} = ${objectType};`,
        });

        return nullable ? `${nestedName} | null` : nestedName;

    }

    return 'unknown';

}

export function schemaToTypes(
    schema: unknown,
    rootTypeName: string,
): SchemaToTypesResult {

    const usedNames = new Set<string>();
    const generated: GeneratedType[] = [];
    const rootType = schemaType(schema, rootTypeName, usedNames, generated, {isRoot: true});

    generated.unshift({
        name: rootTypeName,
        definition: `export type ${rootTypeName} = ${rootType};`,
    });

    return {
        typeName: rootTypeName,
        types: generated,
    };

}

export function assertGeneratableSchema(schema: unknown, label: string): void {

    if (!isRecord(schema)) {

        throw new Error(`${label} must be a JSON Schema object`);

    }

    if ('$ref' in schema) {

        throw new Error(`${label} uses unsupported JSON Schema $ref`);

    }

}
