import type {RouteAuth, RoutesMap} from './types';

export function hasBearerRoutes(routes: Record<string, {auth: RouteAuth}>): boolean {

    return Object.values(routes).some((route) => route.auth === 'bearer');

}

/** Routes included in callspec.json, OpenAPI, docs UI, MCP tools/list, and client codegen. */
export function exportedRoutes<Ctx>(routes: RoutesMap<Ctx>): RoutesMap<Ctx> {

    const out: RoutesMap<Ctx> = {};

    for (const [name, route] of Object.entries(routes)) {

        if (route.scope === 'public') {

            out[name] = route;

        }

    }

    return out;

}
