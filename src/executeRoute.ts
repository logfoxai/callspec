import {CallspecUnauthorizedError, CallspecValidationError, isRouteFailure} from './errors';
import {serializeResponse} from './serializer';
import type {RouteDef} from './types';

export async function executeRoute<TInput, TOutput, Ctx>(
    route: RouteDef<TInput, TOutput, Ctx>,
    rawInput: unknown,
    ctx: Ctx | undefined,
): Promise<unknown> {

    if (route.auth === 'bearer' && (ctx === undefined || ctx === null)) {

        throw new CallspecUnauthorizedError();

    }

    const inputResult = route.input(rawInput);

    if (!inputResult.isValid) {

        throw new CallspecValidationError(inputResult.errors);

    }

    const result = await route.handler(inputResult.value, ctx as Ctx);

    if (isRouteFailure(result)) {

        return result;

    }

    return serializeResponse(result);

}
