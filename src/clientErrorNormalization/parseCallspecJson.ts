import type {CallspecClientErrors} from '../clientTypes';
import {parseBuiltinFromWire} from './parseBuiltinWire';
import {parseDomainErrorFromWire} from './parseDomainWire';
import type {RouteErrorParsingContext} from './types';
import {isWireRecord} from './wireBody';

/** Step 1 — exact callspec JSON: builtins first, then validated domain errors. */
export function parseCallspecJson<E>(
    body: unknown,
    ctx: RouteErrorParsingContext,
): CallspecClientErrors<E> | undefined {

    if (!isWireRecord(body)) {

        return undefined;

    }

    const builtin = parseBuiltinFromWire(body);

    if (builtin) {

        return builtin as CallspecClientErrors<E>;

    }

    if (typeof body.error !== 'string') {

        return undefined;

    }

    return parseDomainErrorFromWire(body, ctx);

}
