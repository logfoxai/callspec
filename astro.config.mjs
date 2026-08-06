import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
    site: 'https://logfoxai.github.io/callspec',
    outDir: './docs-site',
    integrations: [
        starlight({
            title: 'Callspec',
            description:
                'Spec-first TypeScript RPC: server, SDK, MCP, docs, and OpenAPI from one route() registry.',
            logo: {
                light: './src/assets/callspec-lockup-light.svg',
                dark: './src/assets/callspec-lockup-dark.svg',
                replacesTitle: true,
            },
            favicon: '/callspec-lockup-light.svg',
            customCss: ['./src/styles/starlight-custom.css'],
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
