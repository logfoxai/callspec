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

/** Declared route error — thrown via {@link errors} and mapped to HTTP by mountSpec. */
export class CallspecRouteError<
    Code extends string = string,
    Data = unknown,
> extends Error {

    readonly code: Code;

    readonly status: number;

    readonly data: Data | undefined;

    constructor(code: Code, status: number, data?: Data) {

        super(code);
        this.name = 'CallspecRouteError';
        this.code = code;
        this.status = status;
        this.data = data;

    }

}

export function isCallspecRouteError(value: unknown): value is CallspecRouteError {

    return value instanceof CallspecRouteError;

}

export function formatRouteErrorBody(error: CallspecRouteError): Record<string, unknown> {

    if (error.data !== undefined) {

        return {error: error.code, data: error.data};

    }

    return {error: error.code};

}
