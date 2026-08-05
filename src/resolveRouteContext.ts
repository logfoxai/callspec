import type {Request} from 'express';
import {CallspecUnauthorizedError} from './errors';
import {extractBearerToken} from './extractBearerToken';
import type {Authenticate, RouteDef} from './types';

export async function resolveRouteContext<Ctx>(
    route: RouteDef<any, any, Ctx>,
    authenticate: Authenticate<Ctx> | undefined,
    req: Request,
): Promise<Ctx | undefined> {

    const token = extractBearerToken(req);

    if (route.auth === 'bearer') {

        if (!token) {

            throw new CallspecUnauthorizedError();

        }

        if (!authenticate) {

            throw new CallspecUnauthorizedError();

        }

        const ctx = await authenticate(token, req);

        if (ctx === undefined || ctx === null) {

            throw new CallspecUnauthorizedError();

        }

        return ctx;

    }

    if (token && authenticate) {

        return await authenticate(token, req);

    }

    return undefined;

}
