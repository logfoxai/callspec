/** Pagefind clears the query and blurs the input — put focus back for keyboard flow. */
function scheduleNextFrame(callback: () => void): void {
	if (typeof requestAnimationFrame === 'function') {
		requestAnimationFrame(callback);
		return;
	}
	setTimeout(callback, 0);
}

export function scheduleSearchInputFocus(input: HTMLInputElement, focus: (el: HTMLInputElement) => void): void {
	queueMicrotask(() => {
		focus(input);
		scheduleNextFrame(() => focus(input));
	});
}

export function bindSearchClearRefocus(
	root: Element,
	focus: (input: HTMLInputElement) => void = (input) => input.focus(),
): void {
	const clear = root.querySelector<HTMLButtonElement>('.pagefind-ui__search-clear');
	const input = root.querySelector<HTMLInputElement>('.pagefind-ui__search-input');
	if (!clear || !input || clear.dataset.csSearchClearBound === '1') return;

	clear.dataset.csSearchClearBound = '1';
	clear.addEventListener('click', () => {
		scheduleSearchInputFocus(input, focus);
	});
}
