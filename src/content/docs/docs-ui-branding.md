# Branding

Whitelabel the [Docs UI](./docs-ui.md) (and related OpenAPI / MCP names) via **`spec({ meta })`** — not `mountSpec` options.

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
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontUrls: ['https://fonts.example/plex.css'],
        },
        navbarLinks: [
            {label: 'Dashboard', href: 'https://app.acme.example', external: true},
            {label: 'GitHub', href: 'https://github.com/acme/api', external: true},
        ],
        footer: {poweredBy: false},
        authHint: 'Production keys from the developer portal. Header: Authorization: Bearer <key>.',
        mcpInstructions: 'Catalog API — search by SKU, check stock. Bearer required for write tools.',
    },
    routes: {searchProducts, getProductById},
});
```

| Field | Effect |
|-------|--------|
| `title` | Browser tab, header, OpenAPI title, MCP server name |
| `version` | OpenAPI + MCP server version |
| `intro` | Optional home blurb (home page is always on) |
| `website` | Outbound link on home |
| `logo.light` / `logo.dark` | Header + home mark (`dark` falls back to `light`) |
| `favicon` | Docs tab icon (defaults to `logo.light` when omitted) |
| `theme` | CSS variables: `accent`, `background`, `surface`, `fontFamily`, plus optional `fontUrls[]` |
| `navbarLinks` | Top header links (`label`, `href`, optional `external`) |
| `footer.poweredBy` | Show “Powered by callspec” (default `true` when omitted) |
| `authHint` | Copy in the MCP connect panel when bearer tools exist |
| `mcpInstructions` | MCP `instructions` on `initialize` — **agents** see this, not the docs chrome |

Per-route labels: `route({ meta: { summary, tags, description? } })` — sidebar grouping and route titles.

Field reference: [route & spec § Spec meta](./api-reference/route-and-spec.md#spec-meta).

## Logo files

Paths are relative to the **docs URL**. With `docsPath: '/docs'` and `logo: { light: './brand/mark.png' }`, the browser requests `/docs/brand/mark.png`.

```typescript
router.use('/docs/brand', express.static(path.join(__dirname, 'brand'), {index: false}));
mountSpec(router, api, {docsPath: '/docs'});
```

Or use absolute CDN URLs and skip static hosting.
