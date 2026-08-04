import {parseDomainErrorPayload} from '../clientErrorDataValidation';
import type {DomainErrorContract} from '../clientErrorDataValidation';
import type {CallspecClientErrors} from '../clientTypes';
import type {RouteErrorParsingContext, WireRecord} from './types';

function lookupDomainContract(
    code: string,
    ctx: RouteErrorParsingContext,
): DomainErrorContract | undefined {

    if (!ctx.allowedErrorCodes?.includes(code)) {

        return undefined;

    }

    return ctx.domainErrors?.[code];

}

function toDomainClientError<E>(code: string, data: unknown | undefined): CallspecClientErrors<E> {

    return (data === undefined ? {code} : {code, data}) as CallspecClientErrors<E>;

}

/** Step 1b — route-declared `{ error: "DOMAIN_CODE", data? }` with schema validation. */
export function parseDomainErrorFromWire<E>(
    wire: WireRecord,
    ctx: RouteErrorParsingContext,
): CallspecClientErrors<E> | undefined {

    const code = wire.error;

    if (typeof code !== 'string') {

        return undefined;

    }

    const contract = lookupDomainContract(code, ctx);

    if (!contract) {

        return undefined;

    }

    const payload = parseDomainErrorPayload(contract, wire.data);

    if (!payload.ok) {

        return undefined;

    }

    return toDomainClientError(code, payload.data);

}
