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

export class CallspecHttpError<T = unknown> extends Error {

    readonly status: number;

    readonly body: T;

    readonly response: Response;

    constructor(status: number, body: T, response: Response) {

        const detail = typeof body === 'object' && body !== null && 'error' in body
            ? `: ${String((body as {error: unknown}).error)}`
            : '';

        super(`HTTP ${status}${detail}`);
        this.name = 'CallspecHttpError';
        this.status = status;
        this.body = body;
        this.response = response;

    }

}

/** @deprecated Use {@link CallspecHttpError}. The `response` property held the parsed body, not the HTTP response. */
export class Non200Response<T = unknown> extends Error {

    status: number;

    /** Parsed response body. */
    response: T;

    constructor(status: number, response: T) {

        super('Non200Response');
        this.name = 'Non200Response';
        this.status = status;
        this.response = response;

    }

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

    async call<TOutput>(routeName: string, input: unknown): Promise<TOutput> {

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

        if (!resp.ok) {

            throw new CallspecHttpError(resp.status, body, resp);

        }

        return body as TOutput;

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

export type ClientOptions = {
    endpoint: string
    fetchOptions?: Omit<RequestInit, 'method' | 'body'>
    /**
     * Invoked only when the request fails before an HTTP response is received
     * (network errors, DNS failures, etc.). HTTP error responses throw
     * {@link CallspecHttpError} and do not invoke this callback.
     *
     * @deprecated Prefer try/catch around {@link client} or {@link CallspecClient.call}.
     */
    onError?: (error: unknown) => void
    /** Network errors only — alias for {@link ClientOptions.onError}. */
    onNetworkError?: (error: unknown) => void
    fetch?: typeof globalThis.fetch
};

export async function client<A extends {
    name: string
    input: unknown
    output: unknown
}>(
    name: A['name'],
    input: A['input'],
    options?: ClientOptions,
): Promise<A['output']> {

    const runtime = new CallspecClient({
        baseUrl: options?.endpoint ?? '',
        fetch: options?.fetch,
        fetchOptions: options?.fetchOptions,
        headers: options?.fetchOptions?.headers,
    });

    try {

        return await runtime.call<A['output']>(name, input);

    } catch (err) {

        if (!(err instanceof CallspecHttpError)) {

            const hook = options?.onNetworkError ?? options?.onError;

            hook?.(err);

        }

        if (err instanceof CallspecHttpError) {

            throw new Non200Response(err.status, err.body);

        }

        throw err;

    }

}
