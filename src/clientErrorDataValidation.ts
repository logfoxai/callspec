import type {JsonSchema} from './callspecDocumentTypes';

export type DomainErrorContract = {
    data?: JsonSchema
    dataRequired?: boolean
};

type ValidationOk = {isValid: true, value: unknown};

type ValidationFail = {isValid: false};

export type ErrorDataValidationResult = ValidationOk | ValidationFail;

function isRecord(value: unknown): value is Record<string, unknown> {

    return typeof value === 'object' && value !== null && !Array.isArray(value);

}

function primaryType(schema: JsonSchema): string | undefined {

    if (typeof schema.type === 'string') {

        return schema.type;

    }

    if (Array.isArray(schema.type)) {

        return schema.type.find((entry) => entry !== 'null');

    }

    return undefined;

}

function validateSchema(schema: JsonSchema, value: unknown): ErrorDataValidationResult {

    if ('const' in schema) {

        return value === schema.const ? {isValid: true, value} : {isValid: false};

    }

    if (Array.isArray(schema.enum) && schema.enum.length > 0) {

        return schema.enum.includes(value) ? {isValid: true, value} : {isValid: false};

    }

    if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {

        for (const entry of schema.oneOf) {

            const result = validateSchema(entry as JsonSchema, value);

            if (result.isValid) {

                return result;

            }

        }

        return {isValid: false};

    }

    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {

        for (const entry of schema.anyOf) {

            const result = validateSchema(entry as JsonSchema, value);

            if (result.isValid) {

                return result;

            }

        }

        return {isValid: false};

    }

    const type = primaryType(schema);

    if (type === 'string') {

        return typeof value === 'string' ? {isValid: true, value} : {isValid: false};

    }

    if (type === 'number' || type === 'integer') {

        return typeof value === 'number' && Number.isFinite(value)
            ? {isValid: true, value}
            : {isValid: false};

    }

    if (type === 'boolean') {

        return typeof value === 'boolean' ? {isValid: true, value} : {isValid: false};

    }

    if (type === 'array') {

        if (!Array.isArray(value)) {

            return {isValid: false};

        }

        if (schema.items) {

            const validatedItems: unknown[] = [];

            for (const item of value) {

                const result = validateSchema(schema.items as JsonSchema, item);

                if (!result.isValid) {

                    return {isValid: false};

                }

                validatedItems.push(result.value);

            }

            return {isValid: true, value: validatedItems};

        }

        return {isValid: true, value};

    }

    if (type === 'object' || isRecord(schema.properties)) {

        if (!isRecord(value)) {

            return {isValid: false};

        }

        const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
        const required = new Set(Array.isArray(schema.required) ? schema.required as string[] : []);
        const output: Record<string, unknown> = {};

        for (const key of Object.keys(properties)) {

            const fieldSchema = properties[key]!;
            const fieldValue = value[key];

            if (fieldValue === undefined) {

                if (required.has(key)) {

                    return {isValid: false};

                }

                continue;

            }

            const result = validateSchema(fieldSchema, fieldValue);

            if (!result.isValid) {

                return {isValid: false};

            }

            output[key] = result.value;

        }

        if (schema.additionalProperties !== true) {

            for (const key of Object.keys(value)) {

                if (!(key in properties)) {

                    return {isValid: false};

                }

            }

        }

        return {isValid: true, value: output};

    }

    if (Object.keys(schema).length === 0) {

        return {isValid: true, value};

    }

    return {isValid: false};

}

/** Validate domain error `data` against the callspec.json schema for that code. */
export function validateDomainErrorData(
    contract: DomainErrorContract,
    data: unknown,
): ErrorDataValidationResult {

    if (!contract.data) {

        return data === undefined ? {isValid: true, value: undefined} : {isValid: false};

    }

    if (data === undefined) {

        return contract.dataRequired === false
            ? {isValid: true, value: undefined}
            : {isValid: false};

    }

    return validateSchema(contract.data, data);

}

export type DomainErrorPayloadParseResult =
    | {ok: true, data?: unknown}
    | {ok: false};

/** Validate wire `data` for a route-declared domain error code. */
export function parseDomainErrorPayload(
    contract: DomainErrorContract,
    wireData: unknown,
): DomainErrorPayloadParseResult {

    const validation = validateDomainErrorData(contract, wireData);

    if (!validation.isValid) {

        return {ok: false};

    }

    return validation.value === undefined
        ? {ok: true}
        : {ok: true, data: validation.value};

}
