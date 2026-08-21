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

test('shouldShowSearchPending only while the drawer is hidden', (assert) => {
	assert.equal(shouldShowSearchPending('querying', false, false, true), true);
	assert.equal(shouldShowSearchPending('searching', false, false, true), true);
	assert.equal(shouldShowSearchPending('searching', false, false, false), false);
	assert.equal(shouldShowSearchPending('searching', true, false, true), false);
	assert.equal(shouldShowSearchPending('querying', false, true, true), false);
	assert.equal(shouldShowSearchPending('results', false, false, true), false);
	assert.equal(shouldShowSearchPending('searching', false, false, true, true), false);
});
