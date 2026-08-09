import {test} from 'kizu';
import {
	applySelection,
	handleSearchKey,
	nextIndex,
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
