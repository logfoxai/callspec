export const CALLSPEC_DOCUMENT_VERSION = '1.0' as const;

export type JsonSchema = Record<string, unknown>;

type CallspecDocumentRouteError = {
    status: number
    data?: JsonSchema
};

export type CallspecDocumentRoute = {
    name: string
    path: string
    method: 'POST'
    summary: string
    description: string
    tags: string[]
    access: 'public' | 'private'
    input: JsonSchema
    output: JsonSchema
    errors?: Record<string, CallspecDocumentRouteError>
    mcp: {
        enabled: boolean
    }
};

export type CallspecDocument = {
    callspec: typeof CALLSPEC_DOCUMENT_VERSION
    info: {
        title: string
        version: string
        description?: string
    }
    exports?: Record<string, JsonSchema>
    routes: Record<string, CallspecDocumentRoute>
};

export class CallspecDocumentError extends Error {

    constructor(message: string) {

        super(message);
        this.name = 'CallspecDocumentError';

    }

}
