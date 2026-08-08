import type {Pred} from 'runtyp';
import type {RouteErrorDef, RouteErrorSpec, RouteFailure} from './types';
import {DEFAULT_ROUTE_ERROR_STATUS} from './types';
import {
    isThrowableBuiltinCode,
    builtInErrors,
    type ThrowableBuiltinCode,
} from './builtinErrors';

export type {RouteErrorSpec} from './types';

type FailFn<Spec extends RouteErrorSpec, Code extends string> =
    Spec['data'] extends Pred<infer D>
        ? undefined extends D
            ? (data?: Exclude<D, undefined>) => RouteFailure & {code: Code}
            : (data: D) => RouteFailure & {code: Code}
        : () => RouteFailure & {code: Code};

type BuiltinFailers = {
    [K in ThrowableBuiltinCode]: FailFn<(typeof builtInErrors)[K], K>
};

/** Internal marker — domain defs only (builtin failers are implicit). */
const ERROR_DEFS = Symbol.for('callspec.errors.defs');

/** Pass the whole handle to `route({ errors: e })` — domain codes only. */
type ErrorsHandle = {
    [ERROR_DEFS]: Readonly<Record<string, RouteErrorDef>>
};

export type ErrorsHandleWithFailers<T extends Record<string, RouteErrorSpec>> =
    ErrorsHandle & BuiltinFailers & {[K in keyof T & string]: FailFn<T[K], K>};

export type DefineErrorsInput = Record<string, RouteErrorDef> | ErrorsHandle;

type FailersFromHandle<H> = Extract<
    {
        [K in keyof H]: H[K] extends (...args: any[]) => infer R ? R : never
    }[keyof H],
    RouteFailure
>;

type DomainFailuresFromDefs<E extends Record<string, RouteErrorDef>> = Extract<
    {
        [K in keyof E & string]: RouteFailure & {code: K}
    }[keyof E & string],
    RouteFailure
>;

/** Union of RouteFailure values from an errors handle (builtins + domain failers). */
export type RouteFailuresFrom<E> = FailersFromHandle<E>;

function resolveRouteErrorStatus(spec: RouteErrorSpec): number {

    return spec.status ?? DEFAULT_ROUTE_ERROR_STATUS;

}

function toRouteErrorDef(spec: RouteErrorSpec): RouteErrorDef {

    return {
        status: resolveRouteErrorStatus(spec),
        ...(spec.data ? {data: spec.data} : {}),
    };

}

function failRouteError<const Code extends string>(
    code: Code,
    spec: RouteErrorSpec,
    data?: unknown,
): RouteFailure & {code: Code} {

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

        handle[code] = (data?: unknown): RouteFailure & {code: typeof code} =>
            failRouteError(code, entry, data);

    }

    for (const code of Object.keys(spec) as (keyof T & string)[]) {

        const entry = spec[code];

        domainDefs[code] = toRouteErrorDef(entry);
        handle[code] = (data?: unknown): RouteFailure & {code: typeof code} =>
            failRouteError(code, entry, data);

    }

    (handle as ErrorsHandle)[ERROR_DEFS] = domainDefs;

    return handle as ErrorsHandleWithFailers<T>;

}

/** Builtin-only fail handle — use in handlers when a route has no domain errors. */
export const err = defineErrors({});

/** Failures from {@link err} — builtins only (every route allows these). */
export type BuiltinRouteFailures = FailersFromHandle<typeof err>;

/** Failures allowed on a route from its `errors:` param (builtins when omitted). */
export type RouteFailuresFor<E> =
    [E] extends [undefined]
        ? BuiltinRouteFailures
        : E extends ErrorsHandle
            ? FailersFromHandle<E>
            : E extends Record<string, RouteErrorDef>
                ? BuiltinRouteFailures | DomainFailuresFromDefs<E>
                : BuiltinRouteFailures;

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
