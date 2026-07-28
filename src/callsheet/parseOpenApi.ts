export type CallsheetAccess = 'public' | 'private';

export type CallsheetRoute = {
    name: string
    summary: string
    description: string
    tags: string[]
    access: CallsheetAccess
    mcp: boolean
    inputSchema: unknown
    outputSchema: unknown
};

export type CallsheetSpec = {
    title: string
    version: string
    routes: CallsheetRoute[]
};

function readAccess(operation: Record<string, unknown>): CallsheetAccess {

    const ext = operation['x-callspec-access'];

    if (ext === 'public' || ext === 'private') return ext;

    const security = operation.security;

    if (Array.isArray(security) && security.length > 0) return 'private';

    return 'public';

}

function readMcp(operation: Record<string, unknown>): boolean {

    return operation['x-callspec-mcp'] === true;

}

function readJsonSchema(content: Record<string, unknown> | undefined): unknown {

    if (!content) return {type: 'object'};

    const appJson = content['application/json'];

    if (!appJson || typeof appJson !== 'object') return {type: 'object'};

    return (appJson as Record<string, unknown>).schema ?? {type: 'object'};

}

export function parseCallspecOpenApi(doc: Record<string, unknown>): CallsheetSpec {

    const info = doc.info as Record<string, unknown> | undefined;

    const paths = doc.paths as Record<string, Record<string, unknown>> | undefined;

    const routes: CallsheetRoute[] = [];

    if (paths) {

        for (const [pathKey, methods] of Object.entries(paths)) {

            const post = methods.post as Record<string, unknown> | undefined;

            if (!post) continue;

            const name = (post.operationId as string | undefined)
                ?? pathKey.replace(/^\//, '');

            const requestBody = post.requestBody as Record<string, unknown> | undefined;
            const content = requestBody?.content as Record<string, unknown> | undefined;

            const responses = post.responses as Record<string, unknown> | undefined;
            const ok = responses?.['200'] as Record<string, unknown> | undefined;
            const okContent = ok?.content as Record<string, unknown> | undefined;

            routes.push({
                name,
                summary: (post.summary as string | undefined) ?? name,
                description: (post.description as string | undefined) ?? '',
                tags: Array.isArray(post.tags) ? post.tags.map(String) : [],
                access: readAccess(post),
                mcp: readMcp(post),
                inputSchema: readJsonSchema(content),
                outputSchema: readJsonSchema(okContent),
            });

        }

    }

    routes.sort((a, b) => a.name.localeCompare(b.name));

    return {
        title: (info?.title as string | undefined) ?? 'API',
        version: (info?.version as string | undefined) ?? '0.0.0',
        routes,
    };

}
