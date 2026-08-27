import {BUILTIN_ERROR} from '../builtinErrors';
import type {CallspecNetworkClientError} from '../clientTypes';
import {CLIENT_ERROR} from './types';

const SERVER_UNREACHABLE_CODES = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'EPIPE',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ENOTFOUND',
]);

const SERVER_UNREACHABLE_MESSAGE = /econnrefused|connection refused|connect econnrefused|socket hang up|econnreset|ehostunreach|enetunreach|getaddrinfo enotfound|network unreachable/i;

const FETCH_TRANSPORT_MESSAGE = /failed to fetch|load failed|network error when attempting to fetch/i;

export type ClassifiedFetchFailure =
    | ({status: 0} & CallspecNetworkClientError)
    | {
        status: 500
        code: typeof BUILTIN_ERROR.INTERNAL_ERROR
        data: {
            message: string
            name?: string
        }
    };

function fetchErrorMessage(err: unknown): string {

    if (err instanceof Error) return err.message;

    return String(err);

}

function fetchErrorName(err: unknown): string | undefined {

    return err instanceof Error ? err.name : undefined;

}

function systemErrorCode(err: unknown): string | undefined {

    if (typeof err !== 'object' || err === null) return undefined;

    const direct = (err as {code?: unknown}).code;

    if (typeof direct === 'string') return direct;

    const cause = (err as {cause?: unknown}).cause;

    if (typeof cause === 'object' && cause !== null) {

        const nested = (cause as {code?: unknown}).code;

        if (typeof nested === 'string') return nested;

    }

    return undefined;

}

function isBrowserOffline(): boolean {

    return typeof navigator !== 'undefined' && navigator.onLine === false;

}

function networkClientError(err: unknown): CallspecNetworkClientError {

    const message = fetchErrorMessage(err);
    const name = fetchErrorName(err);

    return {
        code: CLIENT_ERROR.NETWORK_ERROR,
        data: {
            message,
            ...(name ? {name} : {}),
        },
    };

}

function serverUnreachableClientError(err: unknown): Extract<ClassifiedFetchFailure, {status: 500}> {

    const message = fetchErrorMessage(err);
    const name = fetchErrorName(err);

    return {
        status: 500,
        code: BUILTIN_ERROR.INTERNAL_ERROR,
        data: {
            message,
            ...(name ? {name} : {}),
        },
    };

}

function looksLikeServerUnreachable(err: unknown): boolean {

    const sysCode = systemErrorCode(err);

    if (sysCode && SERVER_UNREACHABLE_CODES.has(sysCode)) return true;

    return SERVER_UNREACHABLE_MESSAGE.test(fetchErrorMessage(err));

}

function looksLikeTransportFailureWhileOnline(err: unknown): boolean {

    const name = fetchErrorName(err);
    const message = fetchErrorMessage(err);

    if (name === 'TypeError' && FETCH_TRANSPORT_MESSAGE.test(message)) return true;

    return false;

}

/** Classify a thrown `fetch` error before any HTTP response is received. */
export function classifyFetchFailure(err: unknown): ClassifiedFetchFailure {

    if (isBrowserOffline()) {

        return {
            status: 0,
            ...networkClientError(err),
        };

    }

    if (looksLikeServerUnreachable(err) || looksLikeTransportFailureWhileOnline(err)) {

        return serverUnreachableClientError(err);

    }

    return {
        status: 0,
        ...networkClientError(err),
    };

}
