import type {CallspecDocument} from '../callspecDocumentTypes';
import {
    assertGeneratableValidatorSchema,
    schemaToRuntyp,
    typeNameForExport,
} from '../generateValidators/schemaToRuntyp';
import {
    generateStringEnumConst,
    isStringEnumSchema,
    sanitizeMethodName,
} from './schemaToTypeScript';

function claimPredName(usedNames: Set<string>, name: string, label: string): string {

    if (usedNames.has(name)) {

        throw new Error(`Duplicate validator name "${name}" (${label})`);

    }

    usedNames.add(name);

    return name;

}

/**
 * Runtyp preds for `export const schemas = { … }` plus Infer types for spec exports only.
 * Route Input/Output types stay in client TS codegen (no Infer re-export — avoids collisions).
 */
export function generateSchemasSection(document: CallspecDocument): string {

    const usedPredNames = new Set<string>();
    const schemaEntries: string[] = [];
    const exportTypeBlocks: string[] = [];
    const exportNames = document.exports
        ? Object.keys(document.exports).sort((a, b) => a.localeCompare(b))
        : [];
    const routeNames = Object.keys(document.routes).sort((a, b) => a.localeCompare(b));

    for (const exportKey of exportNames) {

        const schema = document.exports![exportKey];

        assertGeneratableValidatorSchema(schema, `Export "${exportKey}"`);

        const predName = claimPredName(
            usedPredNames,
            sanitizeMethodName(exportKey),
            `export "${exportKey}"`,
        );
        const typeName = typeNameForExport(exportKey);
        const expr = schemaToRuntyp(schema);

        schemaEntries.push(`    ${predName}: ${expr},`);

        if (isStringEnumSchema(schema)) {

            exportTypeBlocks.push(generateStringEnumConst(typeName, schema.enum));

        } else {

            exportTypeBlocks.push(`export type ${typeName} = Infer<typeof schemas.${predName}>;`);

        }

    }

    for (const routeName of routeNames) {

        const route = document.routes[routeName];

        assertGeneratableValidatorSchema(route.input, `Route "${routeName}" input`);
        assertGeneratableValidatorSchema(route.output, `Route "${routeName}" output`);

        const inputPred = claimPredName(
            usedPredNames,
            `${sanitizeMethodName(routeName)}Input`,
            `route "${routeName}" input`,
        );
        const outputPred = claimPredName(
            usedPredNames,
            `${sanitizeMethodName(routeName)}Output`,
            `route "${routeName}" output`,
        );

        schemaEntries.push(`    ${inputPred}: ${schemaToRuntyp(route.input)},`);
        schemaEntries.push(`    ${outputPred}: ${schemaToRuntyp(route.output)},`);

    }

    if (schemaEntries.length === 0) {

        return '';

    }

    const parts = [
        `export const schemas = {`,
        ...schemaEntries,
        `} as const;`,
    ];

    if (exportTypeBlocks.length) {

        parts.push('');
        parts.push(...exportTypeBlocks);

    }

    return parts.join('\n');

}
