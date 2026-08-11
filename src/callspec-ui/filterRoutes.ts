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

export type RouteNeighbors = {
    prev: string | null
    next: string | null
};

/** @deprecated Use {@link routeNeighbors}. Kept for older call sites/tests. */
export type TagNeighbors = RouteNeighbors & {
    tag: string | null
};

function orderedRoutesForNavigation<T extends RouteFilterable>(routes: readonly T[]): T[] {

    const seen = new Set<string>();
    const ordered: T[] = [];

    for (const list of groupRoutesByTag(routes).values()) {

        for (const route of list) {

            if (seen.has(route.name)) continue;

            seen.add(route.name);
            ordered.push(route);

        }

    }

    return ordered;

}

/** Prev/next route names in sidebar order — tag groups alphabetically, routes deduped. */
export function routeNeighbors<T extends RouteFilterable>(
    routes: readonly T[],
    routeName: string,
): RouteNeighbors {

    const ordered = orderedRoutesForNavigation(routes);
    const index = ordered.findIndex((item) => item.name === routeName);

    if (index < 0) {

        return {prev: null, next: null};

    }

    return {
        prev: ordered[index - 1]?.name ?? null,
        next: ordered[index + 1]?.name ?? null,
    };

}

/** Prev/next within the primary tag only — prefer {@link routeNeighbors} for footer nav. */
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
