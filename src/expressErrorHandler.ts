import type {Request, Response, NextFunction, ErrorRequestHandler} from 'express';
import {
    CallspecUnauthorizedError,
    CallspecValidationError,
    formatRouteErrorBody,
    isRouteError,
    isRouteFailure,
    sendRouteErrorResponse,
    sendRouteFailureResponse,
} from './errors';
import {BUILTIN_ERROR} from './builtinErrors';

export function expressErrorHandler(): ErrorRequestHandler {

    return (err: unknown, _req: Request, res: Response, next: NextFunction): void => {

        if (res.headersSent) {

            next(err);
            return;

        }

        if (err instanceof CallspecValidationError) {

            res.status(400).json({error: BUILTIN_ERROR.VALIDATION_ERROR, errors: err.errors});
            return;

        }

        if (err instanceof CallspecUnauthorizedError) {

            res.status(401).json({error: BUILTIN_ERROR.UNAUTHORIZED});
            return;

        }

        if (isRouteFailure(err)) {

            sendRouteFailureResponse(res, err);
            return;

        }

        if (isRouteError(err)) {

            sendRouteErrorResponse(res, err);
            return;

        }

        res.status(500).json({error: BUILTIN_ERROR.INTERNAL_ERROR});

    };

}

export {formatRouteErrorBody, isRouteError, sendRouteErrorResponse};
