/**
 * Pagefind keeps the results drawer hidden during debounce even after the
 * input has text. Treat that as “typing”, not idle — otherwise suggestion
 * chips stay visible under an active query.
 *
 * Also require searchReady so the idle panel never replaces the loading
 * skeleton before Pagefind mounts. Queries shorter than 3 characters stay
 * idle — Pagefind does not search until then.
 */
import {DOCS_SEARCH_MIN_QUERY_LENGTH} from './docsSearchQuery.js';

export function isSearchIdle(
	searchReady: boolean,
	drawerHidden: boolean,
	query: string,
): boolean {
	if (!searchReady) return false;

	const trimmed = query.trim();
	if (trimmed.length === 0) return drawerHidden;
	if (trimmed.length < DOCS_SEARCH_MIN_QUERY_LENGTH) return true;

	return false;
}
