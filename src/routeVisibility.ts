import type {RouteAuth, RoutesMap} from './types';

/** Which routes leave this mount on docs/specs/MCP. Default public. */
export type ExportVisibility = 'public' | 'all';

export function hasBearerRoutes(routes: Record<string, {auth: RouteAuth}>): boolean {

    return Object.values(routes).some((route) => route.auth === 'bearer');

}

/** Routes included in callspec.json, OpenAPI, docs UI, MCP tools/list, and client codegen. */
export function exportedRoutes<Ctx>(
    routes: RoutesMap<Ctx>,
    visibility: ExportVisibility = 'public',
): RoutesMap<Ctx> {

    const out: RoutesMap<Ctx> = {};

    for (const [name, route] of Object.entries(routes)) {

        if (visibility === 'all' || route.scope === 'public') {

            out[name] = route;

        }

    }

    return out;

}
