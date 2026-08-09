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

/** Page title rows + nested result rows (in DOM order). */
export function collectResultRows(root: ParentNode): HTMLElement[] {
	return Array.from(
		root.querySelectorAll<HTMLElement>(
			'.pagefind-ui__result-title:not(:where(.pagefind-ui__result-nested *)), .pagefind-ui__result-nested',
		),
	);
}

/** Idle suggestion chips. */
export function collectSuggestionChips(root: ParentNode): HTMLElement[] {
	return Array.from(root.querySelectorAll<HTMLElement>('[data-cs-search-suggestion]'));
}

export function resultLinkForRow(row: HTMLElement): HTMLAnchorElement | null {
	return row.querySelector<HTMLAnchorElement>('a.pagefind-ui__result-link');
}
