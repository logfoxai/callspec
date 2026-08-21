import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {injectChirpDemoBoot, renderLoadingAppHtml} from '../callspec-ui/ui/loadingShell.mjs';

/** Vite-served explorer entry — HMR via `import './styles.css'` in main.ts. */
export const CHIRP_DEMO_DEV_ENTRY = '/src/callspec-ui/ui/main.ts';

/** Spec / brand only. UI sources are in Vite's module graph. */
export const EXPLORER_WATCH_PATHS = [
    'src/demo',
    'assets/chirp',
    'src/emitCallspec.ts',
    'src/openapi.ts',
    'src/metaDefaults.ts',
];

const SERVER_FILES = new Set([
    'src/emitCallspec.ts',
    'src/openapi.ts',
    'src/metaDefaults.ts',
]);

const DIST_MARKERS = [
    ['dist', 'demo', 'chirpDemoApi.js'],
    ['dist', 'callspec-ui', 'exportCallspecUi.js'],
    ['dist', 'callspec-ui', 'ui', 'index.html'],
];

const SPEC_FILE = /\.spec\.[cm]?[jt]sx?$/;
const DEBOUNCE_MS = 200;
const CONFIG_RE = /<script>window\.__CALLSPEC_UI__=[\s\S]*?<\/script>/;
const TITLE_RE = /<title>[^<]*<\/title>/;
const FAVICON_RE = /<link rel="icon"[^>]*>/;

/**
 * @param {string} rel posix path from the repo root
 * @returns {'server' | 'bake' | null}
 */
export function classifyExplorerChange(rel) {
    const normalized = rel.replaceAll('\\', '/');

    if (normalized === 'assets/demo' || normalized.startsWith('assets/demo/')) {
        return null;
    }

    if (SPEC_FILE.test(normalized)) {
        return null;
    }

    if (normalized.startsWith('src/demo/') || SERVER_FILES.has(normalized)) {
        return 'server';
    }

    if (normalized.startsWith('assets/chirp/')) {
        return 'bake';
    }

    return null;
}

/**
 * @param {string[]} rels
 */
export function explorerRebuildPlan(rels) {
    const plan = {server: false, bake: false};

    for (const rel of rels) {
        const kind = classifyExplorerChange(rel);

        if (kind === 'server') {
            plan.server = true;
            plan.bake = true;
        } else if (kind === 'bake') {
            plan.bake = true;
        }
    }

    return plan;
}

/**
 * @param {{server: boolean, bake: boolean}} plan
 * @returns {Array<[string, string[]]>}
 */
export function explorerRebuildCommands(plan) {
    const commands = [];

    if (plan.server) {
        commands.push(['npm', ['run', 'build:server']]);
    }

    if (plan.bake) {
        commands.push(['node', ['scripts/build-chirp-static-demo.cjs']]);
    }

    return commands;
}

/**
 * @param {string} root
 * @param {(file: string) => boolean} [exists]
 */
export function distReadyForChirpDemo(root, exists = (file) => fs.existsSync(file)) {
    return DIST_MARKERS.every((parts) => exists(path.join(root, ...parts)));
}

/**
 * @param {string} root
 * @param {string} filePath
 */
export function toPosixRel(root, filePath) {
    return path.relative(root, filePath).split(path.sep).join('/');
}

/**
 * @param {string} pathname
 */
export function isChirpDemoIndexRequest(pathname) {
    return pathname === '/demo/' || pathname === '/demo/index.html';
}

/**
 * Dev shell: same baked config, Vite module graph instead of hashed IIFE.
 * @param {string} bakedHtml
 */
