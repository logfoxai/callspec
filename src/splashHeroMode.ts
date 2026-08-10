/**
 * Splash Hero is shared across Starlight splash pages (home + 404).
 * Only the homepage gets the marketing lead + pile graphic.
 *
 * Starlight normalizes the root `index` slug to `''` (empty string).
 */
export function shouldShowMarketingPile(entryId: string): boolean {
	return entryId === '' || entryId === 'index';
}
