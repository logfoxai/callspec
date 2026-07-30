import type {Authenticate, Callspec, CallspecMeta, RoutesMap} from './types';

export function defineSpec<
    Ctx = unknown,
    const T extends RoutesMap<Ctx> = RoutesMap<Ctx>,
>(input: {
    meta?: CallspecMeta
    routes: T
    authenticate?: Authenticate<Ctx>
}): Callspec<Ctx> & {routes: T} {

    const meta: CallspecMeta = input.meta ?? {};
    const {routes, authenticate} = input;

    for (const [name, route] of Object.entries(routes)) {

        if (route.handler.length !== 2) {

            throw new Error(
                `Spec route "${name}" handler must accept (input, ctx) — arity 2, got ${route.handler.length}`,
            );

        }

    }

    const hasPrivate = Object.values(routes).some((route) => route.access === 'private');

    if (hasPrivate && !authenticate) {

        throw new Error('defineSpec: private routes require authenticate');

    }

    return {meta, routes, authenticate};

}

export type {Callspec};
