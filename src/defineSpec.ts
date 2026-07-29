import type {Spec, RouteDef} from './types';

export function defineSpec<const T extends Record<string, RouteDef<any, any, any>>>(
    routes: T,
): T {

    for (const [name, route] of Object.entries(routes)) {

        if (route.handler.length !== 2) {

            throw new Error(
                `Spec route "${name}" handler must accept (input, ctx) — arity 2, got ${route.handler.length}`,
            );

        }

    }

    return routes;

}

export type {Spec};
