import {openApiPathFromSpecUrl} from '../contractPaths';
import type {CallspecUiNotice} from '../../types';
import {renderCallspecLockupMarkOverlay} from './callspecLockup';
import {openApiIcon, themeMoonIcon, themeSunIcon} from './icons';
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

/** Clear (X) — replaces the non-tabbable native search cancel control. */
function searchClearIcon(): string {

    return [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">',
        '<path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12 5.7 16.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4Z"/>',
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
            <button
                type="button"
                class="cs-docs-search__clear"
                aria-label="Clear search"
            >${searchClearIcon()}</button>
            <kbd class="cs-docs-search__kbd" aria-hidden="true">/</kbd>
        </label>
    `;

}

/** Mobile Menu chip — equal bars + Menu/Close label (matches Starlight override). */
export function renderDocsMenuButton(): string {

    return `
        <button
            type="button"
            class="cs-menu-toggle__btn"
            id="nav-menu-btn"
            aria-label="Menu"
            aria-expanded="false"
            aria-controls="nav-drawer"
        >
            <span class="cs-menu-toggle__icon" aria-hidden="true">
                <span class="cs-menu-toggle__line cs-menu-toggle__line--1"></span>
                <span class="cs-menu-toggle__line cs-menu-toggle__line--2"></span>
                <span class="cs-menu-toggle__line cs-menu-toggle__line--3"></span>
            </span>
            <span class="cs-menu-toggle__label">
                <span class="cs-menu-toggle__word cs-menu-toggle__word--open">Menu</span>
                <span class="cs-menu-toggle__word cs-menu-toggle__word--close">Close</span>
            </span>
        </button>
    `;

}

type MobileMenuToolsOptions = {
    /** Optional — explorer keeps search in the sidebar (below Home/Routes). */
    searchHtml?: string
    /** Contracts (or social) — left side of preferences row. */
    leadingHtml: string
    themeSliderId: string
    navLinksHtml?: string
};

/**
 * Mobile drawer footer chrome — preferences (leading + Theme) + optional nav.
 * Search can live here or at the top of the sidebar (demo UI).
 */
export function renderMobileMenuTools(options: MobileMenuToolsOptions): string {

    const nav = options.navLinksHtml ?? '';
    const search = options.searchHtml ?? '';

    return `
        <div class="sidebar-drawer-chrome cs-mobile-menu-tools">
            ${search}
            <div class="mobile-preferences">
                <div class="mobile-preferences__leading">${options.leadingHtml}</div>
                <div class="cs-mobile-menu-tools__theme">
                    <span class="cs-mobile-menu-tools__theme-label">Theme</span>
                    ${renderDocsThemeSlider(options.themeSliderId)}
                </div>
            </div>
            ${nav}
        </div>
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

/** MCP-only filter — plain Yes/No pills (same pattern as Auth/Tag). */
export function renderMcpOnlySlider(_id: string, mcpOnly: boolean): string {

    const noActive = mcpOnly ? '' : ' active';
    const yesActive = mcpOnly ? ' active' : '';

    return `
        <div class="filter-pills" role="group" aria-label="MCP only">
            <button type="button" class="filter-pill${noActive}" data-mcp-only="false">No</button>
            <button type="button" class="filter-pill${yesActive}" data-mcp-only="true">Yes</button>
        </div>
    `;

}

type HeaderContractButtonsOptions = {
    /** `header-end` — top bar beside theme; `drawer` — mobile nav drawer. */
    variant?: 'header-end' | 'drawer'
};

/** Header buttons linking to callspec.json and openapi.json. */
export function renderHeaderContractButtons(
    specUrl: string,
    options: HeaderContractButtonsOptions = {},
): string {

    const openapiHref = openApiPathFromSpecUrl(specUrl);
    const variant = options.variant ?? 'header-end';
    const className = variant === 'drawer'
        ? 'header-contracts header-contracts--drawer'
        : 'header-contracts header-contracts--header-end';

    return `
        <nav class="${className}" aria-label="Contract files">
            <a class="btn btn-ghost header-contract-btn header-contract-btn--callspec" href="${escapeHtml(specUrl)}" target="_blank" rel="noopener">
                <span class="header-contract-btn__icon">${renderCallspecLockupMarkOverlay()}</span>
                <span class="header-contract-btn__label">callspec.json</span>
            </a>
            <a class="btn btn-ghost header-contract-btn header-contract-btn--openapi" href="${escapeHtml(openapiHref)}" target="_blank" rel="noopener">
                <span class="header-contract-btn__icon">${openApiIcon()}</span>
                <span class="header-contract-btn__label">openapi.json</span>
            </a>
        </nav>
    `;

}

/** Plain-text notice bar above the top header. */
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
    const links = notice.links?.length
        ? `<span class="cs-ui-notice__links">${notice.links.map((link) => {
            const attrs = link.external
                ? ' target="_blank" rel="noopener noreferrer"'
                : '';
            return `<a class="cs-ui-notice__link" href="${escapeHtml(link.href)}"${attrs}>${escapeHtml(link.label)}</a>`;
        }).join('')}</span>`
        : '';

    return `
        <div class="cs-ui-notice" role="note">
            ${title}
            <span class="cs-ui-notice__message">${escapeHtml(notice.message)}</span>
            ${command}
            ${links}
        </div>
    `;

}
