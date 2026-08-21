/** Dialog phases where a query is in flight or showing hits. */
export const SEARCH_ACTIVE_PHASES = ['querying', 'searching', 'results', 'empty'] as const;

export type SearchActivePhase = (typeof SEARCH_ACTIVE_PHASES)[number];

export function isSearchActivePhase(phase: string): phase is SearchActivePhase {
	return (SEARCH_ACTIVE_PHASES as readonly string[]).includes(phase);
}

/** @deprecated Use isSearchActivePhase — expanded layout is tied to dialog[open] in CSS. */
export function isSearchExpandedPhase(phase: string): phase is SearchActivePhase {
	return isSearchActivePhase(phase);
}

/** Skeleton below the input while Pagefind’s drawer is still closed (debounce / pre-drawer). */
export function shouldShowSearchPending(
	phase: string,
	hasResults: boolean,
	zeroResults: boolean,
	drawerHidden: boolean,
	holdingStale = false,
): boolean {
	if (hasResults || zeroResults || !drawerHidden || holdingStale) return false;
	return phase === 'querying' || phase === 'searching';
}
