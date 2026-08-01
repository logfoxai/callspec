import type {Pred} from 'runtyp';
import {hasPrivateRoutes} from './metaDefaults';
import type {Authenticate, Callspec, CallspecMeta, RoutesMap} from './types';

export function defineSpec<
    Ctx = unknown,
    const T extends RoutesMap<Ctx> = RoutesMap<Ctx>,
>(input: {
    meta?: CallspecMeta
    routes: T
    exports?: Record<string, Pred<any>>
    authenticate?: Authenticate<Ctx>
}): Callspec<Ctx> & {routes: T} {

    const meta: CallspecMeta = input.meta ?? {};
    const {routes, exports, authenticate} = input;

    if (hasPrivateRoutes(routes) && !authenticate) {

        throw new Error('defineSpec: private routes require authenticate');

    }

    return {meta, routes, exports, authenticate};

}

export type {Callspec};
