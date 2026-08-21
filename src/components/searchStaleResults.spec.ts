import {test} from 'kizu';
import {
	beginStaleResultsHold,
	INITIAL_STALE_RESULTS_STATE,
	resolveStaleResultsHold,
	shouldDiscardStaleResults,
	shouldShowStaleResults,
} from './searchStaleResults.js';

test('shouldShowStaleResults only while holding a snapshot and live results are gone', (assert) => {
	assert.equal(shouldShowStaleResults(true, false, true, true, false, false), true);
	assert.equal(shouldShowStaleResults(true, false, false, true, false, false), false);
	assert.equal(shouldShowStaleResults(true, true, true, true, false, false), false);
	assert.equal(shouldShowStaleResults(false, false, true, true, false, false), false);
	assert.equal(shouldShowStaleResults(true, false, true, false, false, false), false);
	assert.equal(shouldShowStaleResults(true, false, true, true, true, false), false);
	assert.equal(shouldShowStaleResults(true, false, true, true, false, true), false);
});

test('shouldDiscardStaleResults when the field resets or search settles empty', (assert) => {
	assert.equal(shouldDiscardStaleResults(false, false, true), false);
	assert.equal(shouldDiscardStaleResults(true, false, true), true);
	assert.equal(shouldDiscardStaleResults(false, true, true), true);
	assert.equal(shouldDiscardStaleResults(false, false, false), true);
});

test('beginStaleResultsHold records the live fingerprint', (assert) => {
	const empty = beginStaleResultsHold(INITIAL_STALE_RESULTS_STATE, '');
	assert.equal(empty.holding, false);

	const held = beginStaleResultsHold(INITIAL_STALE_RESULTS_STATE, 'a\0b');
	assert.equal(held.holding, true);
	assert.equal(held.capturedFingerprint, 'a\0b');
	assert.equal(held.sawSearchingWhileHolding, false);
});

test('resolveStaleResultsHold keeps the snapshot until fresh hits land', (assert) => {
	const holding = beginStaleResultsHold(INITIAL_STALE_RESULTS_STATE, 'a\0b');

	const stillLive = resolveStaleResultsHold(holding, true, 'a\0b', false, false);
	assert.equal(stillLive.holding, true);
	assert.equal(stillLive.capturedFingerprint, 'a\0b');

	const clearedLive = resolveStaleResultsHold(holding, false, '', false, false);
	assert.equal(clearedLive.holding, true);
	assert.equal(clearedLive.capturedFingerprint, 'a\0b');

	const replaced = resolveStaleResultsHold(holding, true, 'c', false, false);
	assert.equal(replaced.holding, false);

	const settled = resolveStaleResultsHold(
		{...holding, sawSearchingWhileHolding: true},
		true,
		'a\0b',
		false,
		false,
	);
	assert.equal(settled.holding, false);

	const discarded = resolveStaleResultsHold(holding, false, '', false, true);
	assert.equal(discarded.holding, false);
});
