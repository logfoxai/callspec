import {test} from 'kizu';
import {
	activateSearchNavItem,
	applySelection,
	collectResultNavItems,
	collectResultRows,
	handleSearchKey,
	markAwaitingFreshResults,
	nextIndex,
	resolveKeyboardSelection,
	resultLinkForRow,
	scrollSearchSelectionIntoView,
	type KeyboardNavState,
} from './searchKeyboardNav.js';

test('nextIndex clamps without wrapping', (assert) => {
	assert.equal(nextIndex(0, -1, 3), 0);
	assert.equal(nextIndex(2, 1, 3), 2);
	assert.equal(nextIndex(1, 1, 3), 2);
	assert.equal(nextIndex(1, -1, 3), 0);
	assert.equal(nextIndex(0, 1, 0), -1, 'empty list stays unselected');
});

test('nextIndex from -1 enters at first or last', (assert) => {
	assert.equal(nextIndex(-1, 1, 4), 0);
	assert.equal(nextIndex(-1, -1, 4), 3);
});

test('applySelection sets data-cs-search-selected on one item', (assert) => {
	const items = [stubEl(), stubEl(), stubEl()];
	applySelection(items, 1);
	assert.equal(items[0]?.getAttribute('data-cs-search-selected'), null);
	assert.equal(items[1]?.getAttribute('data-cs-search-selected'), 'true');
	assert.equal(items[2]?.getAttribute('data-cs-search-selected'), null);

	applySelection(items, -1);
	assert.equal(items[1]?.getAttribute('data-cs-search-selected'), null);
});

test('handleSearchKey moves selection with arrows and activates on Enter', (assert) => {
	assert.equal(handleSearchKey('ArrowDown', -1, 3), {
		preventDefault: true,
		selectedIndex: 0,
		activate: false,
	});
	assert.equal(handleSearchKey('ArrowUp', -1, 3), {
		preventDefault: true,
		selectedIndex: 2,
		activate: false,
	});
	assert.equal(handleSearchKey('ArrowDown', 0, 3), {
		preventDefault: true,
		selectedIndex: 1,
		activate: false,
	});
	assert.equal(handleSearchKey('Enter', 1, 3), {
		preventDefault: true,
		selectedIndex: 1,
		activate: true,
	});
	assert.equal(handleSearchKey('Enter', -1, 3), {
		preventDefault: false,
		selectedIndex: -1,
		activate: false,
	});
	assert.equal(handleSearchKey('a', 1, 3), {
		preventDefault: false,
		selectedIndex: 1,
		activate: false,
	});
});

test('awaiting stays blocked until fingerprint changes or search cycle completes', (assert) => {
	const afterType = markAwaitingFreshResults({
		selectedIndex: 0,
		lastFingerprint: 'results:a',
		awaitingFreshResults: false,
		sawSearchingWhileAwaiting: false,
	});
	assert.equal(afterType.selectedIndex, -1);
	assert.equal(afterType.awaitingFreshResults, true);

	const stillStale = resolveKeyboardSelection(afterType, 'results', 'results:a', 2, false);
	assert.equal(stillStale.selectedIndex, -1);
	assert.equal(stillStale.awaitingFreshResults, true);

	const searching = resolveKeyboardSelection(stillStale, 'results', 'results:a', 2, true);
	assert.equal(searching.awaitingFreshResults, true);
	assert.equal(searching.sawSearchingWhileAwaiting, true);
	assert.equal(searching.selectedIndex, -1);

	const sameHits = resolveKeyboardSelection(searching, 'results', 'results:a', 2, false);
	assert.equal(sameHits.awaitingFreshResults, false);
	assert.equal(sameHits.selectedIndex, -1);

	const afterType2 = markAwaitingFreshResults(sameHits);
	const fresh = resolveKeyboardSelection(afterType2, 'results', 'results:b', 2, false);
	assert.equal(fresh.selectedIndex, -1);
	assert.equal(fresh.awaitingFreshResults, false);
});

test('fresh results stay unselected until arrow keys move selection', (assert) => {
	const state = markAwaitingFreshResults({
		selectedIndex: -1,
		lastFingerprint: '',
		awaitingFreshResults: false,
		sawSearchingWhileAwaiting: false,
	});
	const resolved = resolveKeyboardSelection(state, 'results', 'results:x', 5, false);
	assert.equal(resolved.selectedIndex, -1);
	assert.equal(handleSearchKey('ArrowDown', resolved.selectedIndex, 5).selectedIndex, 0);
});

test('hydration fingerprint changes keep the current selection', (assert) => {
	const state: KeyboardNavState = {
		selectedIndex: 1,
		lastFingerprint: 'results:a',
		awaitingFreshResults: false,
		sawSearchingWhileAwaiting: false,
		userMovedResults: true,
	};
	const hydrated = resolveKeyboardSelection(state, 'results', 'results:a\0b', 2, false);
	assert.equal(hydrated.selectedIndex, 1);
	assert.equal(hydrated.awaitingFreshResults, false);
});

