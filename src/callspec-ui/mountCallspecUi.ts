import fs from 'fs';
import path from 'path';
import type {RequestHandler, Router} from 'express';
import express from 'express';
import type {CallspecUiBranding, CallspecUiConfig, CallspecUiMcp} from './branding';

export type {CallspecUiBranding, CallspecUiConfig, CallspecUiMcp} from './branding';

export type MountCallspecUiOptions = {
    /** Mount path for the UI. Default `/docs`. */
    path?: string
    /** Native Callspec document URL for the UI to fetch. Default `../callspec.json`. */
    specPath?: string
    /** RPC base for try-it requests. Default `..` (sibling of the docs path). */
    rpcBase?: string
    /** Page title override. */
    title?: string
    /** Whitelabel home page content */
    branding?: CallspecUiBranding
    /** Relative path from docs to MCP endpoint. Default `../mcp` */
    mcpPath?: string
    mcp?: CallspecUiMcp
};

const CONFIG_PLACEHOLDER = '<!--CALLSPEC_UI_CONFIG-->';

function uiDir(): string {

    const candidates = [
        path.join(__dirname, 'ui'),
        path.resolve(__dirname, '../../dist/callspec-ui/ui'),
        path.resolve(process.cwd(), 'dist/callspec-ui/ui'),
    ];

    for (const candidate of candidates) {

        if (fs.existsSync(path.join(candidate, 'index.html'))) {

            return candidate;

        }

    }

    throw new Error('callspec UI assets missing — run `npm run build` in callspec');

}

function readIndexHtml(): string {

    const file = path.join(uiDir(), 'index.html');

    return fs.readFileSync(file, 'utf8');

}

export function renderCallspecUiPage(config: CallspecUiConfig): string {

    const html = readIndexHtml();
    const script = `<script>window.__CALLSPEC_UI__=${JSON.stringify(config)};</script>`;

    if (html.includes(CONFIG_PLACEHOLDER)) {

        return html.replace(CONFIG_PLACEHOLDER, script);

    }

    return html.replace('</head>', `${script}</head>`);

}

export function mountCallspecUi(router: Router, options: MountCallspecUiOptions = {}): void {

    const mountPath = options.path ?? '/docs';
    const mountPathWithSlash = mountPath.endsWith('/') ? mountPath : `${mountPath}/`;
    const specUrl = options.specPath ?? '../callspec.json';
    const rpcBase = options.rpcBase ?? '..';
    const assetsDir = uiDir();

    const servePage: RequestHandler = (req, res) => {

        if (!req.path.endsWith('/')) {

            res.redirect(301, `${req.baseUrl}${mountPathWithSlash}`);
            return;

        }

        res.type('html').send(renderCallspecUiPage({
            specUrl,
            rpcBase,
            title: options.title,
            branding: options.branding,
            mcpPath: options.mcpPath ?? '../mcp',
            mcp: options.mcp,
        }));

    };

    router.get(mountPath, servePage);
    router.use(mountPathWithSlash, express.static(assetsDir, {index: false}));

}
