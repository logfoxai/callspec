import {BUILTIN_ERROR, type BuiltinErrorCode} from '../builtinErrors';

/** Case-insensitive body literals before fuzzy / status fallback. */
export const EXACT_BODY_PHRASE_TO_CODE: Record<string, BuiltinErrorCode> = {
    unauthorized: BUILTIN_ERROR.UNAUTHORIZED,
    forbidden: BUILTIN_ERROR.FORBIDDEN,
    'not found': BUILTIN_ERROR.NOT_FOUND,
    'service unavailable': BUILTIN_ERROR.SERVICE_UNAVAILABLE,
    'bad gateway': BUILTIN_ERROR.SERVICE_UNAVAILABLE,
    'gateway timeout': BUILTIN_ERROR.SERVICE_UNAVAILABLE,
};

/** Normalized body text (HTML stripped, no spaces) → builtin code. */
export const FUZZY_PHRASE_TO_CODE: Record<string, BuiltinErrorCode> = {
    unauthorized: BUILTIN_ERROR.UNAUTHORIZED,
    forbidden: BUILTIN_ERROR.FORBIDDEN,
    notfound: BUILTIN_ERROR.NOT_FOUND,
    serviceunavailable: BUILTIN_ERROR.SERVICE_UNAVAILABLE,
    badgateway: BUILTIN_ERROR.SERVICE_UNAVAILABLE,
    gatewaytimeout: BUILTIN_ERROR.SERVICE_UNAVAILABLE,
};
