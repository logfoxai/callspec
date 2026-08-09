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
| `intro` | Home blurb (also enables the home layout) |
| `website` | Outbound link on home |
| `logo.light` / `logo.dark` | Header + home mark (`dark` falls back to `light`) |
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
