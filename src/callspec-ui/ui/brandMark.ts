import type {CallspecUiBranding} from '../branding';
import {renderCallspecLockupMarkOverlay} from './callspecLockup';

function escapeHtml(text: string): string {

    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

}

function renderCustomBrandMark(
    branding: CallspecUiBranding | undefined,
    wrapClass: string,
): string {

    if (!branding?.logoUrl) return '';

    const dark = branding.logoUrlDark ?? branding.logoUrl;

    return `<span class="brand-mark ${wrapClass}"><img class="brand-mark-img brand-mark-light" src="${escapeHtml(branding.logoUrl)}" alt=""><img class="brand-mark-img brand-mark-dark" src="${escapeHtml(dark)}" alt=""></span>`;

}

function renderDefaultCallspecMark(wrapClass: string): string {

    return `<span class="cs-lockup brand-mark-callspec ${wrapClass}" data-holes="overlay" aria-hidden="true">${renderCallspecLockupMarkOverlay()}</span>`;

}

/** Header / home mark: custom logo, or the Callspec hex. */
export function renderBrandOrDefaultMark(
    branding: CallspecUiBranding | undefined,
    wrapClass: string,
): string {

    return renderCustomBrandMark(branding, wrapClass) || renderDefaultCallspecMark(wrapClass);

}
