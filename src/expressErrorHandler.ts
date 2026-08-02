import type {Request, Response, NextFunction, ErrorRequestHandler} from 'express';
import {
    CallspecUnauthorizedError,
    CallspecValidationError,
    formatRouteErrorBody,
    isRouteError,
    sendRouteErrorResponse,
} from './errors';
import {FRAMEWORK_ERROR} from './frameworkErrors';

export function expressErrorHandler(): ErrorRequestHandler {

    return (err: unknown, _req: Request, res: Response, next: NextFunction): void => {

        if (res.headersSent) {

            next(err);
            return;

        }

        if (err instanceof CallspecValidationError) {

            res.status(400).json({error: FRAMEWORK_ERROR.VALIDATION_ERROR, errors: err.errors});
            return;

        }

        if (err instanceof CallspecUnauthorizedError) {

            res.status(401).json({error: FRAMEWORK_ERROR.UNAUTHORIZED});
            return;

        }

        if (isRouteError(err)) {

            sendRouteErrorResponse(res, err);
            return;

        }

        res.status(500).json({error: FRAMEWORK_ERROR.INTERNAL_ERROR});

    };

}

export {formatRouteErrorBody, isRouteError, sendRouteErrorResponse};
