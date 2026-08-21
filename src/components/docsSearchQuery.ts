/** Docs search does not query Pagefind until the trimmed query is at least this long. */
export const DOCS_SEARCH_MIN_QUERY_LENGTH = 3;

export function isDocsSearchQueryReady(query: string): boolean {
	return query.trim().length >= DOCS_SEARCH_MIN_QUERY_LENGTH;
}
