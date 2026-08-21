/** Wait before showing the skeleton so fast searches do not flash placeholder chrome. */
export const SEARCH_PENDING_SHOW_DELAY_MS = 180;

export type SearchPendingDelayState = {
	armed: boolean;
	visible: boolean;
};

export const INITIAL_SEARCH_PENDING_DELAY_STATE: SearchPendingDelayState = {
	armed: false,
	visible: false,
};

/** Pure delay gate — `delayElapsed` is true once the timer fires. */
export function resolveSearchPendingDelayState(
	state: SearchPendingDelayState,
	wantShow: boolean,
	delayElapsed: boolean,
): SearchPendingDelayState {
	if (!wantShow) {
		return INITIAL_SEARCH_PENDING_DELAY_STATE;
	}
	if (state.visible) {
		return state;
	}
	if (delayElapsed) {
		return {armed: false, visible: true};
	}
	return {armed: true, visible: false};
}

export function isSearchPendingVisible(state: SearchPendingDelayState): boolean {
	return state.visible;
}
