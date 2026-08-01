import type {Pred} from 'runtyp';
import {CallspecRouteError} from './errors';
import type {RouteErrorDef} from './types';

export type RouteErrorSpec = {
    status: number
    data?: Pred<unknown>
};

type ThrowFn<Spec extends RouteErrorSpec> =
    Spec['data'] extends Pred<infer D>
        ? (data: D) => CallspecRouteError<string, D>
        : () => CallspecRouteError<string, undefined>;

/** Internal marker — keeps defs off the public object so any error code name works. */
const ERROR_DEFS = Symbol.for('callspec.errors.defs');

/** Pass the whole handle to `defineRoute({ errors: e })`. */
export type ErrorsHandle = {
    [ERROR_DEFS]: Readonly<Record<string, RouteErrorDef>>
};

export type ErrorsHandleWithThrowers<T extends Record<string, RouteErrorSpec>> =
    ErrorsHandle & {[K in keyof T & string]: ThrowFn<T[K]>};

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
): CallspecRouteError<string, unknown> {

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

        return new CallspecRouteError(code, spec.status, validated.value);

    }

    if (data !== undefined) {

        throw new Error(`Route error "${code}" does not accept data`);

    }

    return new CallspecRouteError(code, spec.status, undefined);

}

function isErrorsHandle(errors: RouteErrorsInput): errors is ErrorsHandle {

    return ERROR_DEFS in errors;

}

/** Declare route errors once; throw with `e.NOT_FOUND()`, pass `e` to `defineRoute({ errors: e })`. */
export function errors<const T extends Record<string, RouteErrorSpec>>(
    spec: T,
): ErrorsHandleWithThrowers<T> {

    const defs: Record<string, RouteErrorDef> = {};
    const handle: Record<string, unknown> = {};

    for (const code of Object.keys(spec) as (keyof T & string)[]) {

        const entry = spec[code];

        defs[code] = toRouteErrorDef(entry);
        handle[code] = (data?: unknown): CallspecRouteError<string, unknown> => throwRouteError(code, entry, data);

    }

    (handle as ErrorsHandle)[ERROR_DEFS] = defs;

    return handle as ErrorsHandleWithThrowers<T>;

}

export function resolveRouteErrorDefs(
    errors?: RouteErrorsInput,
): Record<string, RouteErrorDef> | undefined {

    if (!errors) {

        return undefined;

    }

    if (isErrorsHandle(errors)) {

        return {...errors[ERROR_DEFS]};

    }

    return errors as Record<string, RouteErrorDef>;

}

/** Optional domain errors many routes reuse — spread into {@link errors}. */
export const commonErrors = {
    NOT_FOUND: {status: 404},
    FORBIDDEN: {status: 403},
    CONFLICT: {status: 409},
} as const satisfies Record<string, RouteErrorSpec>;

/** @deprecated Use {@link errors}. */
export const routeErrors = errors;

export type RouteErrorsFactory<T extends Record<string, RouteErrorSpec>> =
    ErrorsHandleWithThrowers<T>;

export type InferRouteErrorData<E extends RouteErrorDef> =
    E['data'] extends Pred<infer D> ? D : undefined;
