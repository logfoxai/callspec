import {omitUndefined} from './objectUtils';
import {
    CALLSPEC_DOCUMENT_VERSION,
    CallspecDocumentError,
    type CallspecDocument,
    type CallspecDocumentRoute,
    type JsonSchema,
} from './callspecDocumentTypes';

export {
    CALLSPEC_DOCUMENT_VERSION,
    CallspecDocumentError,
} from './callspecDocumentTypes';
export type {
    CallspecDocument,
    CallspecDocumentRoute,
    JsonSchema,
} from './callspecDocumentTypes';

type CallspecDocumentRouteError = {
    status: number
    data?: JsonSchema
    dataRequired?: boolean
};

function isRecord(value: unknown): value is Record<string, unknown> {

    return typeof value === 'object' && value !== null && !Array.isArray(value);

}

function parseEncoding(value: unknown, routeName: string): 'json' | 'multipart' | undefined {

    if (value === undefined) return undefined;

    if (value === 'json' || value === 'multipart') return value;

    throw new CallspecDocumentError(`Route "${routeName}" has invalid encoding value`);

}

function parseAuth(value: unknown, routeName: string): 'none' | 'bearer' {

    if (value === 'none' || value === 'bearer') return value;

    throw new CallspecDocumentError(`Route "${routeName}" has invalid auth value`);

}

function parseScope(value: unknown, routeName: string): 'public' | 'private' {

    if (value === 'public' || value === 'private') return value;

    throw new CallspecDocumentError(`Route "${routeName}" has invalid scope value`);

}

function parseAuthScope(
    value: Record<string, unknown>,
    routeName: string,
): {auth: 'none' | 'bearer'; scope: 'public' | 'private'} {

    return {
        auth: parseAuth(value.auth, routeName),
        scope: parseScope(value.scope ?? 'public', routeName),
    };

}

function parseJsonSchema(value: unknown, label: string): JsonSchema {

    if (!isRecord(value)) {

        throw new CallspecDocumentError(`${label} must be a JSON Schema object`);

    }

    return value;

}

function parseRouteErrors(value: unknown, routeName: string): Record<string, CallspecDocumentRouteError> | undefined {

    if (value === undefined) {

        return undefined;

    }

    if (!isRecord(value)) {

        throw new CallspecDocumentError(`Route "${routeName}" errors must be an object`);

    }

    const errors: Record<string, CallspecDocumentRouteError> = {};

    for (const [code, entry] of Object.entries(value)) {

        if (!isRecord(entry) || typeof entry.status !== 'number') {

            throw new CallspecDocumentError(`Route "${routeName}" error "${code}" must include numeric status`);

        }

        errors[code] = {
            status: entry.status,
            ...(entry.data !== undefined
                ? {data: parseJsonSchema(entry.data, `Route "${routeName}" error "${code}" data`)}
                : {}),
            ...(entry.dataRequired === false ? {dataRequired: false} : {}),
        };

    }

    return Object.keys(errors).length ? errors : undefined;

}

function parseRoute(name: string, value: unknown): CallspecDocumentRoute {

    if (!isRecord(value)) {

        throw new CallspecDocumentError(`Route "${name}" must be an object`);

    }

    const routeName = typeof value.name === 'string' && value.name.length
        ? value.name
        : name;

    if (routeName !== name) {

        throw new CallspecDocumentError(`Route key "${name}" does not match route.name "${routeName}"`);

    }

    if (value.method !== 'POST') {

        throw new CallspecDocumentError(`Route "${name}" must use method POST`);

    }

    if (typeof value.path !== 'string' || !value.path.startsWith('/')) {

        throw new CallspecDocumentError(`Route "${name}" must have an absolute path starting with /`);

    }

    const mcp = value.mcp;

    if (!isRecord(mcp) || typeof mcp.enabled !== 'boolean') {

        throw new CallspecDocumentError(`Route "${name}" must include mcp.enabled`);

    }

    const {auth, scope} = parseAuthScope(value, name);
    const encoding = parseEncoding(value.encoding, name);

    return {
        name: routeName,
        path: value.path,
        method: 'POST',
        summary: typeof value.summary === 'string' ? value.summary : routeName,
        description: typeof value.description === 'string' ? value.description : '',
        tags: Array.isArray(value.tags) ? value.tags.map(String) : [],
        auth,
        scope,
        ...(encoding ? {encoding} : {}),
        input: parseJsonSchema(value.input, `Route "${name}" input`),
        output: parseJsonSchema(value.output, `Route "${name}" output`),
        errors: parseRouteErrors(value.errors, name),
        mcp: {enabled: mcp.enabled},
    };

}

export function parseCallspecDocument(raw: unknown): CallspecDocument {

    if (!isRecord(raw)) {

        throw new CallspecDocumentError('Callspec document must be an object');

    }

    const version = raw.callspec;
    const expectedMajor = CALLSPEC_DOCUMENT_VERSION.split('.')[0];

    if (typeof version !== 'string' || version.split('.')[0] !== expectedMajor) {

        throw new CallspecDocumentError(
            `Unsupported Callspec document version "${String(version)}" (expected ${expectedMajor}.x)`,
        );

    }

    if (!isRecord(raw.info)) {

        throw new CallspecDocumentError('Callspec document must include info');

    }

    if (typeof raw.info.title !== 'string' || typeof raw.info.version !== 'string') {

        throw new CallspecDocumentError('Callspec info.title and info.version must be strings');

    }

    if (!isRecord(raw.routes)) {

        throw new CallspecDocumentError('Callspec document must include routes');

    }

    const routes: Record<string, CallspecDocumentRoute> = {};
    const sortedNames = Object.keys(raw.routes).sort((a, b) => a.localeCompare(b));

    for (const name of sortedNames) {

        routes[name] = parseRoute(name, raw.routes[name]);

    }

    let exports: Record<string, JsonSchema> | undefined;

    if (raw.exports !== undefined) {

        if (!isRecord(raw.exports)) {

            throw new CallspecDocumentError('Callspec exports must be an object when present');

        }

        exports = {};

        for (const name of Object.keys(raw.exports).sort((a, b) => a.localeCompare(b))) {

            exports[name] = parseJsonSchema(
                raw.exports[name],
                `Export "${name}"`,
            );

        }

    }

    return {
        callspec: CALLSPEC_DOCUMENT_VERSION,
        info: omitUndefined({
            title: raw.info.title,
            version: raw.info.version,
            description: typeof raw.info.description === 'string'
                ? raw.info.description
                : undefined,
        }),
        exports,
        routes,
    };

}
