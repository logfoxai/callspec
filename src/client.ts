import {deserializeResponse} from './serializer';
import {COMMON_ERROR, type CommonErrorCode} from './commonErrors';
import type {
    CallspecFrameworkErrorBody,
    CallspecValidationErrorBody,
} from './frameworkErrors';
import {FRAMEWORK_ERROR} from './frameworkErrors';

export type {
    CallspecFrameworkErrorBody,
    CallspecInternalErrorBody,
    CallspecRouteNotFoundErrorBody,
    CallspecUnauthorizedErrorBody,
    CallspecValidationErrorBody,
} from './frameworkErrors';
export {FRAMEWORK_ERROR} from './frameworkErrors';
export {COMMON_ERROR, type CommonErrorCode} from './commonErrors';

export type CallspecOk<T> = {
    ok: true
    value: T
};

export type CallspecErr<E> = {
    ok: false
    status: number
    error: E
};

export type CallspecResult<T, E> = CallspecOk<T> | CallspecErr<E>;

export type CallspecTooManyRequestsBody = {
    error: typeof COMMON_ERROR.TOO_MANY_REQUESTS
    data: {title: string, message: string}
};

export type CallspecCommonErrorBody =
    | {error: typeof COMMON_ERROR.NOT_FOUND}
    | {error: typeof COMMON_ERROR.FORBIDDEN}
    | {error: typeof COMMON_ERROR.CONFLICT}
    | CallspecTooManyRequestsBody
    | {error: typeof COMMON_ERROR.SERVICE_UNAVAILABLE};

/** Fallback when the response body is not a known framework, common, or declared route error. */
export type CallspecUnexpectedErrorBody = {
    error: string
    data?: unknown
    errors?: Record<string, string>
};

export type CallspecClientErrors<E = never> =
    | CallspecFrameworkErrorBody
    | CallspecCommonErrorBody
    | ([E] extends [never] ? never : E)
    | CallspecUnexpectedErrorBody;

export type CallspecRouteResult<T, E = never> = CallspecResult<T, CallspecClientErrors<E>>;

