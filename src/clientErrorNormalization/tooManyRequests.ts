import {BUILTIN_ERROR} from '../builtinErrors';
import type {CallspecTooManyRequestsClientError, TooManyRequestsContext} from '../clientTypes';
import type {WireRecord} from './types';
import {isWireRecord} from './wireBody';

function readTooManyRequestsContext(source: WireRecord): TooManyRequestsContext | undefined {

    const title = typeof source.title === 'string' ? source.title : undefined;
    const message = typeof source.message === 'string' ? source.message : undefined;

    if (title === undefined && message === undefined) {

        return undefined;

    }

    return {
        ...(title !== undefined ? {title} : {}),
        ...(message !== undefined ? {message} : {}),
    };

}

/** Parse 429 wire JSON and legacy `{ title?, message? }` bodies — never invent missing fields. */
export function parseTooManyRequestsFromWire(body: WireRecord): CallspecTooManyRequestsClientError | undefined {

    if (body.error === BUILTIN_ERROR.TOO_MANY_REQUESTS) {

        if (isWireRecord(body.data)) {

            const context = readTooManyRequestsContext(body.data);

            if (context) {

                return {
                    code: BUILTIN_ERROR.TOO_MANY_REQUESTS,
                    data: context,
                };

            }

        }

        return {code: BUILTIN_ERROR.TOO_MANY_REQUESTS};

    }

    const legacyContext = readTooManyRequestsContext(body);

    if (legacyContext) {

        return {
            code: BUILTIN_ERROR.TOO_MANY_REQUESTS,
            data: legacyContext,
        };

    }

    return undefined;

}
