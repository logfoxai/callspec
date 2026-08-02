import {deserializeResponse} from './serializer';
import {
    BUILTIN_ERROR,
    type BuiltinErrorCode,
    type OptionalBuiltinContext,
    isThrowableBuiltinCode,
} from './builtinErrors';

export type {
    BuiltinErrorCode,
    OptionalBuiltinContext,
    ThrowableBuiltinCode,
} from './builtinErrors';
export {BUILTIN_ERROR} from './builtinErrors';

export type CallspecOk<T> = {
    ok: true
    value: T
};

/** Failure branch — `code` is top-level, same as `value` on success. */
export type CallspecFailure<E = never> = {
    ok: false
    status: number
} & CallspecClientErrors<E>;

export type CallspecResult<T, E = never> = CallspecOk<T> | CallspecFailure<E>;

/** Fallback client error when the body is not a known builtin or declared route error. */
export type CallspecClientError = {
    code: string
    data?: unknown
};

export type CallspecValidationClientError = {
    code: typeof BUILTIN_ERROR.VALIDATION_ERROR
    data: Record<string, string>
};

export type CallspecTooManyRequestsClientError = {
    code: typeof BUILTIN_ERROR.TOO_MANY_REQUESTS
    data: {title: string, message: string}
};

export type CallspecRouteNotFoundClientError = {
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

export type CallspecClientErrors<E = never> =
    | CallspecBuiltinClientError
    | ([E] extends [never] ? never : E)
    | CallspecClientError;

export type CallspecRouteResult<T, E = never> = CallspecResult<T, E>;

export function isCallspecOk<T, E>(result: CallspecResult<T, E>): result is CallspecOk<T> {

    return result.ok;

}

export function isCallspecFailure<T, E>(result: CallspecResult<T, E>): result is CallspecFailure<E> {

    return !result.ok;

}

export function callspecClientErrorCode(error: unknown): string | undefined {

    if (typeof error !== 'object' || error === null) return undefined;

    const code = (error as {code?: unknown}).code;

    return typeof code === 'string' ? code : undefined;

}

export function joinCallspecUrl(baseUrl: string, routeSegment: string): string {

    const base = baseUrl.replace(/\/+$/, '');
    const segment = routeSegment.replace(/^\/+/, '');

    if (!base) {

        return `/${segment}`.replace(/\/{2,}/g, '/');

    }

    return `${base}/${segment}`.replace(/([^:]\/)\/+/g, '$1');

}

export type CallspecClientConfig = {
    baseUrl: string
    headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>)
    fetch?: typeof globalThis.fetch
    fetchOptions?: Omit<RequestInit, 'method' | 'body' | 'headers'>
};

async function resolveHeaders(
    headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>),
): Promise<Headers> {

    const resolved = typeof headers === 'function' ? await headers() : headers;
    const merged = new Headers({'Content-Type': 'application/json'});

    if (resolved) {

        new Headers(resolved).forEach((value, key) => merged.set(key, value));

    }

    return merged;

}

async function parseResponseBody(resp: Response): Promise<unknown> {

    const data = await resp.text();

    if (!data.trim().length) return undefined;

    try {

        return deserializeResponse(JSON.parse(data));

    } catch {

        return data;

    }

}

function wireCode(code: string, data?: unknown): CallspecClientError {

    return data !== undefined ? {code, data} : {code};

}

function builtinClientError<C extends BuiltinErrorCode>(
    code: C,
    data?: unknown,
): Extract<CallspecBuiltinClientError, {code: C}> {

    return (data !== undefined ? {code, data} : {code}) as Extract<CallspecBuiltinClientError, {code: C}>;

}

function coerceTooManyRequestsBody(body: Record<string, unknown>): CallspecTooManyRequestsClientError | undefined {

    if (body.error === BUILTIN_ERROR.TOO_MANY_REQUESTS) {

        if (typeof body.data === 'object' && body.data !== null) {

            const data = body.data as {title?: unknown, message?: unknown};

            if (typeof data.title === 'string' && typeof data.message === 'string') {

                return {
                    code: BUILTIN_ERROR.TOO_MANY_REQUESTS,
                    data: {title: data.title, message: data.message},
                };

            }

        }

    }

    if (typeof body.title === 'string' && typeof body.message === 'string') {

        return {
            code: BUILTIN_ERROR.TOO_MANY_REQUESTS,
            data: {title: body.title, message: body.message},
        };

    }

    if (typeof body.message === 'string') {

        return {
            code: BUILTIN_ERROR.TOO_MANY_REQUESTS,
            data: {title: 'Too many requests', message: body.message},
        };

    }

    return undefined;

}

