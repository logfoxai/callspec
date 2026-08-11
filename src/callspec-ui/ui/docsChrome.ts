import type {CallspecUiNotice} from '../../types';
import {themeMoonIcon, themeSunIcon} from './icons';
import type {Theme} from './theme';

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

}

/** Starlight magnifier icon (filled) — matches docs site search trigger. */
function searchMagnifierIcon(): string {

    return [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">',
        '<path d="M21.71 20.29 18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a.999.999 0 0 0 1.42 0 1 1 0 0 0 0-1.39ZM11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"/>',
        '</svg>',
    ].join('');

}

type DocsSearchFieldOptions = {
    id: string
    value: string
    /** Visible placeholder + aria label. Docs site uses “Search”. */
    label?: string
    /** Extra class on the shell (e.g. drawer variant). */
    className?: string
};

/** Docs-site search shell — magnifier, inline filter input, `/` hint. */
export function renderDocsSearchField(options: DocsSearchFieldOptions): string {

    const label = options.label ?? 'Search';
    const className = options.className ? ` ${options.className}` : '';

    return `
        <label class="cs-docs-search${className}" for="${escapeHtml(options.id)}">
            <span class="cs-docs-search__icon" aria-hidden="true">${searchMagnifierIcon()}</span>
            <span class="sr-only">${escapeHtml(label)}</span>
            <input
                id="${escapeHtml(options.id)}"
                class="cs-docs-search__input"
                type="search"
                placeholder="${escapeHtml(label)}"
                value="${escapeHtml(options.value)}"
                aria-label="${escapeHtml(label)}"
            >
            <kbd class="cs-docs-search__kbd" aria-hidden="true">/</kbd>
        </label>
    `;

}

/** Theme slider — same structure as Starlight ThemeSelect.astro. */
export function renderDocsThemeSlider(id: string): string {

    return `
        <button
            type="button"
            class="cs-theme-slider"
            id="${escapeHtml(id)}"
            aria-label="Toggle color theme"
            aria-pressed="false"
            title="Theme — click to toggle"
        >
            <span class="cs-theme-slider__shell">
                <span class="cs-theme-slider__icon cs-theme-slider__icon--sun" aria-hidden="true">${themeSunIcon()}</span>
                <span class="cs-theme-slider__icon cs-theme-slider__icon--moon" aria-hidden="true">${themeMoonIcon()}</span>
                <span class="cs-theme-slider__thumb" aria-hidden="true"></span>
            </span>
        </button>
    `;

}

function syncDocsThemeSlider(id: string, theme: Theme): void {

    const button = document.getElementById(id);

    if (!(button instanceof HTMLButtonElement)) return;

    button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    button.title = `Theme: ${theme === 'dark' ? 'Dark' : 'Light'} — click to toggle`;

}

export function syncAllDocsThemeSliders(theme: Theme): void {

    syncDocsThemeSlider('theme-toggle', theme);
    syncDocsThemeSlider('theme-toggle-drawer', theme);

}

/** Plain-text notice bar below the top header. */
export function renderUiNotice(notice: CallspecUiNotice | undefined): string {

    if (!notice?.message) {

        return '';

    }

    const title = notice.title
        ? `<strong class="cs-ui-notice__title">${escapeHtml(notice.title)}</strong>`
        : '';
    const command = notice.command
        ? `<code class="cs-ui-notice__command">${escapeHtml(notice.command)}</code>`
        : '';

    return `
        <div class="cs-ui-notice" role="status">
            ${title}
            <span class="cs-ui-notice__message">${escapeHtml(notice.message)}</span>
            ${command}
        </div>
    `;

}
