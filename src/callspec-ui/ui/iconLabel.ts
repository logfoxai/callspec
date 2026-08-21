/** Flex icon + optional label — Bearer, MCP, filter chips, MCP heading. */

export type IconLabelOptions = {
    icon: string
    label?: string
    className?: string
    ariaLabel?: string
};

function escapeAttr(value: string): string {

    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');

}

function escapeText(value: string): string {

    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

}

export function renderIconLabel(options: IconLabelOptions): string {

    const extra = options.className ? ` ${options.className}` : '';
    const attrs = options.ariaLabel
        ? ` aria-label="${escapeAttr(options.ariaLabel)}"`
        : '';
    const labelHtml = options.label
        ? `<span class="icon-label__label">${escapeText(options.label)}</span>`
        : '';

    return `<span class="icon-label${extra}"${attrs}><span class="icon-label__icon" aria-hidden="true">${options.icon}</span>${labelHtml}</span>`;

}
