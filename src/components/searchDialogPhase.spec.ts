import {test} from 'kizu';
import {isSearchActivePhase, shouldShowSearchPending} from './searchDialogPhase.js';

test('isSearchActivePhase covers in-flight and results phases', (assert) => {
	assert.equal(isSearchActivePhase('querying'), true);
	assert.equal(isSearchActivePhase('searching'), true);
	assert.equal(isSearchActivePhase('results'), true);
	assert.equal(isSearchActivePhase('empty'), true);
	assert.equal(isSearchActivePhase('idle'), false);
	assert.equal(isSearchActivePhase('loading'), false);
});

test('shouldShowSearchPending only while searching with no settled results', (assert) => {
	assert.equal(shouldShowSearchPending('searching', false, false), true);
	assert.equal(shouldShowSearchPending('searching', false, false, false), true);
	assert.equal(shouldShowSearchPending('querying', false, false), false);
	assert.equal(shouldShowSearchPending('searching', true, false), false);
	assert.equal(shouldShowSearchPending('searching', false, true), false);
	assert.equal(shouldShowSearchPending('results', false, false), false);
	assert.equal(shouldShowSearchPending('searching', false, false, true), false);
});
