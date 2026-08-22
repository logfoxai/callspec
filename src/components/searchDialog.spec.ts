import {test} from 'kizu';
import {
	isEditableSearchTarget,
	openPrimaryDocsSearch,
	shouldCloseOnOutsideClick,
	shouldCloseSearchOnEscape,
	shouldHandleGlobalSlash,
} from './searchDialog.js';

test('shouldHandleGlobalSlash opens only when idle and not typing in a field', (assert) => {
	const base = {
		key: '/',
		metaKey: false,
		ctrlKey: false,
		altKey: false,
		shiftKey: false,
		anySearchDialogOpen: false,
		targetIsEditable: false,
	};
	assert.equal(shouldHandleGlobalSlash(base), true);
	assert.equal(shouldHandleGlobalSlash({...base, anySearchDialogOpen: true}), false);
	assert.equal(shouldHandleGlobalSlash({...base, targetIsEditable: true}), false);
	assert.equal(shouldHandleGlobalSlash({...base, key: 'Escape'}), false);
	assert.equal(shouldHandleGlobalSlash({...base, metaKey: true}), false);
});

test('isEditableSearchTarget covers inputs, textareas, selects, and contenteditable', (assert) => {
	assert.equal(isEditableSearchTarget({tagName: 'INPUT', isContentEditable: false}), true);
	assert.equal(isEditableSearchTarget({tagName: 'TEXTAREA', isContentEditable: false}), true);
	assert.equal(isEditableSearchTarget({tagName: 'SELECT', isContentEditable: false}), true);
	assert.equal(isEditableSearchTarget({tagName: 'DIV', isContentEditable: true}), true);
	assert.equal(isEditableSearchTarget({tagName: 'BODY', isContentEditable: false}), false);
});

test('shouldCloseSearchOnEscape closes the whole dialog on first Escape', (assert) => {
	assert.equal(shouldCloseSearchOnEscape('Escape'), true);
	assert.equal(shouldCloseSearchOnEscape('Esc'), false);
	assert.equal(shouldCloseSearchOnEscape('/'), false);
});

test('shouldCloseOnOutsideClick is true for backdrop / outside the frame, and for links', (assert) => {
	assert.equal(
		shouldCloseOnOutsideClick({
			targetIsLink: false,
			targetInDocument: true,
			targetInDialogFrame: false,
		}),
		true,
		'click on backdrop closes',
	);
	assert.equal(
		shouldCloseOnOutsideClick({
			targetIsLink: true,
			targetInDocument: true,
			targetInDialogFrame: true,
		}),
		true,
		'result link click closes',
	);
	assert.equal(
		shouldCloseOnOutsideClick({
			targetIsLink: false,
			targetInDocument: true,
			targetInDialogFrame: true,
		}),
		false,
		'click inside the dialog stays open',
	);
});

test('openPrimaryDocsSearch clicks only the header search button', (assert) => {
	const clicks: string[] = [];
	const headerBtn = {click: (): void => { clicks.push('header'); }};
	const mobileBtn = {click: (): void => { clicks.push('mobile'); }};
	const root = {
		querySelector(selector: string): {click(): void} | null {
			if (selector === '[data-cs-docs-search-primary] [data-open-modal]') return headerBtn;
			if (selector === '[data-open-modal]') return mobileBtn;
			return null;
		},
	};
	assert.equal(openPrimaryDocsSearch(root), true);
	assert.equal(clicks, ['header']);
});
