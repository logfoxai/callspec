import {predicates as p} from 'runtyp';
import type {RouteErrorDef, RouteErrorSpec} from './types';

/** Common error codes — always on every route contract; throw via any {@link errors} handle. */
export const COMMON_ERROR = {
    NOT_FOUND: 'NOT_FOUND',
    FORBIDDEN: 'FORBIDDEN',
    CONFLICT: 'CONFLICT',
    TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type CommonErrorCode = typeof COMMON_ERROR[keyof typeof COMMON_ERROR];

export const commonErrorSpecs = {
    [COMMON_ERROR.NOT_FOUND]: {status: 404},
    [COMMON_ERROR.FORBIDDEN]: {status: 403},
    [COMMON_ERROR.CONFLICT]: {status: 409},
    [COMMON_ERROR.TOO_MANY_REQUESTS]: {
        status: 429,
        data: p.object({
            title: p.string(),
            message: p.string(),
        }),
    },
    [COMMON_ERROR.SERVICE_UNAVAILABLE]: {status: 503},
} as const satisfies Record<CommonErrorCode, RouteErrorSpec>;

export function commonErrorDefs(): Record<CommonErrorCode, RouteErrorDef> {

    const defs = {} as Record<CommonErrorCode, RouteErrorDef>;

    for (const [code, spec] of Object.entries(commonErrorSpecs) as [CommonErrorCode, RouteErrorSpec][]) {

        defs[code] = {
            status: spec.status,
            ...(spec.data ? {data: spec.data} : {}),
        };

    }

    return defs;

}

export function mergeDomainErrorDefs(
    domain: Record<string, RouteErrorDef> | undefined,
): Record<string, RouteErrorDef> {

    return {
        ...commonErrorDefs(),
        ...domain,
    };

}

export function isCommonErrorCode(code: string): code is CommonErrorCode {

    return Object.prototype.hasOwnProperty.call(commonErrorSpecs, code);

}
