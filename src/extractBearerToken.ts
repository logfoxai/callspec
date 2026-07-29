import type {Request} from 'express';

export function extractBearerToken(req: Request): string | undefined {

    const authStr = req.headers.authorization;

    if (!authStr) return undefined;

    const match = authStr.match(/^Bearer\s+(\S+)/i);

    return match?.[1];

}
