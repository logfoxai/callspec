/** Max UTF-8 size for inline `meta.theme.customCss` (abuse guard). */
export const CUSTOM_CSS_MAX_BYTES = 8 * 1024;

/**
 * Prepare inline theme CSS for a `<style>` block: strip `</style` sequences
 * and truncate to {@link CUSTOM_CSS_MAX_BYTES} UTF-8 bytes.
 */
export function sanitizeCustomCss(css: string): string {

    const stripped = css.replace(/<\/style/gi, '');

    return truncateUtf8(stripped, CUSTOM_CSS_MAX_BYTES);

}

/**
 * Basic sanitizer for trusted-server `headerHtml` only.
 * Strips `<script>`, `on*` handlers, and `javascript:` URLs — not a full HTML allowlist.
 */
export function sanitizeHeaderHtml(html: string): string {

    let out = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

    out = out.replace(/<script\b[^>]*\/?>/gi, '');
    out = out.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    out = out.replace(/javascript:/gi, '');

    return out;

}

function truncateUtf8(value: string, maxBytes: number): string {

    if (Buffer.byteLength(value, 'utf8') <= maxBytes) {

        return value;

    }

    let end = value.length;

    while (end > 0 && Buffer.byteLength(value.slice(0, end), 'utf8') > maxBytes) {

        end -= 1;

    }

    return value.slice(0, end);

}
