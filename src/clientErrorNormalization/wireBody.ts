import type {WireRecord} from './types';

export function isWireRecord(body: unknown): body is WireRecord {

    return typeof body === 'object' && body !== null && !Array.isArray(body);

}

/** `{ error: "CODE", ... }` — used to distinguish undeclared wire JSON from heuristic matches. */
export function hasExplicitCallspecErrorField(body: unknown): boolean {

    return isWireRecord(body) && typeof body.error === 'string';

}

export function responseHeadersRecord(headers: Headers): Record<string, string> {

    const record: Record<string, string> = {};

    headers.forEach((value, key) => {

        record[key] = value;

    });

    return record;

}

/** Strip HTML tags before phrase / fuzzy matching (not applied to UNKNOWN_ERROR bodies). */
export function stripHtmlForMatching(text: string): string {

    return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

}

export function normalizeFuzzyKey(text: string): string {

    return stripHtmlForMatching(text)
        .toLowerCase()
        .replace(/[\s_-]+/g, '');

}

/** Extract plain text from a string body or `{ error | message }` object for heuristic matching. */
export function bodyTextForMatching(body: unknown): string | undefined {

    if (typeof body === 'string') {

        return body;

    }

    if (!isWireRecord(body)) {

        return undefined;

    }

    if (typeof body.error === 'string') {

        return body.error;

    }

    if (typeof body.message === 'string') {

        return body.message;

    }

    return undefined;

}
