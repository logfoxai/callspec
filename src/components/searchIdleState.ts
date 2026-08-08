/**
 * Pagefind keeps the results drawer hidden during debounce even after the
 * input has text. Treat that as “typing”, not idle — otherwise suggestion
 * chips stay visible under an active query.
 */
export function isSearchIdle(drawerHidden: boolean, query: string): boolean {
	return drawerHidden && query.trim().length === 0;
}
