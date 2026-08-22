import {CallspecUnauthorizedError, CallspecValidationError, isRouteFailure} from './errors';
import {isVoidSuccessPred} from './routeDefaults';
import {deserializeWithPred, serializeResponse} from './serializer';
import type {RouteDef} from './types';

export async function executeRoute<TInput, TOutput, Ctx>(
    route: RouteDef<TInput, TOutput, Ctx>,
    rawInput: unknown,
    ctx: Ctx | undefined,
): Promise<unknown> {

    if (route.auth === 'bearer' && (ctx === undefined || ctx === null)) {

        throw new CallspecUnauthorizedError();

    }

    const body = rawInput === undefined || rawInput === null ? {} : rawInput;
    const inputResult = route.input(deserializeWithPred(body, route.input));

    if (!inputResult.isValid) {

        throw new CallspecValidationError(inputResult.errors);

    }

    const result = await route.handler(inputResult.value, ctx as Ctx);

    if (isRouteFailure(result)) {

        return result;

    }

    const serialized = serializeResponse(result);

    if (isVoidSuccessPred(route.output) && serialized === undefined) {

        return null;

    }

    return serialized;

}
