import {deserializeResponse} from './serializer';

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
