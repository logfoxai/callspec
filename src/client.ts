import {deserializeWithPred} from './serializer';

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
    CallspecNetworkClientError,
    CallResultOptions,
    DomainErrorContract,
} from './clientTypes';

export {
    CLIENT_ERROR,
    normalizeClientErrorBody,
    resolveRouteClientError,
} from './clientErrorNormalization';
export type {ResolveRouteClientErrorInput} from './clientErrorNormalization';

import type {
    CallspecOk,
    CallspecNetworkClientError,
    CallspecResult,
    CallspecRouteResult,
    CallResultOptions,
} from './clientTypes';
import {CLIENT_ERROR, resolveRouteClientError} from './clientErrorNormalization';

function networkClientError(err: unknown): CallspecNetworkClientError {

    if (err instanceof Error) {

        return {
            code: CLIENT_ERROR.NETWORK_ERROR,
            data: {
                message: err.message,
                ...(err.name ? {name: err.name} : {}),
            },
        };

    }

    return {
        code: CLIENT_ERROR.NETWORK_ERROR,
        data: {message: String(err)},
    };

}

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
    encoding: 'json' | 'multipart' = 'json',
): Promise<Headers> {

    const resolved = typeof headers === 'function' ? await headers() : headers;
    const merged = new Headers(encoding === 'json' ? {'Content-Type': 'application/json'} : undefined);

    if (resolved) {

        new Headers(resolved).forEach((value, key) => merged.set(key, value));

    }

    if (encoding === 'multipart') {

        merged.delete('Content-Type');

    }

    return merged;

}

function appendFormValue(form: FormData, key: string, value: unknown): void {

    if (typeof Blob !== 'undefined' && value instanceof Blob) {

        const filename = typeof File !== 'undefined' && value instanceof File
            ? value.name
            : 'upload';

        form.append(key, value, filename);
        return;

    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {

        form.append(key, String(value));
        return;

    }

    form.append(key, JSON.stringify(value));

}

function toFormData(input: unknown): FormData {

    const form = new FormData();

    if (input == null || typeof input !== 'object') return form;

    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {

        if (value === undefined) continue;

        appendFormValue(form, key, value);

    }

    return form;

}

function toRequestBody(input: unknown, encoding: 'json' | 'multipart'): BodyInit {

    if (encoding === 'multipart') return toFormData(input);

    return JSON.stringify(input ?? {});

}

async function parseResponseBody(
    resp: Response,
    output?: CallResultOptions['output'],
): Promise<unknown> {

    const data = await resp.text();

    if (!data.trim().length) return undefined;

    try {

        const parsed: unknown = JSON.parse(data);

        if (output) {

            return deserializeWithPred(parsed, output);

        }

        return parsed;

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
        const encoding = options?.encoding === 'multipart' ? 'multipart' : 'json';
        const headers = await resolveHeaders(this.config.headers, encoding);
        const {fetchOptions} = this.config;

        let resp: Response;

        try {

            resp = await this.fetchImpl(url, {
                ...fetchOptions,
                method: 'POST',
                headers,
                body: toRequestBody(input, encoding),
            });

        } catch (err) {

            return {
                ok: false as const,
                status: 0,
                ...networkClientError(err),
            };

        }

        // Success: schema-guided ISO→Date revive. Errors: raw JSON — output pred must not
        // rewrite domain error `data` before JSON Schema validation.
        const body = await parseResponseBody(
            resp,
            resp.ok ? options?.output : undefined,
        );

        if (resp.ok) {

            return {ok: true, value: body as TOutput};

        }

        const resolved = resolveRouteClientError<TError>({
            status: resp.status,
            body,
            allowedErrorCodes: options?.allowedErrorCodes,
            domainErrors: options?.domainErrors,
            responseHeaders: resp.headers,
        });

        return {
            ok: false as const,
            status: resp.status,
            ...resolved,
        };

    }

}
