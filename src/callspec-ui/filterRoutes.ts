import type {RouteAuth} from '../types';

export type RouteFilterable = {
    name: string
    summary: string
    description: string
    tags: string[]
    auth: RouteAuth
    mcp: boolean
};

export type AuthFilter = 'all' | RouteAuth;

export type RouteFilters = {
    text: string
    auth: AuthFilter
    tag: string | null
    mcpOnly: boolean
};

export type TagNeighbors = {
    tag: string | null
    prev: string | null
    next: string | null
};

function routeTags(route: RouteFilterable): string[] {

    return route.tags.length ? route.tags : ['routes'];

}

function matchesText(route: RouteFilterable, needle: string): boolean {

    if (!needle) return true;

    return route.name.toLowerCase().includes(needle)
        || route.summary.toLowerCase().includes(needle)
        || route.description.toLowerCase().includes(needle)
        || route.tags.some((tag) => tag.toLowerCase().includes(needle));

}

export function applyRouteFilters<T extends RouteFilterable>(
    routes: readonly T[],
    filters: RouteFilters,
): T[] {

    const needle = filters.text.trim().toLowerCase();

    return routes.filter((route) => {

        if (filters.auth !== 'all' && route.auth !== filters.auth) {

            return false;

        }

        if (filters.mcpOnly && !route.mcp) {

            return false;

        }

        if (filters.tag && !route.tags.includes(filters.tag)) {

            return false;

        }

        return matchesText(route, needle);

    });

}

export function groupRoutesByTag<T extends RouteFilterable>(
    routes: readonly T[],
): Map<string, T[]> {

    const groups = new Map<string, T[]>();

    for (const route of routes) {

        for (const tag of routeTags(route)) {

            const list = groups.get(tag) ?? [];
            list.push(route);
            groups.set(tag, list);

        }

    }

    for (const list of groups.values()) {

        list.sort((a, b) => a.name.localeCompare(b.name));

    }

    return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));

}

/** Prev/next route names within the primary tag (first tag), alphabetical. */
export function neighborsInTagGroup<T extends RouteFilterable>(
    routes: readonly T[],
    routeName: string,
): TagNeighbors {

    const route = routes.find((item) => item.name === routeName);

    if (!route) {

        return {tag: null, prev: null, next: null};

    }

    const tag = routeTags(route)[0] ?? 'routes';
    const group = groupRoutesByTag(routes).get(tag) ?? [];
    const index = group.findIndex((item) => item.name === routeName);

    if (index < 0) {

        return {tag, prev: null, next: null};

    }

    return {
        tag,
        prev: group[index - 1]?.name ?? null,
        next: group[index + 1]?.name ?? null,
    };

}
