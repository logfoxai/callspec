import type {RouteFailure} from './types';

export class CallspecValidationError extends Error {

    errors: Record<string, string>;

    constructor(errors: Record<string, string>) {

        super('VALIDATION_ERROR');
        this.name = 'CallspecValidationError';
        this.errors = errors;

    }

}

export class CallspecUnauthorizedError extends Error {

    constructor() {

        super('UNAUTHORIZED');
        this.name = 'CallspecUnauthorizedError';

    }

}

/**
 * Legacy Error subclass for intentional HTTP failures.
 * Prefer returning {@link RouteFailure} from resolvers (`defineErrors` / `err`).
 * Still mapped when thrown: RPC via `mountSpec`, non-RPC via `expressErrorHandler`.
 */
export class RouteError<
    Code extends string = string,
    Data = unknown,
> extends Error {

    readonly code: Code;

    readonly status: number;

    readonly data: Data | undefined;

    constructor(code: Code, status: number, data?: Data) {

        super(code);
        this.name = 'RouteError';
        this.code = code;
        this.status = status;
        this.data = data;

    }

}

export function isRouteFailure(value: unknown): value is RouteFailure {

    return typeof value === 'object'
        && value !== null
        && (value as RouteFailure).ok === false
        && typeof (value as RouteFailure).code === 'string'
        && typeof (value as RouteFailure).status === 'number';

}

export function formatRouteFailureBody(failure: RouteFailure): Record<string, unknown> {

    if (failure.data !== undefined) {

        return {error: failure.code, data: failure.data};

    }

    return {error: failure.code};

}

export function sendRouteFailureResponse(
    res: {status: (code: number) => {json: (body: unknown) => void}},
    failure: RouteFailure,
): void {

    res.status(failure.status).json(formatRouteFailureBody(failure));

}

export function isRouteError(value: unknown): value is RouteError {

    return value instanceof RouteError;

}

export function formatRouteErrorBody(error: RouteError): Record<string, unknown> {

    if (error.data !== undefined) {

        return {error: error.code, data: error.data};

    }

    return {error: error.code};

}

export function sendRouteErrorResponse(
    res: {status: (code: number) => {json: (body: unknown) => void}},
    error: RouteError,
): void {

    res.status(error.status).json(formatRouteErrorBody(error));

}
