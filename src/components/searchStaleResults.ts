export type StaleResultsState = {
	/** Snapshot kept until Pagefind replaces the live list. */
	holding: boolean;
	/** Live-result href fingerprint when the snapshot was taken. */
	capturedFingerprint: string;
	/** True once Pagefind shows a searching state while holding. */
	sawSearchingWhileHolding: boolean;
};

export const INITIAL_STALE_RESULTS_STATE: StaleResultsState = {
	holding: false,
	capturedFingerprint: '',
	sawSearchingWhileHolding: false,
};

/** Show the last snapshot while a new query is in flight and Pagefind cleared the live list. */
export function shouldShowStaleResults(
	hasStaleSnapshot: boolean,
	hasLiveResults: boolean,
	holding: boolean,
	queryReady: boolean,
	idle: boolean,
	zeroResults: boolean,
): boolean {
	if (!hasStaleSnapshot || !holding || hasLiveResults || !queryReady || idle || zeroResults) {
		return false;
	}
	return true;
}

export function liveResultsFingerprint(root: Element): string {
	const rows = root.querySelectorAll('.pagefind-ui__results > .pagefind-ui__result');
	return Array.from(rows)
		.map((row) => row.querySelector('a.pagefind-ui__result-link')?.getAttribute('href') ?? '')
		.join('\0');
}

/** Drop the snapshot when the field resets or a completed search settles. */
export function shouldDiscardStaleResults(
	idle: boolean,
	zeroResults: boolean,
	queryReady: boolean,
): boolean {
	return idle || zeroResults || !queryReady;
}

export function beginStaleResultsHold(
	state: StaleResultsState,
	liveFingerprint: string,
): StaleResultsState {
	if (!liveFingerprint) return state;
	return {
		holding: true,
		capturedFingerprint: liveFingerprint,
		sawSearchingWhileHolding: false,
	};
}

export function resolveStaleResultsHold(
	state: StaleResultsState,
	hasLiveResults: boolean,
	liveFingerprint: string,
	isSearching: boolean,
	discard: boolean,
): StaleResultsState {
	if (!state.holding || discard) return INITIAL_STALE_RESULTS_STATE;

	const sawSearching =
		state.sawSearchingWhileHolding || (state.holding && isSearching);

	if (!hasLiveResults) {
		return {...state, sawSearchingWhileHolding: sawSearching};
	}

	if (liveFingerprint !== state.capturedFingerprint) return INITIAL_STALE_RESULTS_STATE;

	if (sawSearching && !isSearching) return INITIAL_STALE_RESULTS_STATE;

	return {...state, sawSearchingWhileHolding: sawSearching};
}

/** Mount outside Pagefind’s Svelte-managed results block so loading toggles do not drop it. */
export function ensureStaleResultsHost(root: Element): HTMLElement | null {
	const drawer = root.querySelector('.pagefind-ui__drawer');
	if (!drawer) return null;

	const existing = drawer.querySelector<HTMLElement>('[data-cs-search-stale]');
	if (existing) return existing;

	const host = document.createElement('div');
	host.dataset.csSearchStale = '';
	host.hidden = true;
	drawer.insertBefore(host, drawer.firstChild);
	return host;
}

export function captureStaleResults(root: Element): boolean {
	const results = root.querySelector('.pagefind-ui__results');
	if (!results?.querySelector('.pagefind-ui__result')) return false;

	const host = ensureStaleResultsHost(root);
	if (!host) return false;

	host.replaceChildren(results.cloneNode(true));
	return true;
}

export function clearStaleResults(root: Element): void {
	const host = root.querySelector<HTMLElement>('[data-cs-search-stale]');
	if (!host) return;
	host.replaceChildren();
	host.hidden = true;
}

export function syncStaleResults(root: Element, show: boolean, discard: boolean): void {
	const host = root.querySelector<HTMLElement>('[data-cs-search-stale]');
	if (!host) return;

	if (discard) {
		host.replaceChildren();
		host.hidden = true;
		return;
	}

	host.hidden = !show || host.childElementCount === 0;
}
