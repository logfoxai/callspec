import {test} from 'kizu';
import {bindSearchClearRefocus} from './searchClearRefocus.js';

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
