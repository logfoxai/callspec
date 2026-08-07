import type {Pred} from 'runtyp';
import {hasBearerRoutes} from './routeVisibility';
import type {Authenticate, Callspec, CallspecMeta, RoutesMap} from './types';

export function spec<
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

    if (hasBearerRoutes(routes) && !authenticate) {

        throw new Error('spec: bearer routes require authenticate');

    }

    return {meta, routes, exports, authenticate};

}

export type {Callspec};
