import {
    BUILTIN_ERROR,
    type BuiltinErrorCode,
    isBuiltinErrorCode,
    isThrowableBuiltinCode,
} from './builtinErrors';
import type {
    CallspecBuiltinClientError,
    CallspecClientErrors,
    CallspecTooManyRequestsClientError,
    CallspecUnknownClientError,
    CallResultOptions,
} from './clientTypes';

export const CLIENT_ERROR = {
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ResolveRouteClientErrorInput = {
    status: number
    body: unknown
    allowedErrorCodes?: readonly string[]
    responseHeaders?: Headers
};

const EXACT_BODY_PHRASE_TO_CODE: Record<string, BuiltinErrorCode> = {
    unauthorized: BUILTIN_ERROR.UNAUTHORIZED,
    forbidden: BUILTIN_ERROR.FORBIDDEN,
    'not found': BUILTIN_ERROR.NOT_FOUND,
    'service unavailable': BUILTIN_ERROR.SERVICE_UNAVAILABLE,
    'bad gateway': BUILTIN_ERROR.SERVICE_UNAVAILABLE,
    'gateway timeout': BUILTIN_ERROR.SERVICE_UNAVAILABLE,
};

const FUZZY_PHRASE_TO_CODE: Record<string, BuiltinErrorCode> = {
    unauthorized: BUILTIN_ERROR.UNAUTHORIZED,
    forbidden: BUILTIN_ERROR.FORBIDDEN,
    notfound: BUILTIN_ERROR.NOT_FOUND,
    serviceunavailable: BUILTIN_ERROR.SERVICE_UNAVAILABLE,
    badgateway: BUILTIN_ERROR.SERVICE_UNAVAILABLE,
    gatewaytimeout: BUILTIN_ERROR.SERVICE_UNAVAILABLE,
};

function responseHeadersRecord(headers: Headers): Record<string, string> {

    const record: Record<string, string> = {};

    headers.forEach((value, key) => {

        record[key] = value;

    });

    return record;

}

function unknownClientError(input: ResolveRouteClientErrorInput): CallspecUnknownClientError {

    const headers = input.responseHeaders;

    const headerRecord = headers
        ? responseHeadersRecord(headers)
        : undefined;

    return {
        code: CLIENT_ERROR.UNKNOWN_ERROR,
        data: {
            body: input.body,
            ...(headerRecord && Object.keys(headerRecord).length > 0 ? {headers: headerRecord} : {}),
        },
    };

}

function stripHtmlForMatching(text: string): string {

    return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

}

function normalizeFuzzyKey(text: string): string {

    return stripHtmlForMatching(text)
        .toLowerCase()
        .replace(/[\s_-]+/g, '');

}

function bodyTextForMatching(body: unknown): string | undefined {

    if (typeof body === 'string') {

        return body;

    }

    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {

        const record = body as Record<string, unknown>;

        if (typeof record.error === 'string') {

            return record.error;

        }

        if (typeof record.message === 'string') {

            return record.message;

        }

    }

    return undefined;

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

        return undefined;

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

function builtinClientError<C extends BuiltinErrorCode>(
    code: C,
    data?: unknown,
): Extract<CallspecBuiltinClientError, {code: C}> {

    return (data !== undefined ? {code, data} : {code}) as Extract<CallspecBuiltinClientError, {code: C}>;

}

function normalizeBuiltinJson(record: Record<string, unknown>): CallspecBuiltinClientError | undefined {

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

function matchExactBodyPhrase(body: unknown): CallspecBuiltinClientError | undefined {

    const text = bodyTextForMatching(body);

    if (!text) {

        return undefined;

    }

    const stripped = stripHtmlForMatching(text);
    const normalizedPhrase = stripped.toLowerCase();

    const code = EXACT_BODY_PHRASE_TO_CODE[normalizedPhrase];

    if (!code) {

        return undefined;

    }

    if (code === BUILTIN_ERROR.TOO_MANY_REQUESTS) {

        return undefined;

    }

    return builtinClientError(code);

}

function matchByStatus(status: number, body: unknown): CallspecBuiltinClientError | undefined {

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

    if (status === 502 || status === 503 || status === 504) {

        return {code: BUILTIN_ERROR.SERVICE_UNAVAILABLE};

    }

    return undefined;

}

function matchFuzzyBody(body: unknown, allowedErrorCodes?: readonly string[]): CallspecClientErrors<never> | undefined {

    const text = bodyTextForMatching(body);

    if (!text) {

        return undefined;

    }

    const fuzzyKey = normalizeFuzzyKey(text);
    const phraseCode = FUZZY_PHRASE_TO_CODE[fuzzyKey];

    if (phraseCode) {

        if (phraseCode === BUILTIN_ERROR.TOO_MANY_REQUESTS) {

            return undefined;

        }

        return builtinClientError(phraseCode);

    }

    const normalizedCodeKey = fuzzyKey.toUpperCase();

    if (isBuiltinErrorCode(normalizedCodeKey)) {

        return builtinClientError(normalizedCodeKey);

    }

    if (allowedErrorCodes?.some((code) => normalizeFuzzyKey(code) === fuzzyKey)) {

        const matched = allowedErrorCodes.find((code) => normalizeFuzzyKey(code) === fuzzyKey)!;

        if (typeof body === 'object' && body !== null && !Array.isArray(body)) {

            const record = body as Record<string, unknown>;

            if (record.error === matched) {

                return (record.data !== undefined
                    ? {code: matched, data: record.data}
                    : {code: matched}) as CallspecClientErrors<never>;

            }

        }

        return {code: matched} as CallspecClientErrors<never>;

    }

    return undefined;

}

function matchCallspecJson<E>(
    body: unknown,
    allowedErrorCodes?: readonly string[],
): CallspecClientErrors<E> | undefined {

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {

        return undefined;

    }

    const record = body as Record<string, unknown>;
    const builtin = normalizeBuiltinJson(record);

    if (builtin) {

        return builtin as CallspecClientErrors<E>;

    }

    if (typeof record.error !== 'string') {

        return undefined;

    }

    if (
        record.error === BUILTIN_ERROR.VALIDATION_ERROR
        && typeof record.errors === 'object'
        && record.errors !== null
    ) {

        return {
            code: BUILTIN_ERROR.VALIDATION_ERROR,
            data: record.errors as Record<string, string>,
        } as CallspecClientErrors<E>;

    }

    if (allowedErrorCodes?.includes(record.error)) {

        return (record.data !== undefined
            ? {code: record.error, data: record.data}
            : {code: record.error}) as CallspecClientErrors<E>;

    }

    return undefined;

}

function hasExplicitCallspecErrorField(body: unknown): boolean {

    return typeof body === 'object'
        && body !== null
        && !Array.isArray(body)
        && typeof (body as Record<string, unknown>).error === 'string';

}

/** Map an HTTP error response to a typed client failure (see docs/error-handling.md). */
export function resolveRouteClientError<E>(
    input: ResolveRouteClientErrorInput,
): CallspecClientErrors<E> {

    const {status, body, allowedErrorCodes} = input;

    const fromJson = matchCallspecJson<E>(body, allowedErrorCodes);

    if (fromJson) {

        return fromJson;

    }

    if (hasExplicitCallspecErrorField(body)) {

        return unknownClientError(input) as CallspecClientErrors<E>;

    }

    const exactPhrase = matchExactBodyPhrase(body);

    if (exactPhrase) {

        return exactPhrase as CallspecClientErrors<E>;

    }

    const fromStatus = matchByStatus(status, body);

    if (fromStatus) {

        return fromStatus as CallspecClientErrors<E>;

    }

    const fromFuzzy = matchFuzzyBody(body, allowedErrorCodes);

    if (fromFuzzy) {

        return fromFuzzy as CallspecClientErrors<E>;

    }

    return unknownClientError(input) as CallspecClientErrors<E>;

}

/** Loose normalization for non-RPC routes (same pipeline; optional response headers). */
export function normalizeClientErrorBody(
    status: number,
    body: unknown,
    options?: CallResultOptions & {responseHeaders?: Headers},
): CallspecClientErrors<never> {

    return resolveRouteClientError({
        status,
        body,
        allowedErrorCodes: options?.allowedErrorCodes,
        responseHeaders: options?.responseHeaders,
    });

}
