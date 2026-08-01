export const CALLSPEC_DOCUMENT_VERSION = '1.0' as const;

export type JsonSchema = Record<string, unknown>;

type CallspecDocumentRouteError = {
    status: number
    data?: JsonSchema
};

export type CallspecDocumentRoute = {
    name: string
    path: string
    method: 'POST'
    summary: string
    description: string
    tags: string[]
    access: 'public' | 'private'
    input: JsonSchema
    output: JsonSchema
    errors?: Record<string, CallspecDocumentRouteError>
    mcp: {
        enabled: boolean
    }
};

export type CallspecDocument = {
    callspec: typeof CALLSPEC_DOCUMENT_VERSION
    info: {
        title: string
        version: string
        description?: string
    }
    routes: Record<string, CallspecDocumentRoute>
};

export class CallspecDocumentError extends Error {

    constructor(message: string) {

        super(message);
        this.name = 'CallspecDocumentError';

    }

}

function isRecord(value: unknown): value is Record<string, unknown> {

    return typeof value === 'object' && value !== null && !Array.isArray(value);

}

function parseAccess(value: unknown, routeName: string): 'public' | 'private' {

    if (value === 'public' || value === 'private') return value;

    throw new CallspecDocumentError(`Route "${routeName}" has invalid access value`);

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

    return {
        name: routeName,
        path: value.path,
        method: 'POST',
        summary: typeof value.summary === 'string' ? value.summary : routeName,
        description: typeof value.description === 'string' ? value.description : '',
        tags: Array.isArray(value.tags) ? value.tags.map(String) : [],
        access: parseAccess(value.access, name),
        input: parseJsonSchema(value.input, `Route "${name}" input`),
        output: parseJsonSchema(value.output, `Route "${name}" output`),
        errors: parseRouteErrors(value.errors, name),
        mcp: {enabled: mcp.enabled},
    };

}

function omitUndefined<T extends Record<string, unknown>>(value: T): T {

    const out = {} as T;

    for (const [key, entry] of Object.entries(value)) {

        if (entry !== undefined) {

            (out as Record<string, unknown>)[key] = entry;

        }

    }

    return out;

}

export function parseCallspecDocument(raw: unknown): CallspecDocument {

    if (!isRecord(raw)) {

        throw new CallspecDocumentError('Callspec document must be an object');

    }

    const version = raw.callspec;

    if (version !== CALLSPEC_DOCUMENT_VERSION) {

        if (typeof version === 'string' && version.split('.')[0] !== CALLSPEC_DOCUMENT_VERSION.split('.')[0]) {

            throw new CallspecDocumentError(
                `Unsupported Callspec document version "${version}" (expected ${CALLSPEC_DOCUMENT_VERSION})`,
            );

        }

        throw new CallspecDocumentError(
            `Unsupported Callspec document version "${String(version)}" (expected ${CALLSPEC_DOCUMENT_VERSION})`,
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

    return {
        callspec: CALLSPEC_DOCUMENT_VERSION,
        info: omitUndefined({
            title: raw.info.title,
            version: raw.info.version,
            description: typeof raw.info.description === 'string'
                ? raw.info.description
                : undefined,
        }),
        routes,
    };

}
