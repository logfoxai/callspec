import {toJsonSchema, type Pred} from 'runtyp';
import type {RoutesMap} from './types';
import {joinRoutePath} from './metaDefaults';
import {
    CALLSPEC_DOCUMENT_VERSION,
    type CallspecDocument,
    type CallspecDocumentRoute,
    type JsonSchema,
} from './callspecDocument';
import {mergeDomainErrorDefs} from './commonErrors';
import {documentRouteErrors} from './routeErrorDocument';
import {omitUndefined} from './objectUtils';

export type EmitCallspecOptions = {
    title: string
    version: string
    basePath?: string
    description?: string
    /** Named runtyp preds for consumer codegen (filters, domain objects, shared slices). */
    exports?: Record<string, Pred<any>>
};

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
            errors: documentRouteErrors(mergeDomainErrorDefs(route.errors)),
            mcp: {
                enabled: Boolean(route.mcp),
            },
        });

    }

    let documentExports: Record<string, JsonSchema> | undefined;

    if (options.exports && Object.keys(options.exports).length > 0) {

        documentExports = {};

        for (const name of Object.keys(options.exports).sort((a, b) => a.localeCompare(b))) {

            documentExports[name] = toJsonSchema(options.exports[name]) as JsonSchema;

        }

    }

    return {
        callspec: CALLSPEC_DOCUMENT_VERSION,
        info: omitUndefined({
            title: options.title,
            version: options.version,
            description: options.description,
        }),
        exports: documentExports,
        routes: documentRoutes,
    };

}
