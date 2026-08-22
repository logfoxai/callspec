import fs from 'node:fs';
import path from 'node:path';

/** Local Astro/Vite hosts only — never widen to arbitrary Host values. */
export function isLocalDevHost(host) {
    if (!host) {
        return false;
    }
    const hostname = host.replace(/:\d+$/, '').toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname === '::1';
}

/**
 * Cursor / VS Code Simple Browser loads localhost as a cross-site `no-cors`
 * subresource and often omits `Origin`. Astro's sec-fetch middleware then 403s
 * because `security.allowedDomains` only matches when `Origin` is present.
 */
export function shouldBypassSecFetchForIdePreview(headers) {
    if (!isLocalDevHost(headers.host)) {
        return false;
    }
    if (headers.secFetchSite !== 'cross-site') {
        return false;
    }
    if (headers.secFetchMode !== 'no-cors' && headers.secFetchMode !== 'cors') {
        return false;
    }
    return headers.origin === undefined;
}

/**
 * Chrome DevTools Protocol discovery (`/json/version`, `/json/list`, …).
 * IDE/browser tooling sometimes probes the page origin instead of the CDP port.
 */
export function shouldShortCircuitDevtoolsProbe(pathname) {
    return pathname === '/json' || pathname.startsWith('/json/');
}

/**
 * `/demo` without a trailing slash breaks relative `./brand/…` and `./callspec.json`
 * URLs (they resolve from site root). Canonical URL is `/demo/`.
 */
export function demoPublicDirRedirect(pathname) {
    return pathname === '/demo' ? '/demo/' : null;
}

/**
 * Starlight's `[...slug]` catches `/demo/` in dev before publicDir index.html.
 * Production `astro:build` copies public files correctly; dev needs a rewrite.
 */
export function rewritePublicDirIndexRequest(pathname) {
    if (pathname === '/demo/') {
        return '/demo/index.html';
    }

    return null;
}

const DEMO_STATIC_FILES = new Set(['callspec.json', 'openapi.json']);

const DEMO_STATIC_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.html': 'text/html; charset=utf-8',
};

/**
 * Baked explorer files under publicDir (`assets/demo/…`).
 * HTML shell is owned by the Vite HMR middleware — do not map it here.
 * Starlight `[...slug]` otherwise 404-warns on stale hashed `/demo/assets/*`.
 * @param {string} pathname
 * @returns {string | null} path relative to `assets/demo`
 */
export function demoPublicFileRel(pathname) {
    if (!pathname.startsWith('/demo/')) {
        return null;
    }

    const rel = pathname.slice('/demo/'.length);

    if (!rel || rel === 'index.html' || rel.includes('..') || path.isAbsolute(rel)) {
        return null;
    }

    if (DEMO_STATIC_FILES.has(rel) || rel.startsWith('assets/') || rel.startsWith('brand/')) {
        return rel;
    }

    return null;
}

/**
 * Starlight `[...slug]` catches `/fonts/*` in dev before publicDir. Serve committed woff2.
 * @param {string} pathname
 * @returns {string | null} path relative to publicDir (`assets/`)
 */
export function publicFontRel(pathname) {
    const clean = pathname.split('?')[0];

    if (!clean.startsWith('/fonts/')) {
        return null;
    }

    const file = clean.slice('/fonts/'.length);

    if (!file || file.includes('..') || file.includes('/') || !file.endsWith('.woff2')) {
        return null;
    }

    return `fonts/${file}`;
}

const DEMO_STALE_FONTS = new Set([
    'ibm-plex-sans-latin-wght-normal.woff2',
    'ibm-plex-mono-latin-400-normal.woff2',
    'ibm-plex-mono-latin-600-normal.woff2',
    'caveat-latin-600-normal.woff2',
]);

/**
 * `<base href="/demo/">` turns stale explorer font urls into `/demo/node_modules/…`
 * or `/demo/assets/fonts/…`. Starlight `[...slug]` then 404-warns. Serve publicDir.
 * @param {string} pathname
 * @returns {string | null} path relative to publicDir (`assets/`)
 */
export function demoStaleFontRel(pathname) {
    const clean = pathname.split('?')[0];

    if (!clean.startsWith('/demo/')) {
        return null;
    }

    const file = clean.split('/').pop() ?? '';

    if (!DEMO_STALE_FONTS.has(file)) {
        return null;
    }

    if (
        clean.includes('/node_modules/@fontsource')
        || clean.startsWith('/demo/assets/fonts/')
        || clean.startsWith('/demo/fonts/')
    ) {
        return `fonts/${file}`;
    }

    return null;
}

function sendDemoPublicFile(publicDir, rel, res) {
    const file = path.join(publicDir, 'demo', rel);

    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Not Found');
        return;
    }

    const type = DEMO_STATIC_TYPES[path.extname(file)] ?? 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(file).pipe(res);
}

function sendPublicDirFile(publicDir, rel, res) {
    const file = path.join(publicDir, rel);

    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Not Found');
        return;
    }

    const type = DEMO_STATIC_TYPES[path.extname(file)] ?? 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(file).pipe(res);
}

/**
 * Vite plugin: runs ahead of Astro's sec-fetch middleware in `astro dev`.
 * No effect on static builds / `astro:build`.
 */
export function devServerNoisePlugin() {
    return {
        name: 'callspec-dev-server-noise',
        configureServer(server) {
            // Post-hook runs after Astro unshifts sec-fetch; unshift again so we run first.
            return () => {
                server.middlewares.stack.unshift({
                    route: '',
                    handle(req, res, next) {
                        const host = typeof req.headers.host === 'string' ? req.headers.host : undefined;
                        const url = req.url ?? '/';
                        const parsed = new URL(url, 'http://localhost');
                        const pathname = decodeURI(parsed.pathname);
                        const demoRedirect = demoPublicDirRedirect(pathname);

                        if (demoRedirect) {
                            res.statusCode = 301;
                            res.setHeader('Location', demoRedirect);
                            res.end();
                            return;
                        }

                        const staleFont = demoStaleFontRel(pathname);

                        if (staleFont) {
                            sendPublicDirFile(server.config.publicDir, staleFont, res);
                            return;
                        }

                        const publicFont = publicFontRel(pathname);

                        if (publicFont) {
                            sendPublicDirFile(server.config.publicDir, publicFont, res);
                            return;
                        }

                        const demoFile = demoPublicFileRel(pathname);

                        if (demoFile) {
                            sendDemoPublicFile(server.config.publicDir, demoFile, res);
                            return;
                        }

                        const indexRewrite = rewritePublicDirIndexRequest(pathname);

                        if (indexRewrite) {
                            parsed.pathname = indexRewrite;
                            req.url = `${parsed.pathname}${parsed.search}`;
                        }

                        if (shouldShortCircuitDevtoolsProbe(pathname)) {
                            res.statusCode = 404;
                            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                            res.end('Not Found');
                            return;
                        }

                        if (
                            shouldBypassSecFetchForIdePreview({
                                secFetchSite: req.headers['sec-fetch-site'],
                                secFetchMode: req.headers['sec-fetch-mode'],
                                origin: typeof req.headers.origin === 'string' ? req.headers.origin : undefined,
                                host,
                            })
                        ) {
                            // Astro allows requests with no Sec-Fetch-Site (non-browser / older clients).
                            delete req.headers['sec-fetch-site'];
                        }

                        next();
                    },
                });
            };
        },
    };
}
