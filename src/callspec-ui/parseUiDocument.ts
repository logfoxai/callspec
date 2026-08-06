import type {CallspecDocument, CallspecDocumentRoute, JsonSchema} from '../callspecDocumentTypes';
import {CALLSPEC_DOCUMENT_VERSION, CallspecDocumentError} from '../callspecDocumentTypes';

function isRecord(value: unknown): value is Record<string, unknown> {

    return typeof value === 'object' && value !== null && !Array.isArray(value);

}

function coerceSchema(value: unknown): JsonSchema {

    return isRecord(value) ? value : {};

}

function coerceAuthScope(route: Record<string, unknown>): {auth: 'none' | 'bearer'; scope: 'public' | 'private'} {

    return {
        auth: route.auth === 'bearer' ? 'bearer' : 'none',
        scope: route.scope === 'private' ? 'private' : 'public',
    };

}

function coerceRoute(name: string, value: unknown): CallspecDocumentRoute {

    const route = isRecord(value) ? value : {};
    const routeName = typeof route.name === 'string' && route.name.length
        ? route.name
        : name;
    const {auth, scope} = coerceAuthScope(route);

    return {
        name: routeName,
        path: typeof route.path === 'string' ? route.path : `/${routeName}`,
        method: 'POST',
        summary: typeof route.summary === 'string' ? route.summary : routeName,
        description: typeof route.description === 'string' ? route.description : '',
        tags: Array.isArray(route.tags) ? route.tags.map(String) : [],
        auth,
        scope,
        input: coerceSchema(route.input),
        output: coerceSchema(route.output),
        mcp: {
            enabled: isRecord(route.mcp) && route.mcp.enabled === true,
        },
    };

}

/** Lightweight parser for browser docs UI — trusts server-emitted callspec.json. */
export function parseUiCallspecDocument(raw: unknown): CallspecDocument {

    if (!isRecord(raw)) {

        throw new CallspecDocumentError('Callspec document must be an object');

    }

    const version = raw.callspec;

    if (typeof version !== 'string' || version.split('.')[0] !== CALLSPEC_DOCUMENT_VERSION.split('.')[0]) {

        throw new CallspecDocumentError(
            `Unsupported Callspec document version "${String(version)}" (expected ${CALLSPEC_DOCUMENT_VERSION})`,
        );

    }

    if (!isRecord(raw.info)
        || typeof raw.info.title !== 'string'
        || typeof raw.info.version !== 'string') {

        throw new CallspecDocumentError('Callspec document must include info.title and info.version');

    }

    if (!isRecord(raw.routes)) {

        throw new CallspecDocumentError('Callspec document must include routes');

    }

    const routes: Record<string, CallspecDocumentRoute> = {};
    const sortedNames = Object.keys(raw.routes).sort((a, b) => a.localeCompare(b));

    for (const name of sortedNames) {

        routes[name] = coerceRoute(name, raw.routes[name]);

    }

    return {
        callspec: CALLSPEC_DOCUMENT_VERSION,
        info: {
            title: raw.info.title,
            version: raw.info.version,
            ...(typeof raw.info.description === 'string'
                ? {description: raw.info.description}
                : {}),
        },
        routes,
    };

}
