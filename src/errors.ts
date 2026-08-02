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

/** Thrown via {@link errors} handles — mapped to HTTP by mountSpec / expressErrorHandler. */
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
