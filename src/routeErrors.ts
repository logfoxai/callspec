import type {Pred} from 'runtyp';
import {CallspecRouteError} from './errors';
import type {RouteErrorDef} from './types';

export type RouteErrorSpec = {
    status: number
    data?: Pred<unknown>
};

type RouteErrorFactory<Spec extends RouteErrorSpec> =
    Spec['data'] extends Pred<infer D>
        ? (data: D) => CallspecRouteError<string, D>
        : () => CallspecRouteError<string, undefined>;

export interface RouteErrorsHandle {
    readonly $defs: Readonly<Record<string, RouteErrorDef>>
}

export type RouteErrorsFactory<T extends Record<string, RouteErrorSpec>> = RouteErrorsHandle & {
    readonly [K in keyof T]: RouteErrorFactory<T[K]>
};

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

export function routeErrors<const T extends Record<string, RouteErrorSpec>>(
    spec: T,
): RouteErrorsFactory<T> {

    const defs = {} as Record<keyof T & string, RouteErrorDef>;
    const factories: Record<string, (...args: unknown[]) => CallspecRouteError<string, unknown>> = {};

    for (const code of Object.keys(spec) as (keyof T & string)[]) {

        const entry = spec[code];

        defs[code] = toRouteErrorDef(entry);
        factories[code] = (data?: unknown): CallspecRouteError<string, unknown> => throwRouteError(code, entry, data);

    }

    const result = factories as RouteErrorsFactory<T>;

    Object.defineProperty(result, '$defs', {
        value: defs,
        enumerable: false,
    });

    return result;

}

export type RouteErrorsInput =
    | Record<string, RouteErrorDef>
    | RouteErrorsHandle;

function isRouteErrorsFactory(value: RouteErrorsInput): value is RouteErrorsHandle {

    return typeof value === 'object' && value !== null && '$defs' in value;

}

export function resolveRouteErrorDefs(
    errors?: RouteErrorsInput,
): Record<string, RouteErrorDef> | undefined {

    if (!errors) {

        return undefined;

    }

    if (isRouteErrorsFactory(errors)) {

        return {...errors.$defs};

    }

    return errors;

}

export type InferRouteErrorData<E extends RouteErrorDef> =
    E['data'] extends Pred<infer D> ? D : undefined;

export type InferRouteErrorsMap<T extends Record<string, RouteErrorDef>> = {
    [K in keyof T & string]: {
        error: K
        data: InferRouteErrorData<T[K]>
    }
}[keyof T & string];
