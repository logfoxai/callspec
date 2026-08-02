import type {Pred} from 'runtyp';
import {RouteError} from './errors';
import type {RouteErrorDef, RouteErrorSpec} from './types';
import {
    commonErrorSpecs,
    isCommonErrorCode,
    type CommonErrorCode,
} from './commonErrors';

export type {RouteErrorSpec} from './types';

type ThrowFn<Spec extends RouteErrorSpec> =
    Spec['data'] extends Pred<infer D>
        ? (data: D) => RouteError<string, D>
        : () => RouteError<string, undefined>;

/** Internal marker — domain defs only (common errors are implicit). */
const ERROR_DEFS = Symbol.for('callspec.errors.defs');

/** Pass the whole handle to `defineRoute({ errors: e })` — domain codes only. */
type ErrorsHandle = {
    [ERROR_DEFS]: Readonly<Record<string, RouteErrorDef>>
};

type CommonThrowers = {
    [K in CommonErrorCode]: ThrowFn<(typeof commonErrorSpecs)[K]>
};

export type ErrorsHandleWithThrowers<T extends Record<string, RouteErrorSpec>> =
    ErrorsHandle & CommonThrowers & {[K in keyof T & string]: ThrowFn<T[K]>};

export type RouteErrorsInput = Record<string, RouteErrorDef> | ErrorsHandle;

function toRouteErrorDef(spec: RouteErrorSpec): RouteErrorDef {

    return {
        status: spec.status,
        ...(spec.data ? {data: spec.data} : {}),
    };

}

function throwRouteError(
    code: string,
    spec: RouteErrorSpec,
    data?: unknown,
): RouteError<string, unknown> {

    if (spec.data) {

        if (data === undefined) {

            throw new Error(`Route error "${code}" requires data`);

        }

        const validated = spec.data(data);

        if (!validated.isValid) {

            throw new Error(
                `Route error "${code}" data invalid: ${JSON.stringify(validated.errors)}`,
            );

        }

        return new RouteError(code, spec.status, validated.value);

    }

    if (data !== undefined) {

        throw new Error(`Route error "${code}" does not accept data`);

    }

    return new RouteError(code, spec.status, undefined);

}

function isErrorsHandle(errors: RouteErrorsInput): errors is ErrorsHandle {

    return ERROR_DEFS in errors;

}

/** Declare domain route errors; common throwers are always on the returned handle. */
export function errors<const T extends Record<string, RouteErrorSpec>>(
    spec: T = {} as T,
): ErrorsHandleWithThrowers<T> {

    for (const code of Object.keys(spec)) {

        if (isCommonErrorCode(code)) {

            throw new Error(`Cannot declare common error "${code}" — it is always available`);

        }

    }

    const domainDefs: Record<string, RouteErrorDef> = {};
    const handle: Record<string, unknown> = {};

    for (const code of Object.keys(commonErrorSpecs) as CommonErrorCode[]) {

        const entry = commonErrorSpecs[code];

        handle[code] = (data?: unknown): RouteError<string, unknown> => throwRouteError(code, entry, data);

    }

    for (const code of Object.keys(spec) as (keyof T & string)[]) {

        const entry = spec[code];

        domainDefs[code] = toRouteErrorDef(entry);
        handle[code] = (data?: unknown): RouteError<string, unknown> => throwRouteError(code, entry, data);

    }

    (handle as ErrorsHandle)[ERROR_DEFS] = domainDefs;

    return handle as ErrorsHandleWithThrowers<T>;

}

/** Common-only throw handle — use in resolvers when a route has no domain errors. */
export const err = errors({});

export function resolveRouteErrorDefs(
    errors?: RouteErrorsInput,
): Record<string, RouteErrorDef> | undefined {

    if (!errors) {

        return undefined;

    }

    if (isErrorsHandle(errors)) {

        const domain = errors[ERROR_DEFS];

        return Object.keys(domain).length ? {...domain} : undefined;

    }

    return errors as Record<string, RouteErrorDef>;

}

export function isAllowedRouteErrorCode(
    code: string,
    domainErrors: Record<string, RouteErrorDef> | undefined,
): boolean {

    if (isCommonErrorCode(code)) {

        return true;

    }

    return domainErrors !== undefined && Object.prototype.hasOwnProperty.call(domainErrors, code);

}
