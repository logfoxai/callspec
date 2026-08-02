import type {Pred} from 'runtyp';
import type {RouteErrorDef, RouteErrorSpec, RouteFailure} from './types';
import {DEFAULT_ROUTE_ERROR_STATUS} from './types';
import {
    isThrowableBuiltinCode,
    builtInErrors,
    type ThrowableBuiltinCode,
} from './builtinErrors';

export type {RouteErrorSpec} from './types';

type FailFn<Spec extends RouteErrorSpec> =
    Spec['data'] extends Pred<infer D>
        ? undefined extends D
            ? (data?: Exclude<D, undefined>) => RouteFailure
            : (data: D) => RouteFailure
        : () => RouteFailure;

/** Internal marker — domain defs only (builtin failers are implicit). */
const ERROR_DEFS = Symbol.for('callspec.errors.defs');

/** Pass the whole handle to `defineRoute({ errors: e })` — domain codes only. */
type ErrorsHandle = {
    [ERROR_DEFS]: Readonly<Record<string, RouteErrorDef>>
};

type BuiltinFailers = {
    [K in ThrowableBuiltinCode]: FailFn<(typeof builtInErrors)[K]>
};

export type ErrorsHandleWithFailers<T extends Record<string, RouteErrorSpec>> =
    ErrorsHandle & BuiltinFailers & {[K in keyof T & string]: FailFn<T[K]>};

export type DefineErrorsInput = Record<string, RouteErrorDef> | ErrorsHandle;

function resolveRouteErrorStatus(spec: RouteErrorSpec): number {

    return spec.status ?? DEFAULT_ROUTE_ERROR_STATUS;

}

function toRouteErrorDef(spec: RouteErrorSpec): RouteErrorDef {

    return {
        status: resolveRouteErrorStatus(spec),
        ...(spec.data ? {data: spec.data} : {}),
    };

}

function failRouteError(
    code: string,
    spec: RouteErrorSpec,
    data?: unknown,
): RouteFailure {

    if (spec.data) {

        const validated = spec.data(data);

        if (!validated.isValid) {

            throw new Error(
                data === undefined
                    ? `Route error "${code}" requires data`
                    : `Route error "${code}" data invalid: ${JSON.stringify(validated.errors)}`,
            );

        }

        return {
            ok: false,
            code,
            status: resolveRouteErrorStatus(spec),
            ...(validated.value !== undefined ? {data: validated.value} : {}),
        };

    }

    if (data !== undefined) {

        throw new Error(`Route error "${code}" does not accept data`);

    }

    return {
        ok: false,
        code,
        status: resolveRouteErrorStatus(spec),
    };

}

function isErrorsHandle(errors: DefineErrorsInput): errors is ErrorsHandle {

    return ERROR_DEFS in errors;

}

/** Declare domain route errors; builtin failers are always on the returned handle. */
export function defineErrors<const T extends Record<string, RouteErrorSpec>>(
    spec: T = {} as T,
): ErrorsHandleWithFailers<T> {

    for (const code of Object.keys(spec)) {

        if (isThrowableBuiltinCode(code)) {

            throw new Error(`Cannot declare builtin error "${code}" — it is always available`);

        }

    }

    const domainDefs: Record<string, RouteErrorDef> = {};
    const handle: Record<string, unknown> = {};

    for (const code of Object.keys(builtInErrors) as ThrowableBuiltinCode[]) {

        const entry = builtInErrors[code];

        handle[code] = (data?: unknown): RouteFailure => failRouteError(code, entry, data);

    }

    for (const code of Object.keys(spec) as (keyof T & string)[]) {

        const entry = spec[code];

        domainDefs[code] = toRouteErrorDef(entry);
        handle[code] = (data?: unknown): RouteFailure => failRouteError(code, entry, data);

    }

    (handle as ErrorsHandle)[ERROR_DEFS] = domainDefs;

    return handle as ErrorsHandleWithFailers<T>;

}

/** Builtin-only fail handle — use in resolvers when a route has no domain errors. */
export const err = defineErrors({});

export function resolveRouteErrorDefs(
    errors?: DefineErrorsInput,
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

export function isAllowedRouteFailure(
    failure: RouteFailure,
    routeErrors: Record<string, RouteErrorDef> | undefined,
): boolean {

    return routeErrors !== undefined
        && Object.prototype.hasOwnProperty.call(routeErrors, failure.code);

}
