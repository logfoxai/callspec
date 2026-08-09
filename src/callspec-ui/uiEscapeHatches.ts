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
 * Decode common HTML entities so scheme/handler checks see the browser value.
 * Intentionally limited — this is a trusted-server escape hatch, not a browser.
 */
function decodeBasicHtmlEntities(value: string): string {

    let out = value;

    for (let i = 0; i < 3; i += 1) {

        const next = out
            .replace(/&#x([0-9a-fA-F]+);?/g, (_m, hex: string) => {

                const code = Number.parseInt(hex, 16);

                return Number.isFinite(code) ? String.fromCodePoint(code) : '';

            })
            .replace(/&#(\d+);?/g, (_m, dec: string) => {

                const code = Number.parseInt(dec, 10);

                return Number.isFinite(code) ? String.fromCodePoint(code) : '';

            })
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&apos;/gi, "'");

        if (next === out) break;
        out = next;

    }

    return out;

}

/**
 * Basic sanitizer for trusted-server `headerHtml` only.
 * Strips `<script>`, `<base>`, `on*` handlers, and `javascript:` URLs — not a full HTML allowlist.
 */
export function sanitizeHeaderHtml(html: string): string {

    let out = decodeBasicHtmlEntities(html);

    out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    out = out.replace(/<script\b[^>]*\/?>/gi, '');
    out = out.replace(/<base\b[^>]*\/?>/gi, '');
    // `/onload=…` (no whitespace) and normal ` onclick=…`
    out = out.replace(/\/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    out = out.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    out = out.replace(/javascript\s*:/gi, '');

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
