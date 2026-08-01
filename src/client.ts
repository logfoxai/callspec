import {deserializeResponse} from './serializer';
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

/** Fallback when the response body is not a known framework or declared route error. */
export type CallspecUnexpectedErrorBody = {
    error: string
    data?: unknown
    errors?: Record<string, string>
};

export type CallspecClientErrors<E = never> =
    | CallspecFrameworkErrorBody
    | CallspecUnexpectedErrorBody
    | ([E] extends [never] ? never : E);

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

function normalizeClientErrorBody(body: unknown): CallspecClientErrors<never> {

    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {

        const record = body as Record<string, unknown>;

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

        if (typeof record.error === 'string') {

            return body as CallspecUnexpectedErrorBody;

        }

    }

    if (body === 'Unauthorized') {

        return {error: FRAMEWORK_ERROR.UNAUTHORIZED};

    }

    if (typeof body === 'string' && body.length) {

        return {error: body};

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
            error: normalizeClientErrorBody(body) as CallspecClientErrors<TError>,
        };

    }

}
