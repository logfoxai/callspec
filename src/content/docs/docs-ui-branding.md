# Branding

Whitelabel the [Docs UI](./docs-ui.md) (and related OpenAPI / MCP names) via **`spec({ meta })`** &mdash; not `mountSpec` options.

```typescript
export const api = spec({
    meta: {
        title: 'Acme Catalog API',
        version: '1.2.0',
        intro: 'Product search and inventory for Acme storefronts.',
        website: {url: 'https://acme.example', label: 'acme.example'},
        logo: {
            light: './brand/logo-light.svg',
            dark: './brand/logo-dark.svg',
        },
        favicon: './brand/favicon.ico',
        theme: {
            accent: '#0ea5e9',
            background: '#0f172a',
            surface: '#1e293b',
            fontFamily: '"Inter Variable", system-ui, sans-serif',
            fontUrls: ['https://fonts.example/inter.css'],
        },
        navbarLinks: [
            {label: 'Dashboard', href: 'https://app.acme.example', external: true},
            {label: 'GitHub', href: 'https://github.com/acme/api', external: true},
        ],
        footer: {poweredBy: false},
        notice: {
            title: 'Sandbox',
            message: 'Read-only preview — use a local server for live try-it.',
            command: 'npm run dev',
            links: [{label: 'Development', href: '/development/'}],
        },
        sdkInstall: 'npm i @acme/sdk',
        authHint: 'Production keys from the developer portal. Header: Authorization: Bearer <key>.',
        mcpInstructions: 'Catalog API — search by SKU, check stock. Bearer required for write tools.',
    },
    routes: {searchProducts, getProductById},
});
```

| Field | Effect |
|-------|--------|
| `title` | Browser tab, header, OpenAPI title, MCP server name |
| `version` | Header (always), OpenAPI, MCP server version |
| `intro` | Home blurb. Home is omitted unless `intro`, `website`, or `sdkInstall` is set |
| `website` | Outbound link on home |
| `logo.light` / `logo.dark` | Top header + home mark (`dark` falls back to `light`). Omitted → Callspec hex |
| `favicon` | Docs tab icon (defaults to `logo.light` when omitted) |
| `theme` | CSS variables: `accent`, `background`, `surface`, `fontFamily`, plus optional `fontUrls[]`. Prefer **accent-only** to keep distinct light/dark modes. If you set `background` / `surface`, they pin both modes and Callspec derives readable text colors from the surface luminance. |
| `navbarLinks` | Top header links (`label`, `href`, optional `external`) |
| `footer.poweredBy` | Show “Powered by callspec” (default `true` when omitted) |
| `notice` | Optional plain-text banner above the top header (`title?`, `message`, `command?`, `links?`) &mdash; no custom HTML in message |
| `sdkInstall` | Static install command on the home page (copy button) |
| `authHint` | Copy in the MCP connect panel when bearer tools exist |
| `mcpInstructions` | MCP `instructions` on `initialize` &mdash; **agents** see this, not the docs chrome |

Custom HTML, inline CSS, and external override stylesheets are **not supported**. Use theme colors, logos, links, and `notice` for whitelabeling.

Per-route labels: `route({ meta: { summary, tags, description? } })` &mdash; sidebar grouping and route titles.

Field reference: [`spec` § Spec meta](./api-reference/spec.md#spec-meta).

## Logo files

Paths are relative to the **docs URL**. With `docsPath: '/docs'` and `logo: { light: './brand/mark.png' }`, the browser requests `/docs/brand/mark.png`.

```typescript
router.use('/docs/brand', express.static(path.join(__dirname, 'brand'), {index: false}));
mountSpec(router, api, {docsPath: '/docs'});
```

Or use absolute CDN URLs and skip static hosting.

## Layout hooks

Theme CSS variables (`--accent`, `--bg`, `--surface`, `--sans`, …) are the override surface. Stable classes:

| Class / id | Role |
|------------|------|
| `.top-header` | Sticky product header (logo, links, search, theme) |
| `.top-nav` / `.top-nav-link` | Product links from `navbarLinks` |
| `.cs-ui-notice` | Plain-text notice from `meta.notice` (above header) |
| `.sidebar` | Route navigation drawer / column |
| `.footer` | “Powered by callspec” footer |
| `#app` | App shell grid |
