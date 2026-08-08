# Docs UI

`mountSpec` serves a built-in, white-label API explorer — try RPCs, browse schemas, read error codes, and connect MCP clients. Branding and copy come from `spec({ meta })`; mount paths and on/off switches come from `mountSpec` options.

**Quick facts**

| | |
|--|--|
| Default path | `{mount}/docs` (override with `docsPath` on `mountSpec`) |
| Contract fetch | UI loads `{mount}/callspec.json` (path is fixed; not renamed by `docsPath`) |
| Disable | `mountSpec(router, spec, {docs: false})` — also hides `/callspec.json` and `/openapi.json` |
| Branding | `meta.title`, `intro`, `website`, `logo`, `authHint`, `mcpInstructions` on `spec()` |
| Per-route copy | `route({ meta: { summary, tags, description? } })` |

## What you get

- **Home** (when `meta.intro` is set) — title, optional logo, intro, website link, MCP connect panel
- **Route list** — default landing when there is no `intro`; grouped by `tags`, with summaries from each route’s `meta`
- **Route detail** — input/output schemas, error codes, try-it RPC form
- **MCP connect** (home page only) — copy endpoint URL and client config snippets; shows `authHint` when bearer MCP tools exist

OpenAPI (`/openapi.json`) and native contract (`/callspec.json`) are served alongside the UI when `docs` is enabled (default).

## Branding via `spec({ meta })`

All whitelabel fields live on the spec, not on `mountSpec`:

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

| Field | Where it shows up |
|-------|-------------------|
| `title` | Browser tab, docs header, OpenAPI title, MCP server name |
| `version` | OpenAPI version, MCP server version |
| `intro` | Home page paragraph under the title |
| `website` | Home page outbound link (`url` + optional `label`) |
| `logo.light` / `logo.dark` | Header mark and home hero; `dark` falls back to `light` |
| `authHint` | MCP connect panel on the home page when bearer routes exist (override the default hint) |
| `mcpInstructions` | MCP server `instructions` field only — agents see this via MCP `initialize`, not in the docs UI |

Field-by-field reference: [route & spec § Spec meta](./api-reference/route-and-spec.md#spec-meta).

### Logo assets

Logo URLs are resolved relative to the **docs UI path**. With `docsPath: '/docs'` and `logo: { light: './brand/mark.png' }`, the browser requests `/docs/brand/mark.png`.

Serve static files on the same router:

```typescript
router.use('/docs/brand', express.static(path.join(__dirname, 'brand'), {index: false}));
mountSpec(router, api, {docsPath: '/docs'});
```

Absolute URLs (`https://cdn.example/logo.svg`) work when you do not want to serve files from Express.

## Mount options

Path and enable/disable are **`mountSpec` options**, not `spec()` fields:

```typescript
mountSpec(router, api, {
    docs: true,           // default — set false to hide docs + contract + OpenAPI
    docsPath: '/explorer', // UI only; callspec.json stays at /callspec.json
    mcpPath: '/mcp',       // MCP HTTP endpoint (when any route has mcp: true)
});
```

Custom docs path example — UI at `/explorer`, contract unchanged:

```typescript
mountSpec(router, api, {docsPath: '/explorer'});
// UI:        /v1/explorer
// Contract:  /v1/callspec.json  (fixed)
// OpenAPI:   /v1/openapi.json   (fixed)
```

Full option list: [`mountSpec`](./api-reference/mount-spec.md).

## Related

- [MCP](./mcp.md) — enable tools with `mcp: true` on routes
- [OpenAPI](./openapi.md) — parallel export from the same routes
- [Getting started](./getting-started.md) — minimal server + client walkthrough
