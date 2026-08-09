import type {RouteAuth} from '../types';
import type {JsonSchema} from '../callspecDocumentTypes';

export type CallspecUiRoute = {
    name: string
    summary: string
    description: string
    tags: string[]
    auth: RouteAuth
    mcp: boolean
    inputSchema: unknown
    outputSchema: unknown
    errors?: Record<string, {
        status: number
        data?: JsonSchema
        dataRequired?: boolean
    }>
};

export type CallspecUiSpec = {
    title: string
    version: string
    routes: CallspecUiRoute[]
};
