import {BUILTIN_ERROR, type BuiltinErrorCode, isBuiltinErrorCode} from '../builtinErrors';
import type {CallspecBuiltinClientError} from '../clientTypes';
import {EXACT_BODY_PHRASE_TO_CODE, FUZZY_PHRASE_TO_CODE} from './builtinPhraseMaps';
import {parseTooManyRequestsFromWire} from './tooManyRequests';
import {bodyTextForMatching, isWireRecord, normalizeFuzzyKey, stripHtmlForMatching} from './wireBody';

function builtinClientError<C extends BuiltinErrorCode>(
    code: C,
    data?: unknown,
): Extract<CallspecBuiltinClientError, {code: C}> {

    return (data !== undefined ? {code, data} : {code}) as Extract<CallspecBuiltinClientError, {code: C}>;

}

/** Step 2 in the pipeline — exact body phrase literals (case-insensitive). */
export function matchExactBodyPhrase(body: unknown): CallspecBuiltinClientError | undefined {

    const text = bodyTextForMatching(body);

    if (!text) {

        return undefined;

    }

    const code = EXACT_BODY_PHRASE_TO_CODE[stripHtmlForMatching(text).toLowerCase()];

    if (!code || code === BUILTIN_ERROR.TOO_MANY_REQUESTS) {

        return undefined;

    }

    return builtinClientError(code);

}

/** Step 3 — HTTP status before fuzzy body matching. */
export function matchBuiltinByStatus(status: number, body: unknown): CallspecBuiltinClientError | undefined {

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

        if (isWireRecord(body)) {

            const tooMany = parseTooManyRequestsFromWire(body);

            if (tooMany) {

                return tooMany;

            }

        }

        return {code: BUILTIN_ERROR.TOO_MANY_REQUESTS};

    }

    if (status === 502 || status === 503 || status === 504) {

        return {code: BUILTIN_ERROR.SERVICE_UNAVAILABLE};

    }

    return undefined;

}

/** Step 4 — fuzzy body text / code-like strings for builtins only. */
export function matchFuzzyBuiltin(body: unknown): CallspecBuiltinClientError | undefined {

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

    return undefined;

}
