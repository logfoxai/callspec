import type {RequestHandler, Router} from 'express';
import {CallspecUnauthorizedError, CallspecValidationError, CallspecNotFoundError} from './errors';
import {executeRoute} from './executeRoute';
import {isMcpEnabled, listMcpTools, routeMcpName} from './mcpTools';
import type {ContextResolver, Spec} from './types';

export type MountMcpOptions<Ctx> = {
    path?: string
    contextResolver?: ContextResolver<Ctx>
    expose?: boolean
    serverInfo: { name: string, version: string }
    instructions?: string
};

function toolError(message: string): { content: Array<{ type: 'text', text: string }>, isError: true } {

    return {
        content: [{type: 'text', text: message}],
        isError: true,
    };

}

export function mountMcp<Ctx>(
    router: Router,
    spec: Spec<Ctx>,
    options: MountMcpOptions<Ctx>,
): void {

    if (options.expose === false) return;

    const mcpPath = options.path ?? '/mcp';

    router.all(mcpPath, (async (req, res) => {

        const body = req.body as {
            method?: string
            params?: { name?: string, arguments?: unknown }
            id?: unknown
        };

        const respond = (result: unknown): void => {

            res.json({
                jsonrpc: '2.0',
                id: body?.id ?? null,
                result,
            });

        };

        const respondError = (code: number, message: string): void => {

            res.status(code >= 400 ? code : 500).json({
                jsonrpc: '2.0',
                id: body?.id ?? null,
                error: {code, message},
            });

        };

        try {

            if (body?.method === 'initialize') {

                respond({
                    protocolVersion: '2024-11-05',
                    capabilities: {tools: {}},
                    serverInfo: options.serverInfo,
                    instructions: options.instructions,
                });
                return;

            }

            if (body?.method === 'tools/list') {

                respond({tools: listMcpTools(spec)});
                return;

            }

            if (body?.method === 'tools/call') {

                const toolName = body.params?.name;

                if (!toolName) {

                    respond(toolError('Missing tool name'));
                    return;

                }

                const routeEntry = Object.entries(spec).find(
                    ([key, route]) => routeMcpName(key, route) === toolName,
                );

                if (!routeEntry) {

                    respond(toolError(`Unknown tool: ${toolName}`));
                    return;

                }

                const [, route] = routeEntry;

                if (!isMcpEnabled(route)) {

                    respond(toolError(`Tool not exposed: ${toolName}`));
                    return;

                }

                const ctx = options.contextResolver
                    ? await options.contextResolver(req)
                    : undefined;

                try {

                    const result = await executeRoute(route, body.params?.arguments ?? {}, ctx);

                    respond({
                        content: [{type: 'text', text: JSON.stringify(result, null, 2)}],
                        structuredContent: result,
                    });
                    return;

                } catch (err) {

                    if (err instanceof CallspecUnauthorizedError) {

                        respond(toolError('Unauthorized — Bearer token required'));
                        return;

                    }

                    if (err instanceof CallspecValidationError) {

                        respond(toolError(JSON.stringify(err.errors)));
                        return;

                    }

                    throw err;

                }

            }

            if (body?.method === 'notifications/initialized') {

                res.status(204).end();
                return;

            }

            respondError(400, `Unsupported method: ${body?.method ?? 'unknown'}`);

        } catch (err) {

            if (err instanceof CallspecNotFoundError) {

                respondError(404, err.message);
                return;

            }

            respondError(500, err instanceof Error ? err.message : 'Internal error');

        }

    }) as RequestHandler);

}
