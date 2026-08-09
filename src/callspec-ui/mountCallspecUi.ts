import fs from 'fs';
import path from 'path';
import type {RequestHandler, Router} from 'express';
import express from 'express';
import type {CallspecUiBranding, CallspecUiConfig, CallspecUiMcp} from './branding';
import {cacheControlForUiAsset, UI_HTML_CACHE_CONTROL} from './uiCacheHeaders';
import {sanitizeCustomCss, sanitizeHeaderHtml} from './uiEscapeHatches';

/** Sanitize escape-hatch fields before baking into HTML / client config. */
function sanitizeBrandingEscapeHatches(
    branding: CallspecUiBranding | undefined,
): CallspecUiBranding | undefined {

    if (!branding) {

        return undefined;

    }

    const theme = branding.theme;
    const customCss = theme?.customCss;
    const headerHtml = branding.headerHtml;
    const nextTheme = theme && typeof customCss === 'string'
        ? {...theme, customCss: sanitizeCustomCss(customCss)}
        : theme;

    return {
        ...branding,
        theme: nextTheme,
        headerHtml: typeof headerHtml === 'string'
            ? sanitizeHeaderHtml(headerHtml)
            : headerHtml,
    };

}

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
    /**
     * Stylesheet URL for a `<link rel="stylesheet">` in the docs HTML shell.
     * When set, wins over `branding.theme.customCssUrl` / `meta.theme.customCssUrl`.
     */
    customCssUrl?: string
    /** Relative path from docs to MCP endpoint. Default `../mcp` */
    mcpPath?: string
    mcp?: CallspecUiMcp
};

const CONFIG_PLACEHOLDER = '<!--CALLSPEC_UI_CONFIG-->';
const FOOTER_RE = /<footer\b[^>]*>[\s\S]*?<\/footer>/i;

/** Resolve built Docs UI directory (index.html + assets/). */
export function resolveCallspecUiDir(): string {

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

    const file = path.join(resolveCallspecUiDir(), 'index.html');

    return fs.readFileSync(file, 'utf8');

}

function escapeHtmlAttr(value: string): string {

    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

}

/** Inject config, favicon, escape hatches, and optional footer into the built docs UI shell. */
export function renderCallspecUiPage(config: CallspecUiConfig): string {

    let html = readIndexHtml();
    const branding = sanitizeBrandingEscapeHatches(config.branding);
    const baked: CallspecUiConfig = {...config, branding};
    const script = `<script>window.__CALLSPEC_UI__=${JSON.stringify(baked)};</script>`;

    if (html.includes(CONFIG_PLACEHOLDER)) {

        html = html.replace(CONFIG_PLACEHOLDER, script);

    } else {

        html = html.replace('</head>', `${script}</head>`);

    }

    if (branding?.favicon) {

        const favicon = `<link rel="icon" href="${escapeHtmlAttr(branding.favicon)}">`;

        html = html.replace('</head>', `${favicon}</head>`);

    }

    const customCssUrl = baked.customCssUrl ?? branding?.theme?.customCssUrl;

    if (typeof customCssUrl === 'string' && customCssUrl.length > 0) {

        const link = `<link rel="stylesheet" href="${escapeHtmlAttr(customCssUrl)}">`;

        html = html.replace('</head>', `${link}</head>`);

    }

    const customCss = branding?.theme?.customCss;

    if (typeof customCss === 'string' && customCss.length > 0) {

        const style = `<style data-callspec-ui-custom-css>${customCss}</style>`;

        html = html.replace('</head>', `${style}</head>`);

    }

    const headerHtml = branding?.headerHtml;

    if (typeof headerHtml === 'string' && headerHtml.length > 0) {

        const block = `<div class="callspec-ui-header-html">${headerHtml}</div>`;

        html = html.replace(/<div id="app"/, `${block}<div id="app"`);

    }

    if (branding?.footer?.poweredBy === false) {

        html = html.replace(FOOTER_RE, '');
        html = html.replace('<body>', '<body class="no-footer">');

    }

    return html;

}

export function mountCallspecUi(router: Router, options: MountCallspecUiOptions = {}): void {

    const mountPath = options.path ?? '/docs';
    const mountPathWithSlash = mountPath.endsWith('/') ? mountPath : `${mountPath}/`;
    const specUrl = options.specPath ?? '../callspec.json';
    const rpcBase = options.rpcBase ?? '..';
    const assetsDir = resolveCallspecUiDir();

    const servePage: RequestHandler = (req, res) => {

        if (!req.path.endsWith('/')) {

            res.redirect(301, `${req.baseUrl}${mountPathWithSlash}`);
            return;

        }

        res.setHeader('Cache-Control', UI_HTML_CACHE_CONTROL);
        res.type('html').send(renderCallspecUiPage({
            specUrl,
            rpcBase,
            title: options.title,
            branding: options.branding,
            customCssUrl: options.customCssUrl,
            mcpPath: options.mcpPath ?? '../mcp',
            mcp: options.mcp,
        }));

    };

    router.get(mountPath, servePage);
    router.use(mountPathWithSlash, express.static(assetsDir, {
        index: false,
        setHeaders: (res, filePath) => {

            res.setHeader('Cache-Control', cacheControlForUiAsset(filePath));

        },
    }));

}
