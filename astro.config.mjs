import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';
import {remarkStarlightMdLinks} from './src/integrations/remark-starlight-md-links.mjs';

export default defineConfig({
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
        server: {
            cors: true,
        },
    },
    integrations: [
        starlight({
            title: 'Callspec',
            description: 'Write your API once. Get HTTP RPC, SDK, MCP, docs, and OpenAPI spec.',
            logo: {
                light: './assets/callspec-lockup-light.svg',
                dark: './assets/callspec-lockup-dark.svg',
                replacesTitle: true,
            },
            favicon: '/favicon.svg',
            // Code block chrome lives in ec.config.mjs (ui-components Code look)
            expressiveCode: true,
            customCss: [
                '@fontsource/ibm-plex-sans/400.css',
                '@fontsource/ibm-plex-sans/500.css',
                '@fontsource/ibm-plex-sans/600.css',
                '@fontsource/ibm-plex-sans/700.css',
                '@fontsource/ibm-plex-mono/400.css',
                '@fontsource/ibm-plex-mono/500.css',
                './src/styles/starlight-custom.css',
                './src/styles/splash.css',
            ],
            components: {
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
