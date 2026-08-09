/** Cache-Control for SSR docs HTML (config is injected per request). */
export const UI_HTML_CACHE_CONTROL = 'no-cache';

const HASHED_ASSET_RE = /\.[a-f0-9]{8}\.(js|css)$/i;

/** Cache-Control for files under the Docs UI assets directory. */
export function cacheControlForUiAsset(filePath: string): string {

    const base = filePath.split(/[/\\]/).pop() ?? '';

    if (HASHED_ASSET_RE.test(base)) {

        return 'public, max-age=31536000, immutable';

    }

    return 'public, max-age=86400';

}
