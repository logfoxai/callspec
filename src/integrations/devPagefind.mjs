import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const docsSiteDir = path.join(repoRoot, 'docs-site');

const PAGEFIND_BUCKETS = {
    pagefind: path.join(docsSiteDir, 'pagefind'),
    'cs-pagefind': path.join(docsSiteDir, 'cs-pagefind'),
};

const SEARCH_INDEX_MARKERS = [
    path.join('docs-site', 'pagefind', 'pagefind.js'),
    path.join('docs-site', 'cs-pagefind', 'pagefind.js'),
];

const STATIC_TYPES = {
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.wasm': 'application/wasm',
    '.pf_fragment': 'application/octet-stream',
    '.pf_index': 'application/octet-stream',
    '.pf_meta': 'application/json; charset=utf-8',
};

/**
 * Map a dev-server request to a built Pagefind asset under docs-site/.
 * @param {string} pathname decoded URL pathname (no query)
 * @returns {{ bucket: 'pagefind' | 'cs-pagefind', rel: string } | null}
 */
export function resolvePagefindDevAsset(pathname) {
    const clean = pathname.split('?')[0];

    if (clean.startsWith('/pagefind/')) {
        const rel = clean.slice('/pagefind/'.length);
        if (!rel || rel.includes('..') || path.isAbsolute(rel)) return null;
        return {bucket: 'pagefind', rel};
    }

    if (clean.startsWith('/cs-pagefind/')) {
        const rel = clean.slice('/cs-pagefind/'.length);
        if (!rel || rel.includes('..') || path.isAbsolute(rel)) return null;
        return {bucket: 'cs-pagefind', rel};
    }

    return null;
}

export function pagefindIndexReady(root = repoRoot) {
    return SEARCH_INDEX_MARKERS.every((rel) => fs.existsSync(path.join(root, rel)));
}

function sendPagefindFile(bucket, rel, res) {
    const root = PAGEFIND_BUCKETS[bucket];
    const file = path.join(root, rel);

    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Not Found');
        return;
    }

    const type = STATIC_TYPES[path.extname(file)] ?? 'application/octet-stream';
    res.statusCode = 200;
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(file).pipe(res);
}

/**
 * Vite plugin: serve the last astro:build Pagefind index during astro dev.
 * Search-modal CSS/JS hot-reloads via Vite; refresh the index with `npm run astro:build:pagefind` while dev keeps running.
 */
export function devPagefindPlugin() {
    return {
        name: 'callspec-dev-pagefind',
        configureServer(server) {
            const logger = server.config.logger;

            if (!pagefindIndexReady()) {
                logger.warn(
                    'Docs search index missing — run `npm run astro:build` once, then search works in dev with HMR.',
                );
            }

            return () => {
                server.middlewares.stack.unshift({
                    route: '',
                    handle(req, res, next) {
                        const url = req.url ?? '/';
                        const pathname = decodeURI(new URL(url, 'http://localhost').pathname);
                        const asset = resolvePagefindDevAsset(pathname);

                        if (asset) {
                            sendPagefindFile(asset.bucket, asset.rel, res);
                            return;
                        }

                        next();
                    },
                });
            };
        },
    };
}
