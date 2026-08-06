import {
    BUILTIN_ERROR,
    type BuiltinErrorCode,
    isThrowableBuiltinCode,
} from '../builtinErrors';
import type {CallspecBuiltinClientError} from '../clientTypes';
import {parseTooManyRequestsFromWire} from './tooManyRequests';
import type {WireRecord} from './types';

function builtinClientError<C extends BuiltinErrorCode>(
    code: C,
    data?: unknown,
): Extract<CallspecBuiltinClientError, {code: C}> {

    return (data !== undefined ? {code, data} : {code}) as Extract<CallspecBuiltinClientError, {code: C}>;

}

/** Parse `{ error: "BUILTIN", data? }` when the code is a known builtin wire shape. */
export function parseBuiltinFromWire(wire: WireRecord): CallspecBuiltinClientError | undefined {

    if (
        wire.error === BUILTIN_ERROR.VALIDATION_ERROR
        && typeof wire.errors === 'object'
        && wire.errors !== null
    ) {

        return {
            code: BUILTIN_ERROR.VALIDATION_ERROR,
            data: wire.errors as Record<string, string>,
        };

    }

    if (wire.error === BUILTIN_ERROR.UNAUTHORIZED) {

        return {code: BUILTIN_ERROR.UNAUTHORIZED};

    }

    if (wire.error === BUILTIN_ERROR.INTERNAL_ERROR) {

        return {code: BUILTIN_ERROR.INTERNAL_ERROR};

    }

    if (
        wire.error === BUILTIN_ERROR.ROUTE_NOT_FOUND
        && typeof wire.data === 'object'
        && wire.data !== null
        && typeof (wire.data as {route?: unknown}).route === 'string'
    ) {

        return {
            code: BUILTIN_ERROR.ROUTE_NOT_FOUND,
            data: {route: (wire.data as {route: string}).route},
        };

    }

    if (typeof wire.error !== 'string' || !isThrowableBuiltinCode(wire.error)) {

        return undefined;

    }

    if (wire.error === BUILTIN_ERROR.TOO_MANY_REQUESTS) {

        return parseTooManyRequestsFromWire(wire);

    }

    if (wire.error === BUILTIN_ERROR.NOT_FOUND) {

        return builtinClientError(BUILTIN_ERROR.NOT_FOUND, wire.data);

    }

    if (wire.error === BUILTIN_ERROR.FORBIDDEN) {

        return builtinClientError(BUILTIN_ERROR.FORBIDDEN, wire.data);

    }

    if (wire.error === BUILTIN_ERROR.CONFLICT) {

        return builtinClientError(BUILTIN_ERROR.CONFLICT, wire.data);

    }

    if (wire.error === BUILTIN_ERROR.SERVICE_UNAVAILABLE) {

        return builtinClientError(BUILTIN_ERROR.SERVICE_UNAVAILABLE, wire.data);

    }

    return undefined;

}
