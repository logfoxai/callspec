import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';
import {remarkStarlightMdLinks} from './src/integrations/remark-starlight-md-links.mjs';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
    // Hover-prefetching every sidebar link hammers Vite in dev and freezes tabs.
    prefetch: isDev ? false : {prefetchAll: true, defaultStrategy: 'hover'},
    devToolbar: {enabled: false},
    markdown: {
        remarkPlugins: [remarkStarlightMdLinks],
    },
    site: 'https://logfoxai.github.io/callspec',
    outDir: './docs-site',
    // Brand / docs static media — single source of truth (also used by README)
    publicDir: './assets',
    // Dev server only (sec-fetch middleware): allow IDE embedded browsers (Cursor, etc.)
    // that load localhost with Sec-Fetch-Site: cross-site. Not used by static builds.
    security: {
        allowedDomains: [{}],
    },
    vite: {
        // Vite 8 defaults cssMinify to lightningcss, which drops unprefixed
        // backdrop-filter when -webkit- is present — Chromium then skips frost.
        // https://github.com/vitejs/vite/issues/22649
        build: {
            cssMinify: 'esbuild',
        },
        server: {
            cors: true,
        },
    },
    integrations: [
        starlight({
            title: 'Callspec',
            description: 'Write your API once. Get typed RPC, SDK, MCP, docs, and OpenAPI spec.',
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
                './src/styles/starlight-custom.css',
            ],
            components: {
                Head: './src/overrides/Head.astro',
                Hero: './src/overrides/Hero.astro',
                ThemeSelect: './src/overrides/ThemeSelect.astro',
                PageTitle: './src/overrides/PageTitle.astro',
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
                        {label: 'Coding agents', slug: 'coding-agents'},
                        {label: 'Server layout', slug: 'server-layout'},
                        {label: 'Unit testing', slug: 'unit-testing'},
                        {label: 'Complete example', slug: 'complete-example'},
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
                    label: 'Surfaces',
                    items: [
                        {label: 'Docs UI', slug: 'docs-ui'},
                        {label: 'MCP', slug: 'mcp'},
                        {label: 'OpenAPI', slug: 'openapi'},
                        {label: 'Callspec + Fern', slug: 'using-fern-with-callspec'},
                    ],
                },
                {
                    label: 'Project',
                    items: [
                        {label: 'Development', slug: 'development'},
                    ],
                },
                {
                    label: 'API reference',
                    items: [
                        {label: 'Overview', slug: 'api-reference'},
                        {label: 'Resolvers', slug: 'api-reference/resolvers'},
                        {label: 'route & spec', slug: 'api-reference/route-and-spec'},
                        {label: 'mountSpec', slug: 'api-reference/mount-spec'},
                        {label: 'Auth and scope', slug: 'api-reference/auth-and-scope'},
                        {
                            label: 'Surfaces & exports',
                            slug: 'api-reference/surfaces-and-exports',
                        },
                    ],
                },
            ],
        }),
    ],
});
