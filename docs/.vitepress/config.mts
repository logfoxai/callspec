import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vitepress';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    title: 'Callspec',
    description: 'Spec-first TypeScript RPC: server, SDK, MCP, docs, and OpenAPI from one route() registry.',
    srcExclude: ['**/internal/**'],
    cleanUrls: true,
    head: [
        ['link', {rel: 'icon', href: '/callspec-lockup-light.svg'}],
    ],
    vite: {
        publicDir: path.resolve(dir, '../../assets'),
    },
    themeConfig: {
        nav: [
            {text: 'Guide', link: '/getting-started'},
            {text: 'API reference', link: '/api-reference'},
            {text: 'Agents', link: '/agents'},
            {text: 'GitHub', link: 'https://github.com/logfoxai/callspec'},
        ],
        sidebar: {
            '/api-reference': {base: '/api-reference/', items: sidebarApiReference()},
            '/api-reference/': {base: '/api-reference/', items: sidebarApiReference()},
            '/': {base: '/', items: sidebarGuide()},
        },
        socialLinks: [
            {icon: 'github', link: 'https://github.com/logfoxai/callspec'},
        ],
        search: {
            provider: 'local',
        },
    },
});

function sidebarGuide() {
    return [
        {
            text: 'Introduction',
            items: [
                {text: 'Getting started', link: '/getting-started'},
                {text: 'Server layout', link: '/server-layout'},
                {text: 'Unit testing', link: '/unit-testing'},
                {text: 'Complete example', link: '/complete-example'},
            ],
        },
        {
            text: 'Server',
            items: [
                {text: 'Authentication', link: '/authentication'},
                {text: 'Request context', link: '/request-context'},
                {text: 'Error handling', link: '/error-handling'},
            ],
        },
        {
            text: 'Client',
            items: [
                {text: 'SDK generation', link: '/sdk-generation'},
                {text: 'Client usage', link: '/client-usage'},
                {text: 'Shared validation', link: '/shared-validation'},
            ],
        },
        {
            text: 'Surfaces',
            items: [
                {text: 'Docs UI', link: '/docs-ui'},
                {text: 'MCP', link: '/mcp'},
                {text: 'OpenAPI', link: '/openapi'},
                {text: 'Callspec + Fern', link: '/using-fern-with-callspec'},
            ],
        },
        {
            text: 'Project',
            items: [
                {text: 'API reference', link: '/api-reference'},
                {text: 'For agents', link: '/agents'},
                {text: 'Development', link: '/development'},
            ],
        },
    ];
}

function sidebarApiReference() {
    return [
        {text: 'Overview', link: '/api-reference/'},
        {text: 'Resolvers', link: '/api-reference/resolvers'},
        {text: 'route & spec', link: '/api-reference/route-and-spec'},
        {text: 'mountSpec', link: '/api-reference/mount-spec'},
        {text: 'Auth and scope', link: '/api-reference/auth-and-scope'},
        {text: 'Surfaces & exports', link: '/api-reference/surfaces-and-exports'},
    ];
}
