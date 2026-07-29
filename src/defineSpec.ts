import type {Callspec, CallspecMeta, RoutesMap} from './types';

export function defineSpec<
    Ctx = unknown,
    const T extends RoutesMap<Ctx> = RoutesMap<Ctx>,
>(input: {
    meta?: CallspecMeta<Ctx>
    routes: T
}): Callspec<Ctx> & {routes: T} {

    const meta: CallspecMeta<Ctx> = input.meta ?? {};
    const {routes} = input;

    for (const [name, route] of Object.entries(routes)) {

        if (route.handler.length !== 2) {

            throw new Error(
                `Spec route "${name}" handler must accept (input, ctx) — arity 2, got ${route.handler.length}`,
            );

        }

    }

    const hasPrivate = Object.values(routes).some((route) => route.access === 'private');

    if (hasPrivate && !meta.authenticate) {

        throw new Error('defineSpec: private routes require meta.authenticate');

    }

    return {meta, routes};

}

export type {Callspec};
