/** Derive OpenAPI URL beside callspec.json (same directory). */
export function openApiPathFromSpecUrl(specUrl: string): string {

    if (/callspec\.json(?:\?.*)?$/i.test(specUrl)) {

        return specUrl.replace(/callspec\.json(?:\?.*)?$/i, 'openapi.json');

    }

    const trimmed = specUrl.replace(/\/+$/, '');
    const slash = trimmed.lastIndexOf('/');

    if (slash < 0) {

        return 'openapi.json';

    }

    return `${trimmed.slice(0, slash + 1)}openapi.json`;

}
