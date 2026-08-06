import {toJsonSchema} from 'runtyp';
import type {RouteDef, RoutesMap} from './types';
import {exportedRoutes} from './routeVisibility';

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

export function listMcpTools(routes: RoutesMap<any>): McpToolListEntry[] {

    return Object.entries(exportedRoutes(routes))
        .filter(([, route]) => isMcpEnabled(route))
        .map(([key, route]) => {

            const entry: McpToolListEntry = {
                name: routeMcpName(key, route),
                title: route.meta.summary,
                inputSchema: toJsonSchema(route.input) as Record<string, unknown>,
            };

            if (route.meta.description) {

                entry.description = route.meta.description;

            }

            if (route.output) {

                entry.outputSchema = toJsonSchema(route.output) as Record<string, unknown>;

            }

            const annotations = mcpAnnotations(route);

            if (annotations) entry.annotations = annotations;

            return entry;

        });

}
