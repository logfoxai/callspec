/**
 * Pagefind keeps the results drawer hidden during debounce even after the
 * input has text. Treat that as “typing”, not idle — otherwise suggestion
 * chips stay visible under an active query.
 *
 * Also require searchReady so the idle panel never replaces the loading
 * skeleton before Pagefind mounts.
 */
export function isSearchIdle(
	searchReady: boolean,
	drawerHidden: boolean,
	query: string,
): boolean {
	return searchReady && drawerHidden && query.trim().length === 0;
}
