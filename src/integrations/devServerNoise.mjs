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
                        const pathname = decodeURI(new URL(url, 'http://localhost').pathname);

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
