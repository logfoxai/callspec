import type {RequestHandler, Router} from 'express';
import {notifyCall, type CallOutcome, type OnCall} from './callObservability';
import {
    CallspecUnauthorizedError,
    CallspecValidationError,
    formatRouteFailureBody,
    isRouteFailure,
} from './errors';
import {executeRoute} from './executeRoute';
import {resolveRouteContext} from './resolveRouteContext';
import {isMcpEnabled, listMcpTools, routeMcpName} from './mcpTools';
import type {Authenticate, RoutesMap} from './types';

export type InternalMountMcpOptions = {
    path?: string
    serverInfo: { name: string, version: string }
    instructions?: string
    /** Structured per-tool call events (MCP `tools/call`). */
    onCall?: OnCall
};

function toolError(message: string): { content: Array<{ type: 'text', text: string }>, isError: true } {

    return {
        content: [{type: 'text', text: message}],
        isError: true,
    };

}

export function mountMcp<Ctx>(
    router: Router,
    routes: RoutesMap<Ctx>,
    authenticate: Authenticate<Ctx> | undefined,
    options: InternalMountMcpOptions,
): void {

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

                respond({tools: listMcpTools(routes)});
                return;

            }

            if (body?.method === 'tools/call') {

                const startedAt = performance.now();
                const toolName = body.params?.name;
                const emit = (route: string, outcome: CallOutcome): void => {
                    notifyCall(options.onCall, {surface: 'mcp', route, startedAt, outcome});
                };

                if (!toolName) {

                    emit('(missing)', {ok: false, code: 'TOOL_NAME_MISSING'});
                    respond(toolError('Missing tool name'));
                    return;

                }

                const routeEntry = Object.entries(routes).find(
                    ([key, route]) => routeMcpName(key, route) === toolName,
                );

                if (!routeEntry) {

                    emit(toolName, {ok: false, code: 'TOOL_NOT_FOUND'});
                    respond(toolError(`Unknown tool: ${toolName}`));
                    return;

                }

                const [routeKey, route] = routeEntry;

                if (!isMcpEnabled(route)) {

                    emit(routeKey, {ok: false, code: 'TOOL_NOT_EXPOSED'});
                    respond(toolError(`Tool not exposed: ${toolName}`));
                    return;

                }

                try {

                    const ctx = await resolveRouteContext(route, authenticate, req);
                    const result = await executeRoute(route, body.params?.arguments ?? {}, ctx);

                    if (isRouteFailure(result)) {

                        emit(routeKey, {ok: false, code: result.code});
                        respond(toolError(JSON.stringify(formatRouteFailureBody(result))));
                        return;

                    }

                    emit(routeKey, {ok: true});
                    respond({
                        content: [{type: 'text', text: JSON.stringify(result, null, 2)}],
                        structuredContent: result,
                    });
                    return;

                } catch (err) {

                    if (isRouteFailure(err)) {

                        emit(routeKey, {ok: false, code: err.code});
                        respond(toolError(JSON.stringify(formatRouteFailureBody(err))));
                        return;

                    }

                    if (err instanceof CallspecUnauthorizedError) {

                        emit(routeKey, {ok: false, code: 'UNAUTHORIZED'});
                        respond(toolError('Unauthorized — Bearer token required'));
                        return;

                    }

                    if (err instanceof CallspecValidationError) {

                        emit(routeKey, {ok: false, code: 'VALIDATION_ERROR'});
                        respond(toolError(JSON.stringify(err.errors)));
                        return;

                    }

                    emit(routeKey, {ok: false, code: 'INTERNAL_ERROR'});
                    throw err;

                }

            }

            if (body?.method === 'notifications/initialized') {

                res.status(204).end();
                return;

            }

            respondError(400, `Unsupported method: ${body?.method ?? 'unknown'}`);

        } catch {

            // Match HTTP RPC: never leak Error.message to clients.
            respondError(500, 'Internal error');

        }

    }) as RequestHandler);

}
