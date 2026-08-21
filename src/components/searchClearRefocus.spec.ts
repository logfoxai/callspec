import {test} from 'kizu';
import {bindSearchClearRefocus, scheduleSearchInputFocus} from './searchClearRefocus.js';

function stubRoot(input: StubInput, clear: StubClear): Element {
	return {
		querySelector(selector: string): Element | null {
			if (selector === '.pagefind-ui__search-input') return input as unknown as Element;
			if (selector === '.pagefind-ui__search-clear') return clear as unknown as Element;
			return null;
		},
	} as unknown as Element;
}

type StubInput = {
	focusCalls: number;
	focus(): void;
};

type StubClear = {
	dataset: Record<string, string>;
	listeners: Array<() => void>;
	addEventListener(_type: string, listener: () => void): void;
	click(): void;
};

function stubInput(): StubInput {
	return {
		focusCalls: 0,
		focus(): void {
			this.focusCalls += 1;
		},
	};
}

function stubClear(): StubClear {
	const clear: StubClear = {
		dataset: {},
		listeners: [],
		addEventListener(_type, listener) {
			this.listeners.push(listener);
		},
		click() {
			for (const listener of this.listeners) listener();
		},
	};
	return clear;
}

test('bindSearchClearRefocus focuses the search input after clear is clicked', (assert) => {
	const input = stubInput();
	const clear = stubClear();
	bindSearchClearRefocus(stubRoot(input, clear));

	clear.click();

	assert.equal(input.focusCalls, 0);

	return new Promise<void>((resolve, reject) => {
		queueMicrotask(() => {
			try {
				assert.equal(input.focusCalls >= 1, true);
				resolve();
			} catch (err) {
				reject(err);
			}
		});
	});
});

test('bindSearchClearRefocus is idempotent on the clear button', (assert) => {
	const input = stubInput();
	const clear = stubClear();
	const root = stubRoot(input, clear);

	bindSearchClearRefocus(root);
	bindSearchClearRefocus(root);

	assert.equal(clear.listeners.length, 1);

	clear.click();

	return new Promise<void>((resolve, reject) => {
		queueMicrotask(() => {
			try {
				assert.equal(input.focusCalls >= 1, true);
				resolve();
			} catch (err) {
				reject(err);
			}
		});
	});
});

test('scheduleSearchInputFocus runs focus after microtask and rAF', (assert) => {
	const input = stubInput();
	const phases: string[] = [];

	scheduleSearchInputFocus(input as unknown as HTMLInputElement, () => {
		phases.push('focus');
	});

	phases.push('sync');
	assert.equal(phases.length, 1);
	assert.equal(phases[0], 'sync');

	return new Promise<void>((resolve, reject) => {
		queueMicrotask(() => {
			setTimeout(() => {
				try {
					assert.equal(phases.filter((p) => p === 'focus').length, 2);
					resolve();
				} catch (err) {
					reject(err);
				}
			}, 0);
		});
	});
});