function normalizeBuiltinBody(record: Record<string, unknown>): CallspecBuiltinClientError | undefined {

    if (record.error === BUILTIN_ERROR.VALIDATION_ERROR && typeof record.errors === 'object' && record.errors !== null) {

        return {
            code: BUILTIN_ERROR.VALIDATION_ERROR,
            data: record.errors as Record<string, string>,
        };

    }

    if (record.error === BUILTIN_ERROR.UNAUTHORIZED) {

        return {code: BUILTIN_ERROR.UNAUTHORIZED};

    }

    if (record.error === BUILTIN_ERROR.INTERNAL_ERROR) {

        return {code: BUILTIN_ERROR.INTERNAL_ERROR};

    }

    if (
        record.error === BUILTIN_ERROR.ROUTE_NOT_FOUND
        && typeof record.data === 'object'
        && record.data !== null
        && typeof (record.data as {route?: unknown}).route === 'string'
    ) {

        return {
            code: BUILTIN_ERROR.ROUTE_NOT_FOUND,
            data: {route: (record.data as {route: string}).route},
        };

    }

    if (typeof record.error !== 'string' || !isThrowableBuiltinCode(record.error)) {

        return undefined;

    }

    if (record.error === BUILTIN_ERROR.TOO_MANY_REQUESTS) {

        return coerceTooManyRequestsBody(record);

    }

    if (record.error === BUILTIN_ERROR.NOT_FOUND) {

        return builtinClientError(BUILTIN_ERROR.NOT_FOUND, record.data);

    }

    if (record.error === BUILTIN_ERROR.FORBIDDEN) {

        return builtinClientError(BUILTIN_ERROR.FORBIDDEN, record.data);

    }

    if (record.error === BUILTIN_ERROR.CONFLICT) {

        return builtinClientError(BUILTIN_ERROR.CONFLICT, record.data);

    }

    if (record.error === BUILTIN_ERROR.SERVICE_UNAVAILABLE) {

        return builtinClientError(BUILTIN_ERROR.SERVICE_UNAVAILABLE, record.data);

    }

    return undefined;

}

/** Best-effort mapping for non-callspec Express middleware — prefer `error` in the JSON body. */
function normalizeByStatus(status: number, body: unknown): CallspecClientError | undefined {

    if (status === 401) {

        return {code: BUILTIN_ERROR.UNAUTHORIZED};

    }

    if (status === 403) {

        return {code: BUILTIN_ERROR.FORBIDDEN};

    }

    if (status === 404) {

        return {code: BUILTIN_ERROR.NOT_FOUND};

    }

    if (status === 409) {

        return {code: BUILTIN_ERROR.CONFLICT};

    }

    if (status === 429) {

        if (typeof body === 'object' && body !== null && !Array.isArray(body)) {

            const tooMany = coerceTooManyRequestsBody(body as Record<string, unknown>);

            if (tooMany) {

                return tooMany;

            }

        }

        return {
            code: BUILTIN_ERROR.TOO_MANY_REQUESTS,
            data: {title: 'Too many requests', message: 'Too many requests'},
        };

    }

    if (status === 503) {

        return {code: BUILTIN_ERROR.SERVICE_UNAVAILABLE};

    }

    if (status >= 500) {

        return {code: BUILTIN_ERROR.INTERNAL_ERROR};

    }

    return undefined;

}

export function normalizeClientErrorBody(
    status: number,
    body: unknown,
): CallspecClientErrors<never> {

    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {

        const record = body as Record<string, unknown>;
        const builtin = normalizeBuiltinBody(record);

        if (builtin) {

            return builtin;

        }

        if (typeof record.error === 'string') {

            if (
                record.error === BUILTIN_ERROR.VALIDATION_ERROR
                && typeof record.errors === 'object'
                && record.errors !== null
            ) {

                return wireCode(record.error, record.errors as Record<string, string>);

            }

            return wireCode(
                record.error,
                record.data !== undefined ? record.data : undefined,
            );

        }

    }

    if (body === 'Unauthorized') {

        return {code: BUILTIN_ERROR.UNAUTHORIZED};

    }

    if (typeof body === 'string' && body.length) {

        if (status === 403 && body === 'Forbidden') {

            return {code: BUILTIN_ERROR.FORBIDDEN};

        }

        if (status === 404 && body === 'Not Found') {

            return {code: BUILTIN_ERROR.NOT_FOUND};

        }

        if (status === 503 && body === 'Service Unavailable') {

            return {code: BUILTIN_ERROR.SERVICE_UNAVAILABLE};

        }

        return {code: body};

    }

    const byStatus = normalizeByStatus(status, body);

    if (byStatus) {

        return byStatus;

    }

    return body === undefined
        ? {code: 'HTTP_ERROR'}
        : {code: 'HTTP_ERROR', data: body};

}

export class CallspecClient {

    private readonly fetchImpl: typeof globalThis.fetch;

    constructor(private readonly config: CallspecClientConfig) {

        this.fetchImpl = config.fetch ?? globalThis.fetch.bind(globalThis);

    }

    async callResult<TOutput, TError = never>(
        routeName: string,
        input: unknown,
    ): Promise<CallspecRouteResult<TOutput, TError>> {

        const url = joinCallspecUrl(this.config.baseUrl, routeName);
        const headers = await resolveHeaders(this.config.headers);
        const {fetchOptions} = this.config;

        const resp = await this.fetchImpl(url, {
            ...fetchOptions,
            method: 'POST',
            headers,
            body: JSON.stringify(input ?? {}),
        });

        const body = await parseResponseBody(resp);

        if (resp.ok) {

            return {ok: true, value: body as TOutput};

        }

        return {
            ok: false as const,
            status: resp.status,
            ...normalizeClientErrorBody(resp.status, body),
        };

    }

}
