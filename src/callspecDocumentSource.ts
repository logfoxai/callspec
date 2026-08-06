import fs from 'fs';
import path from 'path';
import {CallspecDocumentError} from './callspecDocument';

export const CALLSPEC_JSON_PATH = '/callspec.json';
export const OPENAPI_JSON_PATH = '/openapi.json';
export const DOCS_UI_PATH = '/docs';

const CALLSPEC_JSON_FILE = 'callspec.json';
const OPENAPI_JSON_FILE = 'openapi.json';

function endsWithDocumentPath(source: string, documentPath: string): boolean {

    const fileName = documentPath.replace(/^\//, '');
    const normalized = source.replace(/\\/g, '/').split('?')[0] ?? source;

    return normalized.endsWith(`/${fileName}`) || normalized === fileName;

}

function resolveHttpDocumentSource(source: string, documentPath: string): string {

    if (endsWithDocumentPath(source, documentPath)) {

        return source;

    }

    const url = new URL(source);
    url.pathname = `${url.pathname.replace(/\/$/, '')}${documentPath}`;

    return url.toString();

}

function resolveFileDocumentSource(source: string, fileName: string): string {

    if (endsWithDocumentPath(source, `/${fileName}`)) {

        return path.resolve(source);

    }

    const resolved = path.resolve(source);

    if (fs.existsSync(resolved)) {

        if (fs.statSync(resolved).isDirectory()) {

            return path.join(resolved, fileName);

        }

        return resolved;

    }

    if (source.endsWith('.json') && !endsWithDocumentPath(source, `/${fileName}`)) {

        return resolved;

    }

    return path.join(resolved, fileName);

}

export function resolveCallspecDocumentSource(source: string): string {

    if (/^https?:\/\//i.test(source)) {

        return resolveHttpDocumentSource(source, CALLSPEC_JSON_PATH);

    }

    return resolveFileDocumentSource(source, CALLSPEC_JSON_FILE);

}

export function resolveOpenApiDocumentSource(source: string): string {

    if (/^https?:\/\//i.test(source)) {

        return resolveHttpDocumentSource(source, OPENAPI_JSON_PATH);

    }

    return resolveFileDocumentSource(source, OPENAPI_JSON_FILE);

}

export async function loadCallspecDocument(source: string): Promise<unknown> {

    const resolvedSource = resolveCallspecDocumentSource(source);

    if (/^https?:\/\//i.test(resolvedSource)) {

        const resp = await fetch(resolvedSource);

        if (!resp.ok) {

            throw new CallspecDocumentError(
                `Failed to fetch Callspec document (${resp.status} ${resp.statusText})`,
            );

        }

        return resp.json();

    }

    if (!fs.existsSync(resolvedSource)) {

        throw new CallspecDocumentError(`Callspec document not found: ${resolvedSource}`);

    }

    const raw = fs.readFileSync(resolvedSource, 'utf8');

    try {

        return JSON.parse(raw);

    } catch {

        throw new CallspecDocumentError(`Invalid JSON in Callspec document: ${resolvedSource}`);

    }

}
