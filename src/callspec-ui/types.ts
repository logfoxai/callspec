import type {RouteAccess} from '../types';

export type CallspecUiRoute = {
    name: string
    summary: string
    description: string
    tags: string[]
    access: RouteAccess
    mcp: boolean
    inputSchema: unknown
    outputSchema: unknown
};

export type CallspecUiSpec = {
    title: string
    version: string
    routes: CallspecUiRoute[]
};
