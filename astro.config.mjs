import {defineConfig} from 'astro/config';
import {unified} from '@astrojs/markdown-remark';
import starlight from '@astrojs/starlight';
import {devServerNoisePlugin} from './src/integrations/devServerNoise.mjs';
import {remarkStarlightMdLinks} from './src/integrations/remark-starlight-md-links.mjs';
import {rehypeWrapTables} from './src/integrations/rehype-wrap-tables.mjs';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
    experimental: {
        contentIntellisense: true,
    },
    // Hover-prefetching every sidebar link hammers Vite in dev and freezes tabs.
    prefetch: isDev ? false : {prefetchAll: true, defaultStrategy: 'hover'},
    devToolbar: {enabled: false},
    markdown: {
        processor: unified({
            remarkPlugins: [remarkStarlightMdLinks],
            rehypePlugins: [rehypeWrapTables],
        }),
    },
    site: 'https://callspec.logfox.ai',
    outDir: './docs-site',
    // Brand / docs static media — single source of truth (also used by README)
    publicDir: './assets',
    // Old thin API reference landing → first real page.
    redirects: {
        '/api-reference': '/api-reference/handlers',
        '/api-reference/': '/api-reference/handlers',
    },
    // Dev server only: Origin-bearing cross-site requests (proxies / some IDE previews).
    // Cursor Simple Browser often sends cross-site no-cors *without* Origin — that
    // path is handled by devServerNoisePlugin (allowedDomains cannot match missing Origin).
    security: {
        allowedDomains: [{}],
    },
    // HTML + Vite modules — Cursor Simple Browser and Chrome otherwise keep stale CSS.
    server: {
        headers: {
            'Cache-Control': 'no-store',
        },
    },
    vite: {
        plugins: [devServerNoisePlugin()],
        // Vite 8 defaults cssMinify to lightningcss, which drops unprefixed
        // backdrop-filter when -webkit- is present — Chromium then skips frost.
        // https://github.com/vitejs/vite/issues/22649
        build: {
            cssMinify: 'esbuild',
        },
        server: {
            cors: true,
            headers: {
                'Cache-Control': 'no-store',
            },
            watch: {
                // Build output must not reload dev — corrupts Starlight content sync.
                ignored: ['**/docs-site/**'],
            },
        },
    },
    integrations: [
        starlight({
            title: 'Callspec',
            description: 'Stop duct-taping your API stack. One TypeScript route → typed SDK, docs, OpenAPI, and MCP.',
            logo: {
                light: './assets/callspec-lockup-light.svg',
                dark: './assets/callspec-lockup-dark.svg',
                replacesTitle: true,
            },
            favicon: '/favicon.svg',
            // Code block chrome lives in ec.config.mjs (ui-components Code look)
            expressiveCode: true,
            customCss: [
                './src/styles/fonts.css',
                './src/styles/docs-shared.css',
                './src/styles/starlight-custom.css',
            ],
            components: {
                Head: './src/overrides/Head.astro',
                Header: './src/overrides/Header.astro',
                Hero: './src/overrides/Hero.astro',
                Search: './src/overrides/Search.astro',
                ThemeSelect: './src/overrides/ThemeSelect.astro',
                MobileMenuToggle: './src/overrides/MobileMenuToggle.astro',
                MobileMenuFooter: './src/overrides/MobileMenuFooter.astro',
                PageFrame: './src/overrides/PageFrame.astro',
                PageTitle: './src/overrides/PageTitle.astro',
                SiteTitle: './src/overrides/SiteTitle.astro',
            },
            social: [
                {
                    icon: 'github',
                    label: 'GitHub',
                    href: 'https://github.com/logfoxai/callspec',
                },
            ],
            sidebar: [
                {
                    label: 'Introduction',
                    items: [
                        {label: 'Getting started', slug: 'getting-started'},
                        {label: 'Server layout', slug: 'server-layout'},
                        {label: 'Unit testing', slug: 'unit-testing'},
                        {label: 'Single-file server example', slug: 'single-file-server-example'},
                    ],
                },
                {
                    label: 'API reference',
                    items: [
                        {label: 'Handlers', slug: 'api-reference/handlers'},
                        {label: 'route & spec', slug: 'api-reference/route-and-spec'},
                        {label: 'mountSpec', slug: 'api-reference/mount-spec'},
                        {label: 'Auth and scope', slug: 'api-reference/auth-and-scope'},
                        {
                            label: 'Surfaces & exports',
                            slug: 'api-reference/surfaces-and-exports',
                        },
                        {label: 'Builtin errors', slug: 'builtin-errors'},
                    ],
                },
                {
                    label: 'Working with Coding Agents',
                    items: [
                        {label: 'Skill & prompts', slug: 'coding-agents'},
                    ],
                },
                {
                    label: 'Server',
                    items: [
                        {label: 'Authentication', slug: 'authentication'},
                        {label: 'Request context', slug: 'request-context'},
                        {label: 'Error handling', slug: 'error-handling'},
                    ],
                },
                {
                    label: 'Client',
                    items: [
                        {label: 'SDK generation', slug: 'sdk-generation'},
                        {label: 'Client usage', slug: 'client-usage'},
                        {label: 'Shared validation', slug: 'shared-validation'},
                    ],
                },
                {
                    label: 'Docs UI',
                    items: [
                        {label: 'Overview', slug: 'docs-ui'},
                        {label: 'Branding', slug: 'docs-ui-branding'},
                        {label: 'Hosting (CloudFront / Pages)', slug: 'hosting-cloudfront-pages'},
                    ],
                },
                {
                    label: 'MCP Server',
                    items: [
                        {label: 'Overview', slug: 'mcp'},
                    ],
                },
                {
                    label: 'OpenAPI',
                    items: [
                        {label: 'Overview', slug: 'openapi'},
                        {label: 'Multi-language SDKs', slug: 'multi-language-sdks'},
                    ],
                },
                {
                    label: 'Project',
                    items: [
                        {label: 'Development', slug: 'development'},
                    ],
                },
            ],
        }),
    ],
});
