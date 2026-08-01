import {toJsonSchema} from 'runtyp';
import type {RoutesMap} from './types';
import {joinRoutePath} from './metaDefaults';
import {
    CALLSPEC_DOCUMENT_VERSION,
    type CallspecDocument,
    type CallspecDocumentRoute,
    type JsonSchema,
} from './callspecDocument';
import {documentRouteErrors} from './routeErrorDocument';

export type EmitCallspecOptions = {
    title: string
    version: string
    basePath?: string
    description?: string
};

function omitUndefined<T extends Record<string, unknown>>(value: T): T {

    const out = {} as T;

    for (const [key, entry] of Object.entries(value)) {

        if (entry !== undefined) {

            (out as Record<string, unknown>)[key] = entry;

        }

    }

    return out;

}

export function emitCallspec(
    routes: RoutesMap<any>,
    options: EmitCallspecOptions,
): CallspecDocument {

    const basePath = options.basePath ?? '';
    const sortedNames = Object.keys(routes).sort((a, b) => a.localeCompare(b));
    const documentRoutes: Record<string, CallspecDocumentRoute> = {};

    for (const name of sortedNames) {

        const route = routes[name];

        documentRoutes[name] = omitUndefined({
            name,
            path: joinRoutePath(basePath, name),
            method: 'POST',
            summary: route.meta.summary,
            description: route.meta.description,
            tags: [...route.meta.tags],
            access: route.access,
            input: toJsonSchema(route.input) as JsonSchema,
            output: toJsonSchema(route.output) as JsonSchema,
            errors: documentRouteErrors(route.errors),
            mcp: {
                enabled: Boolean(route.mcp),
            },
        });

    }

    return {
        callspec: CALLSPEC_DOCUMENT_VERSION,
        info: omitUndefined({
            title: options.title,
            version: options.version,
            description: options.description,
        }),
        routes: documentRoutes,
    };

}
