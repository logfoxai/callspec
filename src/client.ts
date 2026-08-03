import {deserializeResponse} from './serializer';

export type {
    BuiltinErrorCode,
    OptionalBuiltinContext,
    ThrowableBuiltinCode,
} from './builtinErrors';
export {BUILTIN_ERROR} from './builtinErrors';

export type {
    CallspecOk,
    CallspecFailure,
    CallspecResult,
    CallspecRouteResult,
    CallspecClientErrors,
    CallspecBuiltinClientError,
    CallspecUnknownClientError,
    CallResultOptions,
} from './clientTypes';

export {
    CLIENT_ERROR,
    normalizeClientErrorBody,
    resolveRouteClientError,
} from './clientErrorNormalization';
export type {ResolveRouteClientErrorInput} from './clientErrorNormalization';

import type {
    CallspecOk,
    CallspecResult,
    CallspecRouteResult,
    CallResultOptions,
} from './clientTypes';
import {resolveRouteClientError} from './clientErrorNormalization';

export function isCallspecOk<T, E>(result: CallspecResult<T, E>): result is CallspecOk<T> {

    return result.ok;

}

export function isCallspecFailure<T, E>(result: CallspecResult<T, E>): result is Extract<CallspecResult<T, E>, {ok: false}> {

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

export class CallspecClient {

    private readonly fetchImpl: typeof globalThis.fetch;

    constructor(private readonly config: CallspecClientConfig) {

        this.fetchImpl = config.fetch ?? globalThis.fetch.bind(globalThis);

    }

    async callResult<TOutput, TError = never>(
        routeName: string,
        input: unknown,
        options?: CallResultOptions,
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

        const resolved = resolveRouteClientError<TError>({
            status: resp.status,
            body,
            allowedErrorCodes: options?.allowedErrorCodes,
            responseHeaders: resp.headers,
        });

        return {
            ok: false as const,
            status: resp.status,
            ...resolved,
        };

    }

}
