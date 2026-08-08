import {test} from 'kizu';
import {isSearchIdle} from './searchIdleState.js';

test('idle only when search is ready, drawer is hidden, and query is empty', (assert) => {
	assert.equal(isSearchIdle(true, true, ''), true);
	assert.equal(isSearchIdle(true, true, '   '), true);
	assert.equal(
		isSearchIdle(true, true, 'mcp'),
		false,
		'typing during debounce is not idle',
	);
	assert.equal(isSearchIdle(true, false, ''), false);
	assert.equal(isSearchIdle(true, false, 'mcp'), false);
	assert.equal(
		isSearchIdle(false, true, ''),
		false,
		'Pagefind not ready yet — show loading, not idle chips',
	);
});
