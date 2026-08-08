import {test} from 'kizu';
import {isSearchIdle} from './searchIdleState.js';

test('idle only when drawer is hidden and the query is empty', (assert) => {
	assert.equal(isSearchIdle(true, ''), true);
	assert.equal(isSearchIdle(true, '   '), true);
	assert.equal(isSearchIdle(true, 'mcp'), false, 'typing during debounce is not idle');
	assert.equal(isSearchIdle(false, ''), false);
	assert.equal(isSearchIdle(false, 'mcp'), false);
});
