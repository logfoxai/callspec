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

export class CallspecNotFoundError extends Error {

    constructor(name: string) {

        super(`Route not found: ${name}`);
        this.name = 'CallspecNotFoundError';

    }

}
