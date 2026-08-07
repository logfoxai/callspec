import type {CallResultOptions, CallspecClientErrors} from '../clientTypes';
import {
    matchBuiltinByStatus,
    matchExactBodyPhrase,
    matchFuzzyBuiltin,
} from './matchBuiltinHeuristics';
import {parseCallspecJson} from './parseCallspecJson';
import type {ResolveRouteClientErrorInput, RouteErrorParsingContext} from './types';
import {buildUnknownClientError} from './unknownError';
import {hasExplicitCallspecErrorField} from './wireBody';

/**
 * Map an HTTP error response to a typed client failure.
 *
 * Pipeline: callspec JSON → undeclared `{ error }` → exact phrase → status → fuzzy → UNKNOWN.
 * See src/content/docs/error-handling.md and skills/callspec/SKILL.md.
 */
export function resolveRouteClientError<E>(
    input: ResolveRouteClientErrorInput,
): CallspecClientErrors<E> {

    const {status, body, allowedErrorCodes, domainErrors} = input;
    const routeErrors: RouteErrorParsingContext = {allowedErrorCodes, domainErrors};

    const fromJson = parseCallspecJson<E>(body, routeErrors);

    if (fromJson) {

        return fromJson;

    }

    if (hasExplicitCallspecErrorField(body)) {

        return buildUnknownClientError(input) as CallspecClientErrors<E>;

    }

    const exactPhrase = matchExactBodyPhrase(body);

    if (exactPhrase) {

        return exactPhrase as CallspecClientErrors<E>;

    }

    const fromStatus = matchBuiltinByStatus(status, body);

    if (fromStatus) {

        return fromStatus as CallspecClientErrors<E>;

    }

    const fromFuzzy = matchFuzzyBuiltin(body);

    if (fromFuzzy) {

        return fromFuzzy as CallspecClientErrors<E>;

    }

    return buildUnknownClientError(input) as CallspecClientErrors<E>;

}

/** Same pipeline for non-RPC routes (optional response headers). */
export function normalizeClientErrorBody(
    status: number,
    body: unknown,
    options?: CallResultOptions & {responseHeaders?: Headers},
): CallspecClientErrors<never> {

    return resolveRouteClientError({
        status,
        body,
        allowedErrorCodes: options?.allowedErrorCodes,
        domainErrors: options?.domainErrors,
        responseHeaders: options?.responseHeaders,
    });

}
