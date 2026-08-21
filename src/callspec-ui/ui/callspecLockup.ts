import {CALLSPEC_EQ_BARS, CALLSPEC_HEX_PATH} from './icons';

function escapeAttr(value: string): string {

    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');

}

/** Masked hex mark — same SVG the lockup uses (unique maskId per instance). */
export function renderCallspecLockupMark(maskId: string): string {

    const holes = CALLSPEC_EQ_BARS.map((bar) => {
        const cls = bar.y === 24 ? 'cs-eq cs-eq--top' : 'cs-eq cs-eq--bottom';
        return `<rect class="${cls}" x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" rx="${bar.rx}" fill="black"></rect>`;
    }).join('');

    return [
        '<svg class="cs-lockup__mark" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
        '<defs>',
        `<mask id="${escapeAttr(maskId)}">`,
        '<rect x="0" y="0" width="64" height="64" fill="white"></rect>',
        holes,
        '</mask>',
        '</defs>',
        `<path class="cs-hex" d="${CALLSPEC_HEX_PATH}" fill="currentColor" mask="url(#${escapeAttr(maskId)})"></path>`,
        '</svg>',
    ].join('');

}

export type CallspecLockupOptions = {
    href: string
    maskId: string
    className?: string
    extraHtml?: string
    attrs?: Record<string, string>
};

/** Mark + wordmark. Docs header/footer and explorer powered-by all use this. */
export function renderCallspecLockup(options: CallspecLockupOptions): string {

    const className = ['cs-lockup', options.className].filter(Boolean).join(' ');
    const extraAttrs = Object.entries(options.attrs ?? {})
        .map(([key, value]) => ` ${escapeAttr(key)}="${escapeAttr(value)}"`)
        .join('');

    return [
        `<a href="${escapeAttr(options.href)}" class="${className}" translate="no"${extraAttrs}>`,
        renderCallspecLockupMark(options.maskId),
        '<span class="cs-lockup__word" aria-hidden="true">callspec</span>',
        options.extraHtml ?? '',
        '</a>',
    ].join('');

}
