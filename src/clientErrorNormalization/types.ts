import type {DomainErrorContract} from '../clientErrorDataValidation';

export const CLIENT_ERROR = {
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type WireRecord = Record<string, unknown>;

export type ResolveRouteClientErrorInput = {
    status: number
    body: unknown
    /** Route-declared domain codes from callspec.json (builtins are parsed separately). */
    allowedErrorCodes?: readonly string[]
    /** Per-code payload schemas — required to parse domain `{ error, data? }` responses. */
    domainErrors?: Readonly<Record<string, DomainErrorContract>>
    responseHeaders?: Headers
};

/** Options shared by JSON parsers for route-declared domain errors. */
export type RouteErrorParsingContext = Pick<
    ResolveRouteClientErrorInput,
    'allowedErrorCodes' | 'domainErrors'
>;
