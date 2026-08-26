import type {CallspecUiBranding} from '../branding';
import {renderBrandOrDefaultMark} from './brandMark';

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

}

/** Header brand: mark, API name, and version. Clicks Home when that page exists. */
export function renderTopBrand(
    title: string,
    version: string,
    branding: CallspecUiBranding | undefined,
    showHome: boolean,
): string {

    const name = branding?.name ?? title;
    const view = showHome ? 'home' : 'routes';

    return `
        <button type="button" class="top-brand" data-view="${view}">
            ${renderBrandOrDefaultMark(branding, 'top-mark')}
            <span class="top-brand-text">${escapeHtml(name)}</span>
            <span class="top-brand-version">v${escapeHtml(version)}</span>
        </button>
    `;

}
