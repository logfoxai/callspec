import type {RouteDef, RoutesMap} from './types';
import {exportedRoutes, type ExportVisibility} from './routeVisibility';
import {predToJsonSchema} from './routeDefaults';

export function isMcpEnabled(route: RouteDef<any, any, any>): boolean {

    return route.mcp !== undefined;

}

export function routeMcpName(routeKey: string, route: RouteDef<any, any, any>): string {

    if (route.mcp && typeof route.mcp === 'object' && route.mcp.name) {

        return route.mcp.name;

    }

    return routeKey;

}

function mcpAnnotations(route: RouteDef<any, any, any>): Record<string, unknown> | undefined {

    if (route.mcp && typeof route.mcp === 'object') {

        return route.mcp.annotations;

    }

    return undefined;

}

export type McpToolListEntry = {
    name: string
    title?: string
    description?: string
    inputSchema: Record<string, unknown>
    outputSchema?: Record<string, unknown>
    annotations?: Record<string, unknown>
};

export function listMcpTools(
    routes: RoutesMap<any>,
    visibility: ExportVisibility = 'public',
): McpToolListEntry[] {

    return Object.entries(exportedRoutes(routes, visibility))
        .filter(([, route]) => isMcpEnabled(route))
        .map(([key, route]) => {

            const entry: McpToolListEntry = {
                name: routeMcpName(key, route),
                title: route.meta.summary,
                inputSchema: predToJsonSchema(route.input),
            };

            if (route.meta.description) {

                entry.description = route.meta.description;

            }

            if (route.output) {

                entry.outputSchema = predToJsonSchema(route.output);

            }

            const annotations = mcpAnnotations(route);

            if (annotations) entry.annotations = annotations;

            return entry;

        });

}
