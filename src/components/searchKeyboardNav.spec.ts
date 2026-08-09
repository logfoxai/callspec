import {test} from 'kizu';
import {
	applySelection,
	handleSearchKey,
	markAwaitingFreshResults,
	nextIndex,
	resolveKeyboardSelection,
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
	assert.equal(sameHits.selectedIndex, 0);

	const afterType2 = markAwaitingFreshResults(sameHits);
	const fresh = resolveKeyboardSelection(afterType2, 'results', 'results:b', 2, false);
	assert.equal(fresh.selectedIndex, 0);
	assert.equal(fresh.awaitingFreshResults, false);
});

test('hydration fingerprint changes keep the current selection', (assert) => {
	const state: KeyboardNavState = {
		selectedIndex: 1,
		lastFingerprint: 'results:a',
		awaitingFreshResults: false,
		sawSearchingWhileAwaiting: false,
	};
	const hydrated = resolveKeyboardSelection(state, 'results', 'results:a\0b', 2, false);
	assert.equal(hydrated.selectedIndex, 1);
	assert.equal(hydrated.awaitingFreshResults, false);
});

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
