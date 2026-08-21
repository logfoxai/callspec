import {test} from 'kizu';
import {
	INITIAL_SEARCH_PENDING_DELAY_STATE,
	resolveSearchPendingDelayState,
} from './searchPendingDelay.js';

test('resolveSearchPendingDelayState hides immediately when search settles', (assert) => {
	const armed = resolveSearchPendingDelayState(INITIAL_SEARCH_PENDING_DELAY_STATE, true, false);
	assert.equal(armed.armed, true);
	assert.equal(armed.visible, false);

	const visible = resolveSearchPendingDelayState(armed, true, true);
	assert.equal(visible.visible, true);

	const hidden = resolveSearchPendingDelayState(visible, false, false);
	assert.equal(hidden, INITIAL_SEARCH_PENDING_DELAY_STATE);
});

test('resolveSearchPendingDelayState stays visible once shown until cleared', (assert) => {
	const visible = {armed: false, visible: true};
	const still = resolveSearchPendingDelayState(visible, true, false);
	assert.equal(still.visible, true);
});