test('scrollSearchSelectionIntoView resets drawer scroll for the first row', (assert) => {
	const scroller = {scrollTop: 240};
	const root = {
		querySelector(selector: string): {scrollTop: number} | null {
			return selector === '.pagefind-ui__results-area' ? scroller : null;
		},
	};
	const item = {
		scrollIntoView() {
			assert.fail('first row should reset drawer scroll instead of nearest');
		},
	};

	scrollSearchSelectionIntoView(root, 0, item as unknown as HTMLElement, 3);
	assert.equal(scroller.scrollTop, 0);
});

test('scrollSearchSelectionIntoView uses end alignment for the last item', (assert) => {
	const scroller = {scrollTop: 0};
	const root = {
		querySelector(): {scrollTop: number} {
			return scroller;
		},
	};
	let block: ScrollLogicalPosition | undefined;
	const item = {
		scrollIntoView(options?: ScrollIntoViewOptions) {
			block = options?.block;
		},
	};

	scrollSearchSelectionIntoView(root, 2, item as unknown as HTMLElement, 3);
	assert.equal(block, 'end');
});

test('scrollSearchSelectionIntoView uses nearest for middle rows', (assert) => {
	const scroller = {scrollTop: 0};
	const root = {
		querySelector(): {scrollTop: number} {
			return scroller;
		},
	};
	let scrolled = false;
	const item = {
		scrollIntoView(options?: ScrollIntoViewOptions) {
			scrolled = true;
			assert.equal(options?.block, 'nearest');
		},
	};

	scrollSearchSelectionIntoView(root, 2, item as unknown as HTMLElement, 5);
	assert.equal(scrolled, true);
	assert.equal(scroller.scrollTop, 0);
});

test('collectResultNavItems appends load more after result rows', (assert) => {
	const loadMore = {
		classList: {contains: (c: string) => c === 'pagefind-ui__button'},
		closest: () => null,
		click() {},
	};
	const root = {
		querySelector(selector: string): typeof loadMore | null {
			if (selector === '.pagefind-ui__button') return loadMore;
			return null;
		},
		querySelectorAll(selector: string): HTMLElement[] {
			if (selector.includes('pagefind-ui__result-title')) {
				return [stubRow('a'), stubRow('b')] as unknown as HTMLElement[];
			}
			return [];
		},
	};
	const items = collectResultNavItems(root as unknown as ParentNode);
	assert.equal(items.length, 3);
	assert.equal(items[2], loadMore);
});

test('handleSearchKey reaches load more after the last result row', (assert) => {
	assert.equal(handleSearchKey('ArrowDown', 1, 3), {
		preventDefault: true,
		selectedIndex: 2,
		activate: false,
	});
});

test('activateSearchNavItem clicks load more', (assert) => {
	let clicked = false;
	const button = {
		classList: {contains: (c: string) => c === 'pagefind-ui__button'},
		click() {
			clicked = true;
		},
	};
	activateSearchNavItem(button as unknown as HTMLElement);
	assert.equal(clicked, true);
});

function stubRow(href: string): {
	querySelector(selector: string): {href: string} | null;
} {
	return {
		querySelector(selector: string) {
			return selector === 'a.pagefind-ui__result-link' ? {href} : null;
		},
	};
}

function stubEl(): {
	setAttribute(name: string, value: string): void;
	removeAttribute(name: string): void;
	getAttribute(name: string): string | null;
} {
	const attrs = new Map<string, string>();
	return {
		setAttribute(name: string, value: string): void {
			attrs.set(name, value);
		},
		removeAttribute(name: string): void {
			attrs.delete(name);
		},
		getAttribute(name: string): string | null {
			return attrs.has(name) ? (attrs.get(name) ?? null) : null;
		},
	};
}

test('collectResultRows skips rows inside stale snapshot hosts', (assert) => {
	const live = stubEl();
	live.className = 'pagefind-ui__result-title';
	const liveLink = {getAttribute: () => '/live'} as HTMLAnchorElement;
	live.querySelector = (selector: string) =>
		selector === 'a.pagefind-ui__result-link' ? liveLink : null;

	const staleRow = stubEl();
	staleRow.className = 'pagefind-ui__result-nested';
	const staleLink = {getAttribute: () => '/stale'} as HTMLAnchorElement;
	staleRow.querySelector = (selector: string) =>
		selector === 'a.pagefind-ui__result-link' ? staleLink : null;
	staleRow.closest = (selector: string) =>
		selector === '[data-cs-search-stale]' ? ({} as Element) : null;

	live.closest = () => null;

	const root = {
		querySelectorAll(selector: string): HTMLElement[] {
			if (selector.includes('pagefind-ui__result-title')) return [live];
			if (selector.includes('pagefind-ui__result-nested')) return [staleRow];
			return [];
		},
	} as unknown as ParentNode;

	const rows = collectResultRows(root);
	assert.equal(rows.length, 1);
	assert.equal(resultLinkForRow(rows[0]!)?.getAttribute('href'), '/live');
});
