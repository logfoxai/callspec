export type SlashKeyEvent = {
	key: string;
	metaKey: boolean;
	ctrlKey: boolean;
	altKey: boolean;
	shiftKey: false | boolean;
	anySearchDialogOpen: boolean;
	targetIsEditable: boolean;
};

export type EditableTarget = {
	tagName: string;
	isContentEditable: boolean;
};

export function isEditableSearchTarget(el: EditableTarget): boolean {
	const tag = el.tagName;
	return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/** `/` opens search. Ignore when a search dialog is already open or the user is typing. */
export function shouldHandleGlobalSlash(event: SlashKeyEvent): boolean {
	if (event.key !== '/') return false;
	if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return false;
	if (event.anySearchDialogOpen) return false;
	if (event.targetIsEditable) return false;
	return true;
}

/** First Escape closes the dialog — do not let Pagefind only clear the query. */
export function shouldCloseSearchOnEscape(key: string): boolean {
	return key === 'Escape';
}

export function shouldCloseOnOutsideClick(opts: {
	targetIsLink: boolean;
	targetInDocument: boolean;
	targetInDialogFrame: boolean;
}): boolean {
	if (opts.targetIsLink) return true;
	return opts.targetInDocument && !opts.targetInDialogFrame;
}

export type SearchOpenRoot = {
	querySelector(selector: string): {click(): void} | null;
};

/** Mobile drawer trigger opens the header dialog — never a second Pagefind UI. */
export function openPrimaryDocsSearch(root: SearchOpenRoot): boolean {
	const btn = root.querySelector('[data-cs-docs-search-primary] [data-open-modal]');
	if (!btn) return false;
	btn.click();
	return true;
}
