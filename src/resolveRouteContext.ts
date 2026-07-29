import type {Request} from 'express';
import {CallspecUnauthorizedError} from './errors';
import {extractBearerToken} from './extractBearerToken';
import type {CallspecMeta, RouteDef} from './types';

export async function resolveRouteContext<Ctx>(
    route: RouteDef<any, any, Ctx>,
    meta: CallspecMeta<Ctx>,
    req: Request,
): Promise<Ctx | undefined> {

    const token = extractBearerToken(req);

    if (route.access === 'private') {

        if (!token) {

            throw new CallspecUnauthorizedError();

        }

        if (!meta.authenticate) {

            throw new CallspecUnauthorizedError();

        }

        const ctx = await meta.authenticate(token, req);

        if (ctx === undefined || ctx === null) {

            throw new CallspecUnauthorizedError();

        }

        return ctx;

    }

    if (token && meta.authenticate) {

        return await meta.authenticate(token, req);

    }

    return undefined;

}
