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
