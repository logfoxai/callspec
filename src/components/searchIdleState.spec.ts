import {test} from 'kizu';
import {isSearchIdle} from './searchIdleState.js';

test('idle when search is ready and query is empty or shorter than 3 characters', (assert) => {
	assert.equal(isSearchIdle(true, true, ''), true);
	assert.equal(isSearchIdle(true, true, '   '), true);
	assert.equal(
		isSearchIdle(true, true, 'te'),
		true,
		'queries under 3 characters stay on idle chips',
	);
	assert.equal(
		isSearchIdle(true, false, 'te'),
		true,
		'short queries stay idle even if Pagefind left the drawer open',
	);
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