export function renderChirpDemoDevHtml(bakedHtml) {
    const title = bakedHtml.match(TITLE_RE)?.[0] ?? '<title>Chirp API v2 - Callspec</title>';
    const config = bakedHtml.match(CONFIG_RE)?.[0] ?? '';
    const favicon = bakedHtml.match(FAVICON_RE)?.[0] ?? '';

    return injectChirpDemoBoot(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base href="/demo/">
    ${title}
    ${config}
    ${favicon}
    <script type="module" src="${CHIRP_DEMO_DEV_ENTRY}"></script>
</head>
<body>
    ${renderLoadingAppHtml()}
    <footer class="footer">
        <span class="footer-label">Powered by</span>
    </footer>
</body>
</html>
`);
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 */
function defaultRun(command, args, cwd) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            stdio: 'inherit',
            shell: process.platform === 'win32',
        });

        child.on('error', reject);
        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(new Error(`${command} ${args.join(' ')} exited ${code ?? 1}`));
        });
    });
}

/**
 * @param {string} root
 * @param {{server: boolean, bake: boolean}} plan
 * @param {(command: string, args: string[], cwd: string) => Promise<void>} [run]
 */
export async function rebuildChirpDemo(root, plan, run = defaultRun) {
    for (const [command, args] of explorerRebuildCommands(plan)) {
        await run(command, args, root);
    }
}

function requestPathname(url) {
    try {
        return decodeURI(new URL(url ?? '/', 'http://localhost').pathname);
    } catch {
        return '/';
    }
}

/**
 * Vite plugin: HMR for explorer UI; rebake spec JSON when Chirp routes change.
 */
export function watchChirpDemoPlugin() {
    return {
        name: 'callspec-watch-chirp-demo',
        transformIndexHtml: {
            order: 'post',
            handler(html, ctx) {
                const url = `${ctx.path ?? ''} ${ctx.filename ?? ''} ${ctx.originalUrl ?? ''}`;

                if (!url.includes('/demo')) {
                    return html;
                }

                return injectChirpDemoBoot(html);
            },
        },
        configureServer(server) {
            const root = server.config.root;
            const bakedIndex = path.join(root, 'assets', 'demo', 'index.html');
            const pending = new Set();
            let timer = undefined;
            let running = false;

            server.watcher.add(EXPLORER_WATCH_PATHS.map((rel) => path.join(root, rel)));

            const schedule = (filePath) => {
                const rel = toPosixRel(root, filePath);

                if (!classifyExplorerChange(rel)) {
                    return;
                }

                pending.add(rel);
                clearTimeout(timer);
                timer = setTimeout(() => {
                    flush().catch((err) => {
                        console.error('[chirp demo] rebuild failed', err);
                    });
                }, DEBOUNCE_MS);
            };

            server.watcher.on('change', schedule);
            server.watcher.on('add', schedule);
            server.watcher.on('unlink', schedule);

            async function flush() {
                if (running) {
                    return;
                }

                const files = [...pending];
                pending.clear();

                if (files.length === 0) {
                    return;
                }

                const plan = explorerRebuildPlan(files);

                if (!plan.bake) {
                    return;
                }

                running = true;
                console.log(`[chirp demo] rebaking spec after ${files.join(', ')}`);

                try {
                    await rebuildChirpDemo(root, plan);
                    server.ws.send({type: 'full-reload', path: '/demo/'});
                } finally {
                    running = false;

                    if (pending.size > 0) {
                        await flush();
                    }
                }
            }

            return () => {
                server.middlewares.stack.unshift({
                    route: '',
                    handle(req, res, next) {
                        const pathname = requestPathname(req.url);

                        if (!isChirpDemoIndexRequest(pathname)) {
                            next();
                            return;
                        }

                        if (!fs.existsSync(bakedIndex)) {
                            next();
                            return;
                        }

                        const html = renderChirpDemoDevHtml(fs.readFileSync(bakedIndex, 'utf8'));

                        server.transformIndexHtml('/demo/', html).then((transformed) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'text/html; charset=utf-8');
                            res.setHeader('Cache-Control', 'no-store');
                            res.end(transformed);
                        }).catch(next);
                    },
                });
            };
        },
    };
}
