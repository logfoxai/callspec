import {responseHeadersRecord} from './wireBody';
import {CLIENT_ERROR, type ResolveRouteClientErrorInput} from './types';
import type {CallspecUnknownClientError} from '../clientTypes';

/** Foreign or contract-breaking response — preserve raw body (+ headers when present). */
export function buildUnknownClientError(input: ResolveRouteClientErrorInput): CallspecUnknownClientError {

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
