import {BUILTIN_ERROR, type OptionalBuiltinContext} from './builtinErrors';

export type CallspecOk<T> = {
    ok: true
    value: T
};

type CallspecValidationClientError = {
    code: typeof BUILTIN_ERROR.VALIDATION_ERROR
    data: Record<string, string>
};

export type CallspecTooManyRequestsClientError = {
    code: typeof BUILTIN_ERROR.TOO_MANY_REQUESTS
    data: {title: string, message: string}
};

type CallspecRouteNotFoundClientError = {
    code: typeof BUILTIN_ERROR.ROUTE_NOT_FOUND
    data: {route: string}
};

export type CallspecBuiltinClientError =
    | CallspecValidationClientError
    | {code: typeof BUILTIN_ERROR.UNAUTHORIZED}
    | {code: typeof BUILTIN_ERROR.INTERNAL_ERROR}
    | CallspecRouteNotFoundClientError
    | {code: typeof BUILTIN_ERROR.NOT_FOUND, data?: OptionalBuiltinContext}
    | {code: typeof BUILTIN_ERROR.FORBIDDEN, data?: OptionalBuiltinContext}
    | {code: typeof BUILTIN_ERROR.CONFLICT, data?: OptionalBuiltinContext}
    | CallspecTooManyRequestsClientError
    | {code: typeof BUILTIN_ERROR.SERVICE_UNAVAILABLE, data?: OptionalBuiltinContext};

/** Client-only — response outside the route contract (proxy, foreign middleware, undeclared wire code). */
export type CallspecUnknownClientError = {
    code: 'UNKNOWN_ERROR'
    data: {
        body: unknown
        headers?: Record<string, string>
    }
};

/** Contract failure codes for a route — builtins, declared domain errors, and client-only unknown. */
export type CallspecClientErrors<E = never> =
    | CallspecBuiltinClientError
    | ([E] extends [never] ? never : E)
    | CallspecUnknownClientError;

/** Failure branch — `code` is top-level, same as `value` on success. */
export type CallspecFailure<E = never> = {
    ok: false
    status: number
} & CallspecClientErrors<E>;

export type CallspecResult<T, E = never> = CallspecOk<T> | CallspecFailure<E>;

export type CallspecRouteResult<T, E = never> = CallspecResult<T, E>;

export type CallResultOptions = {
    /** Domain error codes from callspec.json for this route. Builtins are always allowed. */
    allowedErrorCodes?: readonly string[]
};
