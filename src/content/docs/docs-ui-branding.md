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
| `version` | OpenAPI + MCP server version |
| `intro` | Optional home blurb (home page is always on) |
| `website` | Outbound link on home |
| `logo.light` / `logo.dark` | Header + home mark (`dark` falls back to `light`) |
| `favicon` | Docs tab icon (defaults to `logo.light` when omitted) |
| `theme` | CSS variables: `accent`, `background`, `surface`, `fontFamily`, plus optional `fontUrls[]`. Prefer **accent-only** to keep distinct light/dark modes. If you set `background` / `surface`, they pin both modes and Callspec derives readable text colors from the surface luminance. Escape hatches: `customCssUrl`, `customCss` — see below. |
| `navbarLinks` | Top header links (`label`, `href`, optional `external`) |
| `footer.poweredBy` | Show “Powered by callspec” (default `true` when omitted) |
| `sdkInstall` | Static install command on the home page (copy button) |
| `authHint` | Copy in the MCP connect panel when bearer tools exist |
| `mcpInstructions` | MCP `instructions` on `initialize` — **agents** see this, not the docs chrome |
| `headerHtml` | Last-resort HTML above the app shell — prefer `navbarLinks` |

Per-route labels: `route({ meta: { summary, tags, description? } })` — sidebar grouping and route titles.

Field reference: [route & spec § Spec meta](./api-reference/route-and-spec.md#spec-meta).

## Logo files

Paths are relative to the **docs URL**. With `docsPath: '/docs'` and `logo: { light: './brand/mark.png' }`, the browser requests `/docs/brand/mark.png`.

```typescript
router.use('/docs/brand', express.static(path.join(__dirname, 'brand'), {index: false}));
mountSpec(router, api, {docsPath: '/docs'});
```

Or use absolute CDN URLs and skip static hosting.

## Escape hatches (Tier 3)

Use these only when theme vars + `navbarLinks` are not enough. Callspec UI is a **live contract explorer**, not a docs CMS — do not build marketing sites or MDX guides here.

**Security:** set these only from **server-side** `meta` / mount options (your TypeScript config). Never accept them from query params, request bodies, or other untrusted input.

| Escape hatch | Where | Behavior |
|--------------|-------|----------|
| `theme.customCssUrl` | `meta.theme` | Injects `<link rel="stylesheet" href="…">` (href escaped). |
| Mount `customCssUrl` | `mountCallspecUi({ customCssUrl })` | Same link injection; **wins over** `meta.theme.customCssUrl`. |
| `theme.customCss` | `meta.theme` | Small inline `<style>` (capped at 8KB UTF-8; `</style` sequences stripped). |
| `headerHtml` | `meta` | Trusted HTML snippet above `#app`, wrapped in `.callspec-ui-header-html`. Prefer `navbarLinks`. Basic stripping of `<script>`, `<base>`, `on*` (including `/onload=`), and `javascript:` (including common HTML-entity encodings) — not a full HTML sanitizer. |

### When not to use them

- Prefer `theme.accent` / `background` / `surface` / `fontFamily` / `fontUrls` for brand color and type.
- Prefer `navbarLinks` for product / docs / GitHub links in the top header.
- Do **not** use `headerHtml` for user-generated content, CMS snippets, or anything that is not under your deploy-time control.
- Do **not** treat `customCss` as a place for large design systems — host a stylesheet and use `customCssUrl` (or fix the theme vars).

### Stable class hooks

Override carefully; these are the main layout hooks:

| Class / id | Role |
|------------|------|
| `.top-header` | Sticky product header |
| `.top-nav` / `.top-nav-link` | Product links from `navbarLinks` |
| `.sidebar` | Route navigation drawer / column |
| `.footer` | “Powered by callspec” footer |
| `#app` | App shell grid |
| `.callspec-ui-header-html` | Wrapper around `headerHtml` |

Theme CSS variables (`--accent`, `--bg`, `--surface`, `--sans`, …) remain the preferred override surface.

```typescript
theme: {
    accent: '#0ea5e9',
    customCssUrl: 'https://cdn.acme.example/docs-overrides.css',
    // or a tiny inline tweak (≤ 8KB):
    // customCss: '.top-header { border-bottom-color: var(--accent); }',
},
// last resort only — prefer navbarLinks:
// headerHtml: '<div class="acme-banner">…</div>',
```