export function isCallspecOk<T, E>(result: CallspecResult<T, E>): result is CallspecOk<T> {

    return result.ok;

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

function isCommonErrorCode(value: string): value is CommonErrorCode {

    return Object.prototype.hasOwnProperty.call(COMMON_ERROR, value)
        && (COMMON_ERROR as Record<string, string>)[value] === value;

}

function coerceTooManyRequestsBody(body: Record<string, unknown>): CallspecTooManyRequestsBody | undefined {

    if (body.error === COMMON_ERROR.TOO_MANY_REQUESTS) {

        if (typeof body.data === 'object' && body.data !== null) {

            const data = body.data as {title?: unknown, message?: unknown};

            if (typeof data.title === 'string' && typeof data.message === 'string') {

                return {
                    error: COMMON_ERROR.TOO_MANY_REQUESTS,
                    data: {title: data.title, message: data.message},
                };

            }

        }

    }

    if (typeof body.title === 'string' && typeof body.message === 'string') {

        return {
            error: COMMON_ERROR.TOO_MANY_REQUESTS,
            data: {title: body.title, message: body.message},
        };

    }

    if (typeof body.message === 'string') {

        return {
            error: COMMON_ERROR.TOO_MANY_REQUESTS,
            data: {title: 'Too many requests', message: body.message},
        };

    }

    return undefined;

}

function normalizeFrameworkBody(record: Record<string, unknown>): CallspecFrameworkErrorBody | undefined {

    if (record.error === FRAMEWORK_ERROR.VALIDATION_ERROR && typeof record.errors === 'object' && record.errors !== null) {

        return {
            error: FRAMEWORK_ERROR.VALIDATION_ERROR,
            errors: record.errors as Record<string, string>,
        } satisfies CallspecValidationErrorBody;

    }

    if (record.error === FRAMEWORK_ERROR.UNAUTHORIZED) {

        return {error: FRAMEWORK_ERROR.UNAUTHORIZED};

    }

    if (record.error === FRAMEWORK_ERROR.INTERNAL_ERROR) {

        return {error: FRAMEWORK_ERROR.INTERNAL_ERROR};

    }

    if (
        record.error === FRAMEWORK_ERROR.ROUTE_NOT_FOUND
        && typeof record.data === 'object'
        && record.data !== null
        && typeof (record.data as {route?: unknown}).route === 'string'
    ) {

        return {
            error: FRAMEWORK_ERROR.ROUTE_NOT_FOUND,
            data: {route: (record.data as {route: string}).route},
        };

    }

    return undefined;

}

function normalizeCommonBody(record: Record<string, unknown>): CallspecCommonErrorBody | undefined {

    if (typeof record.error !== 'string' || !isCommonErrorCode(record.error)) {

        return undefined;

    }

    if (record.error === COMMON_ERROR.TOO_MANY_REQUESTS) {

        return coerceTooManyRequestsBody(record);

    }

    if (record.error === COMMON_ERROR.NOT_FOUND) {

        return {error: COMMON_ERROR.NOT_FOUND};

    }

    if (record.error === COMMON_ERROR.FORBIDDEN) {

        return {error: COMMON_ERROR.FORBIDDEN};

    }

    if (record.error === COMMON_ERROR.CONFLICT) {

        return {error: COMMON_ERROR.CONFLICT};

    }

    if (record.error === COMMON_ERROR.SERVICE_UNAVAILABLE) {

        return {error: COMMON_ERROR.SERVICE_UNAVAILABLE};

    }

    return undefined;

}

function normalizeByStatus(status: number, body: unknown): CallspecClientErrors<never> | undefined {

    if (status === 401) {

        return {error: FRAMEWORK_ERROR.UNAUTHORIZED};

    }

    if (status === 403) {

        return {error: COMMON_ERROR.FORBIDDEN};

    }

    if (status === 404) {

        return {error: COMMON_ERROR.NOT_FOUND};

    }

    if (status === 409) {

        return {error: COMMON_ERROR.CONFLICT};

    }

    if (status === 429) {

        if (typeof body === 'object' && body !== null && !Array.isArray(body)) {

            const tooMany = coerceTooManyRequestsBody(body as Record<string, unknown>);

            if (tooMany) {

                return tooMany;

            }

        }

        return {
            error: COMMON_ERROR.TOO_MANY_REQUESTS,
            data: {title: 'Too many requests', message: 'Too many requests'},
        };

    }

    if (status === 503) {

        return {error: COMMON_ERROR.SERVICE_UNAVAILABLE};

    }

    if (status >= 500) {

        return {error: FRAMEWORK_ERROR.INTERNAL_ERROR};

    }

    return undefined;

}

export function normalizeClientErrorBody(
    status: number,
    body: unknown,
): CallspecClientErrors<never> {

    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {

        const record = body as Record<string, unknown>;
        const framework = normalizeFrameworkBody(record);

        if (framework) {

            return framework;

        }

        const common = normalizeCommonBody(record);

        if (common) {

            return common;

        }

        if (typeof record.error === 'string') {

            return {
                error: record.error,
                ...(record.data !== undefined ? {data: record.data} : {}),
                ...(typeof record.errors === 'object' && record.errors !== null
                    ? {errors: record.errors as Record<string, string>}
                    : {}),
            };

        }

    }

    if (body === 'Unauthorized') {

        return {error: FRAMEWORK_ERROR.UNAUTHORIZED};

    }

    if (typeof body === 'string' && body.length) {

        if (status === 403 && body === 'Forbidden') {

            return {error: COMMON_ERROR.FORBIDDEN};

        }

        if (status === 404 && body === 'Not Found') {

            return {error: COMMON_ERROR.NOT_FOUND};

        }

        if (status === 503 && body === 'Service Unavailable') {

            return {error: COMMON_ERROR.SERVICE_UNAVAILABLE};

        }

        return {error: body};

    }

    const byStatus = normalizeByStatus(status, body);

    if (byStatus) {

        return byStatus;

    }

    return body === undefined
        ? {error: 'HTTP_ERROR'}
        : {error: 'HTTP_ERROR', data: body};

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
            ok: false,
            status: resp.status,
            error: normalizeClientErrorBody(resp.status, body) as CallspecClientErrors<TError>,
        };

    }

}
