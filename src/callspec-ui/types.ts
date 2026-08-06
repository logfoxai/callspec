import type {RouteAuth} from '../types';

export type CallspecUiRoute = {
    name: string
    summary: string
    description: string
    tags: string[]
    auth: RouteAuth
    mcp: boolean
    inputSchema: unknown
    outputSchema: unknown
};

export type CallspecUiSpec = {
    title: string
    version: string
    routes: CallspecUiRoute[]
};
