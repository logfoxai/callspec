import type {Request} from 'express';
import {logRequest} from 'jsout-express';
import {logger} from 'jsout';

export {logRequest};

export function defaultLogUnhandledError(err: unknown, req: Request): void {

    logger.error(undefined, err, {url: req.url, method: req.method});

}
