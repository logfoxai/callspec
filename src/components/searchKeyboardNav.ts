/** Attribute used for keyboard-selected search rows / idle chips. */
const SEARCH_SELECTED_ATTR = 'data-cs-search-selected';

export type SelectableItem = {
	setAttribute(name: string, value: string): void;
	removeAttribute(name: string): void;
};

export type SearchKeyResult = {
	preventDefault: boolean;
	selectedIndex: number;
	activate: boolean;
};

/**
 * Clamp selection within `[0, length)`. From `-1`, ↓ → first, ↑ → last.
 * Empty list always returns `-1`.
 */
export function nextIndex(current: number, delta: number, length: number): number {
	if (length <= 0) return -1;
	if (current < 0) return delta > 0 ? 0 : length - 1;
	const next = current + delta;
	if (next < 0) return 0;
	if (next >= length) return length - 1;
	return next;
}

/** Mark exactly one item as selected (or none when index is out of range). */
export function applySelection(items: SelectableItem[], index: number): void {
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (!item) continue;
		if (i === index) item.setAttribute(SEARCH_SELECTED_ATTR, 'true');
		else item.removeAttribute(SEARCH_SELECTED_ATTR);
	}
}

export function handleSearchKey(
	key: string,
	selectedIndex: number,
	itemCount: number,
): SearchKeyResult {
	if (key === 'ArrowDown') {
		return {
			preventDefault: itemCount > 0,
			selectedIndex: nextIndex(selectedIndex, 1, itemCount),
			activate: false,
		};
	}
	if (key === 'ArrowUp') {
		return {
			preventDefault: itemCount > 0,
			selectedIndex: nextIndex(selectedIndex, -1, itemCount),
			activate: false,
		};
	}
	if (key === 'Enter') {
		const canActivate = selectedIndex >= 0 && selectedIndex < itemCount;
		return {
			preventDefault: canActivate,
			selectedIndex,
			activate: canActivate,
		};
	}
	return {preventDefault: false, selectedIndex, activate: false};
}

/** Page title / nested rows that already have a navigable link (skip placeholders). */
export function collectResultRows(root: ParentNode): HTMLElement[] {
	return Array.from(
		root.querySelectorAll<HTMLElement>(
			'.pagefind-ui__result-title:not(:where(.pagefind-ui__result-nested *)), .pagefind-ui__result-nested',
		),
	).filter((row) => resultLinkForRow(row) !== null);
}

/** Idle suggestion chips. */
export function collectSuggestionChips(root: ParentNode): HTMLElement[] {
	return Array.from(root.querySelectorAll<HTMLElement>('[data-cs-search-suggestion]'));
}

export function resultLinkForRow(row: HTMLElement): HTMLAnchorElement | null {
	return row.querySelector<HTMLAnchorElement>('a.pagefind-ui__result-link');
}

export type KeyboardNavMode = 'idle' | 'results' | 'other';

export type KeyboardNavState = {
	selectedIndex: number;
	lastFingerprint: string;
	/** True after the query changes until fresh results are accepted. */
	awaitingFreshResults: boolean;
	/** True if Pagefind showed a searching state while awaiting. */
	sawSearchingWhileAwaiting: boolean;
};

export function markAwaitingFreshResults(state: KeyboardNavState): KeyboardNavState {
	return {
		...state,
		awaitingFreshResults: true,
		selectedIndex: -1,
		sawSearchingWhileAwaiting: false,
	};
}

/**
 * Updates selection when the dialog mode / result list fingerprint changes.
 * While awaiting, selection stays cleared until either the href fingerprint changes
 * or a searching→idle cycle completes (same hits after an edit).
 */
export function resolveKeyboardSelection(
	state: KeyboardNavState,
	mode: KeyboardNavMode,
	fingerprint: string,
	itemCount: number,
	isSearching: boolean,
): KeyboardNavState {
	if (mode === 'other') {
		return {
			selectedIndex: -1,
			lastFingerprint: fingerprint,
			awaitingFreshResults: false,
			sawSearchingWhileAwaiting: false,
		};
	}

	if (mode === 'idle') {
		if (fingerprint !== state.lastFingerprint) {
			return {
				selectedIndex: -1,
				lastFingerprint: fingerprint,
				awaitingFreshResults: false,
				sawSearchingWhileAwaiting: false,
			};
		}
		return {
			...state,
			awaitingFreshResults: false,
			sawSearchingWhileAwaiting: false,
			selectedIndex: clampIndex(state.selectedIndex, itemCount),
		};
	}

	const sawSearching =
		state.sawSearchingWhileAwaiting || (state.awaitingFreshResults && isSearching);

	// results (including in-flight querying, which still uses this mode)
	if (fingerprint !== state.lastFingerprint) {
		if (state.awaitingFreshResults) {
			return {
				selectedIndex: itemCount > 0 ? 0 : -1,
				lastFingerprint: fingerprint,
				awaitingFreshResults: false,
				sawSearchingWhileAwaiting: false,
			};
		}
		let selectedIndex = state.selectedIndex;
		if (selectedIndex < 0 && itemCount > 0) selectedIndex = 0;
		else selectedIndex = clampIndex(selectedIndex, itemCount);
		return {
			selectedIndex,
			lastFingerprint: fingerprint,
			awaitingFreshResults: false,
			sawSearchingWhileAwaiting: false,
		};
	}

	if (state.awaitingFreshResults) {
		// Same hrefs after a completed search cycle → accept (same-hit query edit).
		if (sawSearching && !isSearching) {
			return {
				selectedIndex: itemCount > 0 ? 0 : -1,
				lastFingerprint: fingerprint,
				awaitingFreshResults: false,
				sawSearchingWhileAwaiting: false,
			};
		}
		return {
			...state,
			selectedIndex: -1,
			sawSearchingWhileAwaiting: sawSearching,
		};
	}

	return {
		...state,
		selectedIndex: clampIndex(state.selectedIndex, itemCount),
		sawSearchingWhileAwaiting: false,
	};
}

function clampIndex(selectedIndex: number, itemCount: number): number {
	if (itemCount <= 0) return -1;
	if (selectedIndex < 0) return selectedIndex;
	if (selectedIndex >= itemCount) return itemCount - 1;
	return selectedIndex;
}
